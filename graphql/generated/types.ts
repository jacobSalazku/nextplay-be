
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum AttendanceStatus {
    ATTENDING = "ATTENDING",
    NOT_ATTENDING = "NOT_ATTENDING",
    LATE = "LATE"
}

export enum Role {
    COACH = "COACH",
    PLAYER = "PLAYER"
}

export enum Status {
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
    INACTIVE = "INACTIVE"
}

export enum Location {
    HOME = "HOME",
    AWAY = "AWAY"
}

export enum ActivityType {
    GAME = "GAME",
    PRACTICE = "PRACTICE",
    FILM = "FILM",
    FEEDBACK = "FEEDBACK",
    MEETING = "MEETING"
}

export enum Category {
    OFFENSIVE = "OFFENSIVE",
    DEFENSIVE = "DEFENSIVE",
    SPECIAL = "SPECIAL"
}

export enum PracticeType {
    TEAM = "TEAM",
    SPECIALISATION = "SPECIALISATION",
    PHYSICAL = "PHYSICAL",
    SHOOTING = "SHOOTING"
}

export class GetActivityInput {
    routeKey: string;
    activityId: string;
}

export class GetActivitiesInput {
    routeKey: string;
}

export class GetGamePlansInput {
    routeKey: string;
}

export class GetGamePlanByIdInput {
    routeKey: string;
    id: string;
}

export class GetMemberProfileInput {
    id: string;
    teamShortId: string;
}

export class MembersInput {
    routeKey: string;
}

export class ActiveAttendedMembersInput {
    routeKey: string;
    activityId: string;
}

export class GetPlaysInput {
    routeKey: string;
}

export class GetPlayInput {
    id: string;
}

export class GetPracticePreparationsInput {
    routeKey: string;
}

export class GetPracticePreparationByIdInput {
    routeKey: string;
    id: string;
}

export class TeamStatlineInput {
    routeKey: string;
}

export class StatsPerGameInput {
    routeKey: string;
    memberId: string;
    year: number;
    month: number;
}

export class GetTeamInput {
    routeKey: string;
}

export class DeleteActivity {
    id: string;
}

export class CreateGameInput {
    title: string;
    time: string;
    duration: number;
    date: DateTime;
    teamId: string;
    location: Location;
    type: ActivityType;
}

export class UpdateGameInput {
    location?: Nullable<Location>;
}

export class CreatePracticeInput {
    title: string;
    time: string;
    duration: number;
    date: DateTime;
    teamId: string;
    facility: string;
    practiceType: PracticeType;
    type: ActivityType;
}

export class UpdatePracticeInput {
    facility?: Nullable<string>;
    practiceType?: Nullable<PracticeType>;
}

export class CreateMeetingInput {
    title: string;
    time: string;
    duration: number;
    date: DateTime;
    teamId: string;
    notes: string;
    type: ActivityType;
}

export class UpdateMeetingInput {
    notes?: Nullable<string>;
}

export class CreateFilmInput {
    title: string;
    time: string;
    duration: number;
    date: DateTime;
    teamId: string;
    notes: string;
    type: ActivityType;
}

export class UpdateFilmInput {
    notes?: Nullable<string>;
}

export class CreateFeedbackInput {
    title: string;
    time: string;
    duration: number;
    date: DateTime;
    teamId: string;
    coach: string;
    notes: string;
    type: ActivityType;
}

export class UpdateFeedbackInput {
    coach?: Nullable<string>;
    notes?: Nullable<string>;
}

export class GetAttendanceByActivitiesInput {
    activityId: string;
    memberId: string;
}

export class PlayerActivityAttendanceInput {
    activityId: string;
    memberId: string;
    reason: string;
    attendanceStatus: AttendanceStatus;
}

export class CreateGamePlanInput {
    routeKey: string;
    name: string;
    opponent?: Nullable<string>;
    notes?: Nullable<string>;
    activityId: string;
    playsId: string[];
}

export class DeleteGamePlanInput {
    routeKey: string;
    gamePlanId: string;
}

export class DeleteMemberInput {
    id: string;
}

export class CreatePlayInput {
    routeKey: string;
    name: string;
    description: string;
    category: Category;
    canvas: string;
}

export class DeletePlayInput {
    id: string;
    routeKey: string;
}

export class CreatePracticePreparationInput {
    routeKey: string;
    name: string;
    focus?: Nullable<string>;
    notes?: Nullable<string>;
    activityId: string;
    playsId: string[];
}

export class DeletePracticePreparationInput {
    routeKey: string;
    practicePreparationId: string;
}

