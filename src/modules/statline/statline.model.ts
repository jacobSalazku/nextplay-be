import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PlayerStatlineAverageValues {
  @Field(() => Float)
  pointsPerGame: number;

  @Field(() => Float)
  fieldGoalPercentage: number;

  @Field(() => Float)
  threePointPercentage: number;

  @Field(() => Float)
  freeThrowPercentage: number;

  @Field(() => Float)
  assists: number;

  @Field(() => Float)
  offensiveRebound: number;

  @Field(() => Float)
  defensiveRebound: number;

  @Field(() => Float)
  blocks: number;

  @Field(() => Float)
  steals: number;

  @Field(() => Float)
  turnovers: number;
}

@ObjectType()
export class PlayerStatlineAverage {
  @Field()
  memberId: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Float)
  totalPoints: number;

  @Field(() => Int)
  gamesPlayed: number;

  @Field(() => PlayerStatlineAverageValues)
  averages: PlayerStatlineAverageValues;
}

@ObjectType()
export class TeamAverageValues {
  @Field(() => Float)
  pointsPerGame: number;

  @Field(() => Float)
  fieldGoalPercentage: number;

  @Field(() => Float)
  threePointPercentage: number;

  @Field(() => Float)
  freeThrowPercentage: number;

  @Field(() => Float)
  assists: number;

  @Field(() => Float)
  rebounds: number;

  @Field(() => Float)
  steals: number;

  @Field(() => Float)
  blocks: number;

  @Field(() => Float)
  turnovers: number;
}

@ObjectType()
export class TeamAdvancedValues {
  @Field(() => Float)
  offensiveRating: number;

  @Field(() => Float)
  trueShootingPercentage: number;

  @Field(() => Float)
  assistToTurnoverRatio: number;

  @Field(() => Float)
  netRating: number;

  @Field(() => Float)
  effectiveFieldGoalPercentage: number;
}

@ObjectType()
export class TeamStats {
  @Field(() => Int)
  totalGames: number;

  @Field(() => Float)
  totalFieldGoalsMade: number;

  @Field(() => Float)
  totalFieldGoalsMissed: number;

  @Field(() => Float)
  totalThreePointersMade: number;

  @Field(() => Float)
  totalThreePointersMissed: number;

  @Field(() => Float)
  totalFreeThrows: number;

  @Field(() => Float)
  totalFreeThrowsMissed: number;

  @Field(() => Float)
  totalAssists: number;

  @Field(() => Float)
  totalRebounds: number;

  @Field(() => Float)
  totalSteals: number;

  @Field(() => Float)
  totalBlocks: number;

  @Field(() => Float)
  totalTurnovers: number;

  @Field(() => Float)
  totalPoints: number;

  @Field(() => Float)
  totalOpponentPoints: number;

  @Field(() => TeamAverageValues)
  averages: TeamAverageValues;

  @Field(() => TeamAdvancedValues)
  advanced: TeamAdvancedValues;
}

@ObjectType()
export class WeeklyTeamAverageValues {
  @Field(() => Float)
  pointsPerGame: number;

  @Field(() => Float)
  assistsPerGame: number;

  @Field(() => Float)
  reboundsPerGame: number;

  @Field(() => Float)
  blocksPerGame: number;

  @Field(() => Float)
  stealsPerGame: number;

  @Field(() => Float)
  turnoversPerGame: number;
}

@ObjectType()
export class WeeklyTeamAverage {
  @Field()
  weekStart: string;

  @Field(() => Int)
  gamesPlayed: number;

  @Field(() => Float)
  totalPoints: number;

  @Field(() => Float)
  fieldGoalsMade: number;

  @Field(() => Float)
  fieldGoalsMissed: number;

  @Field(() => Float)
  threePointersMade: number;

  @Field(() => Float)
  threePointersMissed: number;

  @Field(() => Float)
  freeThrows: number;

  @Field(() => Float)
  freeThrowsMissed: number;

  @Field(() => Float)
  assists: number;

  @Field(() => Float)
  rebounds: number;

  @Field(() => Float)
  steals: number;

  @Field(() => Float)
  blocks: number;

  @Field(() => Float)
  turnovers: number;

  @Field(() => WeeklyTeamAverageValues)
  averages: WeeklyTeamAverageValues;
}

@ObjectType()
export class StatsPerGame {
  @Field()
  gameTitle: string;

  @Field({ nullable: true })
  date?: Date;

  @Field(() => Float)
  points: number;

  @Field(() => Float)
  assists: number;

  @Field(() => Float)
  rebounds: number;

  @Field(() => Float)
  steals: number;
}

@ObjectType()
export class TeamTotalsBoxScore {
  @Field(() => Float)
  fieldGoalsMade: number;

  @Field(() => Float)
  threePointersMade: number;

  @Field(() => Float)
  freeThrows: number;

  @Field(() => Float)
  assists: number;

  @Field(() => Float)
  offensiveRebounds: number;

  @Field(() => Float)
  defensiveRebounds: number;

  @Field(() => Float)
  steals: number;

  @Field(() => Float)
  blocks: number;

  @Field(() => Float)
  turnovers: number;

  @Field(() => Float)
  points: number;
}

@ObjectType()
export class OpponentTotalsBoxScore {
  @Field(() => Float)
  fieldGoalsMade: number;

  @Field(() => Float)
  threePointersMade: number;

  @Field(() => Float)
  freeThrowsMade: number;

  @Field(() => Float)
  points: number;
}

@ObjectType()
export class PlayerBoxScore {
  @Field()
  memberId: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Float)
  fieldGoalsMade: number;

  @Field(() => Float)
  threePointersMade: number;

  @Field(() => Float)
  freeThrows: number;

  @Field(() => Float)
  assists: number;

  @Field(() => Float)
  offensiveRebounds: number;

  @Field(() => Float)
  defensiveRebounds: number;

  @Field(() => Float)
  steals: number;

  @Field(() => Float)
  blocks: number;

  @Field(() => Float)
  turnovers: number;

  @Field(() => Float)
  points: number;
}

@ObjectType()
export class GameWithBoxScore {
  @Field()
  activityId: string;

  @Field()
  title: string;

  @Field()
  date: Date;

  @Field()
  opponentName: string;

  @Field(() => OpponentTotalsBoxScore)
  opponentStats: OpponentTotalsBoxScore;

  @Field(() => TeamTotalsBoxScore)
  teamTotals: TeamTotalsBoxScore;

  @Field(() => [PlayerBoxScore])
  playerStats: PlayerBoxScore[];
}

@ObjectType()
export class SavedOpponentStatline {
  @Field()
  gameId: string;

  @Field()
  name: string;

  @Field(() => Float)
  fieldGoalsMade: number;

  @Field(() => Float)
  threePointersMade: number;

  @Field(() => Float)
  freeThrowsMade: number;
}

@ObjectType()
export class SubmitStatlinesResult {
  @Field()
  success: boolean;

  @Field(() => Int)
  count: number;

  @Field(() => SavedOpponentStatline, { nullable: true })
  opponentStatline?: SavedOpponentStatline;
}
