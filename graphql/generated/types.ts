
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

export enum PracticeType {
    TEAM = "TEAM",
    SPECIALISATION = "SPECIALISATION",
    PHYSICAL = "PHYSICAL",
    SHOOTING = "SHOOTING"
}

export class GetMemberProfileInput {
    id: string;
    teamShortId: string;
}

export class MembersInput {
    teamRef: string;
}

export class GetTeamInput {
    teamRef: string;
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

export class DeleteMemberInput {
    id: string;
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
    teamRef: string;
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

export class Game {
    activityId: string;
    location: Location;
}

export class Practice {
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

export class TeamMemberInfo {
    id: string;
    name?: Nullable<string>;
    image?: Nullable<string>;
    number?: Nullable<string>;
    position?: Nullable<string>;
    teamId: string;
    user: UserDetail;
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

    abstract me(): User | Promise<User>;

    abstract getMemberProfile(input: GetMemberProfileInput): MemberWithAttendances | Promise<MemberWithAttendances>;

    abstract getMembers(input: MembersInput): MemberWithAttendances[] | Promise<MemberWithAttendances[]>;

    abstract getPendingMembers(input: MembersInput): PendingMember[] | Promise<PendingMember[]>;

    abstract getTeam(input: GetTeamInput): TeamInformation | Promise<TeamInformation>;

    abstract getDashboardTeams(): TeamDashboard[] | Promise<TeamDashboard[]>;

    abstract getTeamActivities(teamRef: string): Team | Promise<Team>;

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

    abstract deleteMember(input: DeleteMemberInput): boolean | Promise<boolean>;

    abstract createTeam(input: CreateTeamInput): Team | Promise<Team>;

    abstract joinTeam(input: JoinTeamInput): JoinTeamResponse | Promise<JoinTeamResponse>;

    abstract acceptTeamRequest(input: AcceptTeamRequestInput): ModerateJoinRequestResult | Promise<ModerateJoinRequestResult>;

    abstract rejectJoinRequest(input: TeamRequestInput): ModerateJoinRequestResult | Promise<ModerateJoinRequestResult>;

    abstract updateUser(input: UpdateUserInput): User | Promise<User>;
}

export type DateTime = any;
type Nullable<T> = T | null;