export class SubmitStatlinesInput {
    routeKey: string;
    players: PlayerStatlineEntryInput[];
    opponentStatline?: Nullable<OpponentStatlineInput>;
}

export class PlayerStatlineEntryInput {
    memberId: string;
    activityId: string;
    statlines: StatlineValueInput[];
}

export class StatlineValueInput {
    fieldGoalsMade?: Nullable<number>;
    fieldGoalsMissed?: Nullable<number>;
    threePointersMade?: Nullable<number>;
    threePointersMissed?: Nullable<number>;
    freeThrows?: Nullable<number>;
    freeThrowsMissed?: Nullable<number>;
    assists?: Nullable<number>;
    steals?: Nullable<number>;
    turnovers?: Nullable<number>;
    offensiveRebounds?: Nullable<number>;
    defensiveRebounds?: Nullable<number>;
    blocks?: Nullable<number>;
}

export class OpponentStatlineInput {
    activityId: string;
    name: string;
    fieldGoalsMade: number;
    threePointersMade: number;
    freeThrowsMade: number;
}

export class CreateTeamInput {
    name: string;
    image?: Nullable<string>;
    ageGroup: string;
}

export class JoinTeamInput {
    teamCode: string;
    position: string;
    number: string;
}

export class AcceptTeamRequestInput {
    memberId: string;
    routeKey: string;
}

export class TeamRequestInput {
    memberId: string;
}

export class UpdateUserInput {
    name: string;
    dateOfBirth: string;
    phone: string;
    height: number;
    weight: number;
    dominantHand: string;
}

export class AttendanceActivity {
    id: string;
    title: string;
    time: string;
    date: DateTime;
}

export class PlayerActivityAttendance {
    id: string;
    activityId: string;
    memberId: string;
    reason?: Nullable<string>;
    attendanceStatus: AttendanceStatus;
    createdAt: DateTime;
    updatedAt: DateTime;
    activity?: Nullable<AttendanceActivity>;
}

export class UserDetail {
    id: string;
    name?: Nullable<string>;
    email?: Nullable<string>;
    image?: Nullable<string>;
    dateOfBirth?: Nullable<DateTime>;
    phone?: Nullable<string>;
    height?: Nullable<number>;
    weight?: Nullable<number>;
    dominantHand?: Nullable<string>;
    hasOnBoarded: boolean;
}

export class TeamMemberUser {
    id: string;
    userId: string;
    teamId: string;
    name?: Nullable<string>;
    image?: Nullable<string>;
}

export class Member {
    id: string;
    userId: string;
    teamId: string;
    role: Role;
    status: Status;
    number?: Nullable<string>;
    position?: Nullable<string>;
    name?: Nullable<string>;
    user?: Nullable<UserDetail>;
}

export class MemberWithAttendances {
    id: string;
    userId: string;
    teamId: string;
    role: Role;
    status: Status;
    number?: Nullable<string>;
    position?: Nullable<string>;
    name?: Nullable<string>;
    user?: Nullable<UserDetail>;
    attendances: PlayerActivityAttendance[];
}

export class MemberStatline {
    id: string;
    activityId: string;
    fieldGoalsMade: number;
    fieldGoalsMissed: number;
    threePointersMade: number;
    threePointersMissed: number;
    freeThrows: number;
    missedFreeThrows: number;
    assists: number;
    steals: number;
    turnovers: number;
    offensiveRebounds: number;
    defensiveRebounds: number;
    blocks: number;
}

export class MemberWithStatlines {
    id: string;
    userId: string;
    teamId: string;
    role: Role;
    status: Status;
    number?: Nullable<string>;
    position?: Nullable<string>;
    name?: Nullable<string>;
    user?: Nullable<UserDetail>;
    statlines: MemberStatline[];
}

export class PendingMember {
    id: string;
    name?: Nullable<string>;
    email?: Nullable<string>;
}

export class AuthPayload {
    accessToken: string;
    refreshToken: string;
    hasOnBoarded: boolean;
    userId: string;
}

export class User {
    id: string;
    name?: Nullable<string>;
    email: string;
    emailVerified?: Nullable<DateTime>;
    dateOfBirth?: Nullable<DateTime>;
    phone?: Nullable<string>;
    height?: Nullable<number>;
    weight?: Nullable<number>;
    dominantHand?: Nullable<string>;
    isBlocked: boolean;
    tokenVersion: number;
    hasOnBoarded: boolean;
    members: Member[];
}

