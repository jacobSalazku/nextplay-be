
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum Role {
    COACH = "COACH",
    PLAYER = "PLAYER"
}

export enum Status {
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
    INACTIVE = "INACTIVE"
}

export enum AttendanceStatus {
    ATTENDING = "ATTENDING",
    NOT_ATTENDING = "NOT_ATTENDING",
    LATE = "LATE"
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

export class UpdateUserInput {
    name: string;
    dateOfBirth: string;
    phone: string;
    height: number;
    weight: number;
    dominantHand: string;
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

export class ApproveJoinRequestInput {
    memberId: string;
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
    id: string;
    title?: Nullable<string>;
    time?: Nullable<string>;
    date?: Nullable<DateTime>;
    duration?: Nullable<number>;
    type: ActivityType;
    teamId: string;
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
    id: string;
    title?: Nullable<string>;
    time?: Nullable<string>;
    date?: Nullable<DateTime>;
    duration?: Nullable<number>;
    type: ActivityType;
    teamId: string;
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
    id: string;
    title?: Nullable<string>;
    time?: Nullable<string>;
    date?: Nullable<DateTime>;
    duration?: Nullable<number>;
    type: ActivityType;
    teamId: string;
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
    id: string;
    title?: Nullable<string>;
    time?: Nullable<string>;
    date?: Nullable<DateTime>;
    duration?: Nullable<number>;
    type: ActivityType;
    teamId: string;
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
    id: string;
    title?: Nullable<string>;
    time?: Nullable<string>;
    date?: Nullable<DateTime>;
    duration?: Nullable<number>;
    type: ActivityType;
    teamId: string;
    coach?: Nullable<string>;
    notes?: Nullable<string>;
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

export class PlayerActivityAttendance {
    id: string;
    memberId: string;
    reason?: Nullable<string>;
    attendanceStatus: AttendanceStatus;
    createdAt: DateTime;
    updatedAt: DateTime;
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
    members: Member[];
    activities: Activity[];
}

export class UserProfile {
    id: string;
    name?: Nullable<string>;
    email: string;
    dateOfBirth?: Nullable<DateTime>;
    phone?: Nullable<string>;
    height?: Nullable<number>;
    weight?: Nullable<number>;
    dominantHand?: Nullable<string>;
    hasOnBoarded: boolean;
}

export class GetUserResponse {
    user: UserProfile;
    member: Member;
}

export abstract class IQuery {
    abstract _ping(): boolean | Promise<boolean>;

    abstract me(): User | Promise<User>;

    abstract getUserById(teamShortId: string): GetUserResponse | Promise<GetUserResponse>;

    abstract getDashboardTeams(): TeamDashboard[] | Promise<TeamDashboard[]>;

    abstract getTeamActivities(teamRef: string): Team | Promise<Team>;

    abstract getActivities(teamShortId: string): Activity[] | Promise<Activity[]>;
}

export abstract class IMutation {
    abstract login(email: string): AuthPayload | Promise<AuthPayload>;

    abstract refresh(refreshToken: string): AuthPayload | Promise<AuthPayload>;

    abstract logout(): boolean | Promise<boolean>;

    abstract updateUser(input: UpdateUserInput): User | Promise<User>;

    abstract createTeam(input: CreateTeamInput): Team | Promise<Team>;

    abstract joinTeam(input: JoinTeamInput): JoinTeamResponse | Promise<JoinTeamResponse>;

    abstract approveJoinRequest(input: ApproveJoinRequestInput): ModerateJoinRequestResult | Promise<ModerateJoinRequestResult>;

    abstract rejectJoinRequest(input: ApproveJoinRequestInput): ModerateJoinRequestResult | Promise<ModerateJoinRequestResult>;

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
}

export type DateTime = any;
type Nullable<T> = T | null;
