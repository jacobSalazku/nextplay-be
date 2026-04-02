
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum ActivityType {
    GAME = "GAME",
    PRACTICE = "PRACTICE",
    FILM = "FILM",
    FEEDBACK = "FEEDBACK",
    MEETING = "MEETING"
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
}

export class Activity {
    id: string;
    title: string;
    time: string;
    type: ActivityType;
    duration?: Nullable<number>;
    date: DateTime;
    createdAt: DateTime;
    updatedAt: DateTime;
    teamId: string;
}

export class TeamMemberUser {
    id: string;
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
    user: TeamMemberUser;
}

export class Team {
    id: string;
    name: string;
    code: string;
    ageGroup?: Nullable<string>;
    image?: Nullable<string>;
    creatorId: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class TeamDashboard {
    id: string;
    name: string;
    ageGroup?: Nullable<string>;
    members: Member[];
    activities: Activity[];
}

export abstract class IQuery {
    abstract _ping(): boolean | Promise<boolean>;

    abstract me(): User | Promise<User>;

    abstract getDashboardTeams(): TeamDashboard[] | Promise<TeamDashboard[]>;
}

export abstract class IMutation {
    abstract login(email: string): AuthPayload | Promise<AuthPayload>;

    abstract refresh(refreshToken: string): AuthPayload | Promise<AuthPayload>;

    abstract logout(): boolean | Promise<boolean>;

    abstract updateUser(input: UpdateUserInput): User | Promise<User>;

    abstract createTeam(input: CreateTeamInput): Team | Promise<Team>;
}

export type DateTime = any;
type Nullable<T> = T | null;