export class OpponentStatline {
    name: string;
    fieldGoalsMade: number;
    threePointersMade: number;
    freeThrowsMade: number;
    activityId: string;
}

export class Game {
    id: string;
    title: string;
    date: DateTime;
    time: string;
    activityId: string;
    location: Location;
    opponentStatline?: Nullable<OpponentStatline>;
}

export class Practice {
    id: string;
    title: string;
    date: DateTime;
    time: string;
    activityId: string;
    facility: string;
    practicetype: string;
}

export class Film {
    activityId: string;
    notes: string;
}

export class Meeting {
    activityId: string;
    notes: string;
}

export class Feedback {
    activityId: string;
    coach: string;
    notes: string;
}

export class Activity {
    id: string;
    title: string;
    time: string;
    type: ActivityType;
    duration?: Nullable<number>;
    attendees: PlayerActivityAttendance[];
    date: DateTime;
    createdAt: DateTime;
    updatedAt: DateTime;
    teamId: string;
    game?: Nullable<Game>;
    practice?: Nullable<Practice>;
    film?: Nullable<Film>;
    meeting?: Nullable<Meeting>;
    feedback?: Nullable<Feedback>;
}

export class GamePlanActivity {
    id: string;
    title: string;
    date: DateTime;
    time: string;
}

export class GamePlanPlay {
    id: string;
    name: string;
    category: Category;
}

export class GamePlan {
    id: string;
    name: string;
    opponent?: Nullable<string>;
    notes?: Nullable<string>;
    activityId: string;
    teamId: string;
    createdAt: DateTime;
    updatedAt: DateTime;
    activity?: Nullable<GamePlanActivity>;
    plays: GamePlanPlay[];
}

export class TeamMemberInfo {
    id: string;
    name?: Nullable<string>;
    image?: Nullable<string>;
    number?: Nullable<string>;
    position?: Nullable<string>;
    teamId: string;
    user: UserDetail;
}

