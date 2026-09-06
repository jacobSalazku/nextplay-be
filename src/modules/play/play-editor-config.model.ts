import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { CourtType, PlayActionType, PlayObjectKind } from './play.enums';

@ObjectType('FormationPreset')
export class FormationPresetModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(() => CourtType)
  court: CourtType;

  @Field(() => GraphQLJSON)
  objects: unknown;
}

@ObjectType()
export class PlayEditorConfig {
  @Field(() => [PlayActionType])
  actionTypes: PlayActionType[];

  @Field(() => [PlayObjectKind])
  objectKinds: PlayObjectKind[];

  @Field(() => [CourtType])
  courts: CourtType[];

  @Field(() => [FormationPresetModel])
  formations: FormationPresetModel[];
}
