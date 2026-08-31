import { readFileSync } from 'fs';
import { join } from 'path';
import { buildSchema, parse, validate } from 'graphql';
import { maxAliasesRule, maxDepthRule } from '../query-limits';

const schema = buildSchema(
  readFileSync(join(process.cwd(), 'graphql/schema.graphql'), 'utf8'),
);

const errors = (
  query: string,
  rule: ReturnType<typeof maxDepthRule>,
): string[] => validate(schema, parse(query), [rule]).map((e) => e.message);

const DEEPEST_REAL_QUERY = `query {
  getActivity(input: { routeKey: "x", activityId: "y" }) {
    game { opponentStatline { name } }
  }
}`;

describe('maxDepthRule', () => {
  it('passes the deepest query the app actually issues', () => {
    expect(errors(DEEPEST_REAL_QUERY, maxDepthRule(8))).toEqual([]);
  });

  it('reports a query nested past the limit', () => {
    expect(errors(DEEPEST_REAL_QUERY, maxDepthRule(2))).toEqual([
      'Query is too deep: 4 levels, maximum is 2.',
    ]);
  });

  it('counts depth reached through a fragment spread', () => {
    const viaFragment = `query { ...D }
      fragment D on Query {
        getActivity(input: { routeKey: "x", activityId: "y" }) {
          game { opponentStatline { name } }
        }
      }`;

    expect(errors(viaFragment, maxDepthRule(2))[0]).toMatch(/too deep/i);
  });
});

describe('maxAliasesRule', () => {
  it('allows a query within the alias budget', () => {
    expect(
      errors(`query { a: me { id } b: me { id } }`, maxAliasesRule(15)),
    ).toEqual([]);
  });

  it('reports once when the document has too many aliases', () => {
    const aliases = Array.from({ length: 17 }, (_, i) => `a${i}: me { id }`);

    expect(
      errors(`query { ${aliases.join(' ')} }`, maxAliasesRule(15)),
    ).toEqual(['Too many aliases: maximum is 15.']);
  });
});