export class Play {
    id: string;
    routeKey: string;
    name: string;
    category: Category;
    description: string;
    canvas: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class PracticePreparationActivity {
    id: string;
    title: string;
    date: DateTime;
    time: string;
}

export class PracticePreparationPlay {
    id: string;
    name: string;
    category: Category;
}

export class PracticePreparation {
    id: string;
    name: string;
    focus?: Nullable<string>;
    notes?: Nullable<string>;
    activityId?: Nullable<string>;
    teamId: string;
    createdAt: DateTime;
    updatedAt: DateTime;
    activity?: Nullable<PracticePreparationActivity>;
    plays: PracticePreparationPlay[];
}

export class PlayerStatlineAverageValues {
    pointsPerGame: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
    assists: number;
    offensiveRebound: number;
    defensiveRebound: number;
    blocks: number;
    steals: number;
    turnovers: number;
}

export class PlayerStatlineAverage {
    memberId: string;
    name?: Nullable<string>;
    totalPoints: number;
    gamesPlayed: number;
    averages: PlayerStatlineAverageValues;
}

export class TeamAverageValues {
    pointsPerGame: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
    assists: number;
    rebounds: number;
    steals: number;
    blocks: number;
    turnovers: number;
}

export class TeamAdvancedValues {
    offensiveRating: number;
    trueShootingPercentage: number;
    assistToTurnoverRatio: number;
    netRating: number;
    effectiveFieldGoalPercentage: number;
}

export class TeamStats {
    totalGames: number;
    totalFieldGoalsMade: number;
    totalFieldGoalsMissed: number;
    totalThreePointersMade: number;
    totalThreePointersMissed: number;
    totalFreeThrows: number;
    totalFreeThrowsMissed: number;
    totalAssists: number;
    totalRebounds: number;
    totalSteals: number;
    totalBlocks: number;
    totalTurnovers: number;
    totalPoints: number;
    totalOpponentPoints: number;
    averages: TeamAverageValues;
    advanced: TeamAdvancedValues;
}

export class WeeklyTeamAverageValues {
    pointsPerGame: number;
    assistsPerGame: number;
    reboundsPerGame: number;
    blocksPerGame: number;
    stealsPerGame: number;
    turnoversPerGame: number;
}

export class WeeklyTeamAverage {
    weekStart: string;
    gamesPlayed: number;
    totalPoints: number;
    fieldGoalsMade: number;
    fieldGoalsMissed: number;
    threePointersMade: number;
    threePointersMissed: number;
    freeThrows: number;
    freeThrowsMissed: number;
    assists: number;
    rebounds: number;
    steals: number;
    blocks: number;
    turnovers: number;
    averages: WeeklyTeamAverageValues;
}

export class StatsPerGame {
    gameTitle: string;
    date?: Nullable<DateTime>;
    points: number;
    assists: number;
    rebounds: number;
    steals: number;
}

export class TeamTotalsBoxScore {
    fieldGoalsMade: number;
    threePointersMade: number;
    freeThrows: number;
    assists: number;
    offensiveRebounds: number;
    defensiveRebounds: number;
    steals: number;
    blocks: number;
    turnovers: number;
    points: number;
}

export class OpponentTotalsBoxScore {
    fieldGoalsMade: number;
    threePointersMade: number;
    freeThrowsMade: number;
    points: number;
}

export class PlayerBoxScore {
    memberId: string;
    name?: Nullable<string>;
    fieldGoalsMade: number;
    threePointersMade: number;
    freeThrows: number;
    assists: number;
    offensiveRebounds: number;
    defensiveRebounds: number;
    steals: number;
    blocks: number;
    turnovers: number;
    points: number;
}

export class GameWithBoxScore {
    activityId: string;
    title: string;
    date: DateTime;
    opponentName: string;
    opponentStats: OpponentTotalsBoxScore;
    teamTotals: TeamTotalsBoxScore;
    playerStats: PlayerBoxScore[];
}

export class SavedOpponentStatline {
    gameId: string;
    name: string;
    fieldGoalsMade: number;
    threePointersMade: number;
    freeThrowsMade: number;
}

export class SubmitStatlinesResult {
    success: boolean;
    count: number;
    opponentStatline?: Nullable<SavedOpponentStatline>;
}

export class TeamInformation {
    id: string;
    name: string;
    code: string;
    slug: string;
    routeKey: string;
    shortId: string;
    image?: Nullable<string>;
    ageGroup?: Nullable<string>;
    createdAt: DateTime;
    updatedAt: DateTime;
    creatorId: string;
    members: TeamMemberInfo[];
}

export class ModerateJoinRequestResult {
    memberId: string;
    teamId: string;
    status: Status;
}

export class JoinTeamResponse {
    teamCode: string;
    position: string;
    number: string;
}

export class MemberId {
    id: string;
}

export class Team {
    id: string;
    name: string;
    code: string;
    slug: string;
    shortId: string;
    routeKey: string;
    ageGroup?: Nullable<string>;
    image?: Nullable<string>;
    members: TeamMemberUser[];
    activities: Activity[];
    creatorId?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    updatedAt?: Nullable<DateTime>;
}

export class TeamDashboard {
    id: string;
    name: string;
    slug: string;
    shortId: string;
    routeKey: string;
    ageGroup?: Nullable<string>;
    members: MemberId[];
    activities: Activity[];
}

export class UserProfile {
    id: string;
    name?: Nullable<string>;
    email?: Nullable<string>;
    dateOfBirth?: Nullable<DateTime>;
    phone?: Nullable<string>;
    height?: Nullable<number>;
    weight?: Nullable<number>;
    dominantHand?: Nullable<string>;
    hasOnBoarded?: Nullable<boolean>;
}

export class GetUserResponse {
    user: UserProfile;
    member: MemberWithAttendances;
}

export abstract class IQuery {
    abstract _ping(): boolean | Promise<boolean>;

    abstract getActivities(teamShortId: string): Activity[] | Promise<Activity[]>;

    abstract getActivity(input: GetActivityInput): Activity | Promise<Activity>;

    abstract getGames(input: GetActivitiesInput): Activity[] | Promise<Activity[]>;

    abstract getPractices(input: GetActivitiesInput): Activity[] | Promise<Activity[]>;

    abstract me(): User | Promise<User>;

    abstract getGameplan(input: GetGamePlansInput): GamePlan[] | Promise<GamePlan[]>;

    abstract getGameplanById(input: GetGamePlanByIdInput): Nullable<GamePlan> | Promise<Nullable<GamePlan>>;

    abstract getMemberProfile(input: GetMemberProfileInput): MemberWithAttendances | Promise<MemberWithAttendances>;

    abstract getMembers(input: MembersInput): MemberWithAttendances[] | Promise<MemberWithAttendances[]>;

    abstract getPendingMembers(input: MembersInput): PendingMember[] | Promise<PendingMember[]>;

    abstract getActiveAttendedMembers(input: ActiveAttendedMembersInput): MemberWithStatlines[] | Promise<MemberWithStatlines[]>;

    abstract getPlays(input: GetPlaysInput): Play[] | Promise<Play[]>;

