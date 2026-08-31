import {
  type ASTVisitor,
  type FieldNode,
  GraphQLError,
  Kind,
  type OperationDefinitionNode,
  type SelectionSetNode,
  type ValidationContext,
} from 'graphql';

/**
 * Hand-rolled `validationRules` for ApolloServer. They run in the validation
 * phase — before any resolver, guard or DB work — and report through
 * `context.reportError`, so a rejected query comes back as a normal
 * `GRAPHQL_VALIDATION_FAILED` (HTTP 400), not a masked 500.
 *
 * We rolled our own rather than pull `@escape.tech/graphql-armor-*`: those
 * rules `throw` instead of reporting (ApolloServer then treats it as an
 * internal error) and peer-depend on `@apollo/server@^4` while we're on 5.
 */

/** Longest chain of nested fields a single operation may request. */
export function maxDepthRule(limit: number) {
  return (context: ValidationContext): ASTVisitor => {
    const measure = (
      selectionSet: SelectionSetNode,
      seenFragments: Set<string>,
    ): number => {
      let deepest = 0;

      for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          const childDepth = selection.selectionSet
            ? measure(selection.selectionSet, seenFragments)
            : 0;
          deepest = Math.max(deepest, 1 + childDepth);
        } else if (selection.kind === Kind.INLINE_FRAGMENT) {
          deepest = Math.max(
            deepest,
            measure(selection.selectionSet, seenFragments),
          );
        } else if (!seenFragments.has(selection.name.value)) {
          const fragment = context.getFragment(selection.name.value);
          if (fragment) {
            deepest = Math.max(
              deepest,
              measure(
                fragment.selectionSet,
                new Set(seenFragments).add(selection.name.value),
              ),
            );
          }
        }
      }

      return deepest;
    };

    return {
      OperationDefinition(node: OperationDefinitionNode) {
        const depth = measure(node.selectionSet, new Set());
        if (depth > limit) {
          context.reportError(
            new GraphQLError(
              `Query is too deep: ${depth} levels, maximum is ${limit}.`,
              { nodes: [node] },
            ),
          );
        }
      },
    };
  };
}

/** Total aliased fields allowed in one document (alias-amplification guard). */
export function maxAliasesRule(limit: number) {
  return (context: ValidationContext): ASTVisitor => {
    let aliases = 0;

    return {
      Field(node: FieldNode) {
        if (node.alias) {
          aliases += 1;
          if (aliases === limit + 1) {
            context.reportError(
              new GraphQLError(`Too many aliases: maximum is ${limit}.`, {
                nodes: [node],
              }),
            );
          }
        }
      },
    };
  };
}
