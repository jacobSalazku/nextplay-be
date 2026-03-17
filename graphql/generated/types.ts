
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export class AuthPayload {
    accessToken: string;
    refreshToken: string;
}

export class User {
    id: string;
    email: string;
    emailVerified?: Nullable<DateTime>;
    isBlocked: boolean;
    tokenVersion: number;
}

export abstract class IQuery {
    abstract _ping(): boolean | Promise<boolean>;

    abstract me(): User | Promise<User>;
}

export abstract class IMutation {
    abstract login(email: string): AuthPayload | Promise<AuthPayload>;

    abstract refresh(refreshToken: string): AuthPayload | Promise<AuthPayload>;

    abstract logout(): boolean | Promise<boolean>;
}

export type DateTime = any;
type Nullable<T> = T | null;