    abstract getPlay(input: GetPlayInput): Nullable<Play> | Promise<Nullable<Play>>;

    abstract getPracticePreparations(input: GetPracticePreparationsInput): PracticePreparation[] | Promise<PracticePreparation[]>;

    abstract getPracticePreparationById(input: GetPracticePreparationByIdInput): Nullable<PracticePreparation> | Promise<Nullable<PracticePreparation>>;

    abstract getStatlineAverages(input: TeamStatlineInput): PlayerStatlineAverage[] | Promise<PlayerStatlineAverage[]>;

    abstract getWeeklyTeamAverages(input: TeamStatlineInput): WeeklyTeamAverage[] | Promise<WeeklyTeamAverage[]>;

    abstract getTeamStats(input: TeamStatlineInput): TeamStats | Promise<TeamStats>;

    abstract getStatsPerGame(input: StatsPerGameInput): StatsPerGame[] | Promise<StatsPerGame[]>;

    abstract getGamesWithBoxScores(input: TeamStatlineInput): GameWithBoxScore[] | Promise<GameWithBoxScore[]>;

    abstract getTeam(input: GetTeamInput): TeamInformation | Promise<TeamInformation>;

    abstract getDashboardTeams(): TeamDashboard[] | Promise<TeamDashboard[]>;

    abstract getTeamActivities(routeKey: string): Team | Promise<Team>;

    abstract getCurrentUser(teamShortId: string): GetUserResponse | Promise<GetUserResponse>;
}

export abstract class IMutation {
    abstract deleteActivity(input: DeleteActivity): Activity | Promise<Activity>;

    abstract createGame(input: CreateGameInput): Activity | Promise<Activity>;

    abstract updateGame(input: UpdateGameInput): Activity | Promise<Activity>;

    abstract createPractice(input: CreatePracticeInput): Activity | Promise<Activity>;

    abstract updatePractice(input: UpdatePracticeInput): Activity | Promise<Activity>;

    abstract createMeeting(input: CreateMeetingInput): Activity | Promise<Activity>;

    abstract updateMeeting(input: UpdateMeetingInput): Activity | Promise<Activity>;

    abstract createFilm(input: CreateFilmInput): Activity | Promise<Activity>;

    abstract updateFilm(input: UpdateFilmInput): Activity | Promise<Activity>;

    abstract createFeedback(input: CreateFeedbackInput): Activity | Promise<Activity>;

    abstract updateFeedback(input: UpdateFeedbackInput): Activity | Promise<Activity>;

    abstract login(email: string): AuthPayload | Promise<AuthPayload>;

    abstract refresh(refreshToken: string): AuthPayload | Promise<AuthPayload>;

    abstract logout(): boolean | Promise<boolean>;

    abstract getAttendanceByActivities(input: GetAttendanceByActivitiesInput): PlayerActivityAttendance | Promise<PlayerActivityAttendance>;

    abstract submitAttendance(input: PlayerActivityAttendanceInput): PlayerActivityAttendance | Promise<PlayerActivityAttendance>;

    abstract createGamePlan(input: CreateGamePlanInput): GamePlan | Promise<GamePlan>;

    abstract deleteGamePlan(input: DeleteGamePlanInput): GamePlan | Promise<GamePlan>;

    abstract deleteMember(input: DeleteMemberInput): boolean | Promise<boolean>;

    abstract createPlay(input: CreatePlayInput): Play | Promise<Play>;

    abstract deletePlay(input: DeletePlayInput): boolean | Promise<boolean>;

    abstract createPracticePreparation(input: CreatePracticePreparationInput): PracticePreparation | Promise<PracticePreparation>;

    abstract deletePracticePreparation(input: DeletePracticePreparationInput): PracticePreparation | Promise<PracticePreparation>;

    abstract submitStatlines(input: SubmitStatlinesInput): SubmitStatlinesResult | Promise<SubmitStatlinesResult>;

    abstract createTeam(input: CreateTeamInput): Team | Promise<Team>;

    abstract joinTeam(input: JoinTeamInput): JoinTeamResponse | Promise<JoinTeamResponse>;

    abstract acceptTeamRequest(input: AcceptTeamRequestInput): ModerateJoinRequestResult | Promise<ModerateJoinRequestResult>;

    abstract rejectJoinRequest(input: TeamRequestInput): ModerateJoinRequestResult | Promise<ModerateJoinRequestResult>;

    abstract updateUser(input: UpdateUserInput): User | Promise<User>;
}

export type DateTime = any;
type Nullable<T> = T | null;
