import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ResultInput {
    status: SolveStatus;
    user: Principal;
    attempts: Array<AttemptInput>;
    competitionId: bigint;
}
export type Time = bigint;
export interface AttemptInput {
    penalty: bigint;
    time: bigint;
}
export interface Competition {
    id: bigint;
    status: CompetitionStatus;
    endDate: Time;
    scrambles: Array<string>;
    name: string;
    slug: string;
    participantLimit?: bigint;
    startDate: Time;
}
export interface UserProfile {
    displayName: string;
}
export enum CompetitionStatus {
    upcoming = "upcoming",
    completed = "completed",
    running = "running"
}
export enum SolveStatus {
    in_progress = "in_progress",
    completed = "completed",
    not_started = "not_started"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCompetition(comp: Competition): Promise<bigint>;
    createUserProfile(profile: UserProfile): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompetition(id: bigint): Promise<Competition | null>;
    getCompetitions(): Promise<Array<Competition>>;
    getLeaderboard(competitionId: bigint): Promise<Array<ResultInput>>;
    getResults(competitionId: bigint): Promise<Array<ResultInput>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startCompetition(competitionId: bigint): Promise<void>;
    submitAttempt(competitionId: bigint, attemptIndex: bigint, attempt: AttemptInput): Promise<void>;
}
