import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export type FeeMode = {
    __kind__: "perEvent";
    perEvent: bigint;
} | {
    __kind__: "allEventsFlat";
    allEventsFlat: bigint;
} | {
    __kind__: "basePlusAdditional";
    basePlusAdditional: {
        baseFee: bigint;
        additionalFee: bigint;
    };
};
export interface CompetitionResult {
    status: SolveStatus;
    user: Principal;
    attempts: Array<Attempt>;
    event: Event;
    userProfile?: UserProfile;
}
export interface Competition {
    id: bigint;
    status: CompetitionStatus;
    endDate: Time;
    scrambles: Array<[Array<string>, Event]>;
    name: string;
    slug: string;
    feeMode?: FeeMode;
    isActive: boolean;
    events: Array<Event>;
    isLocked: boolean;
    participantLimit?: bigint;
    startDate: Time;
}
export interface CompetitionPublic {
    id: bigint;
    status: CompetitionStatus;
    endDate: Time;
    name: string;
    slug: string;
    feeMode?: FeeMode;
    events: Array<Event>;
    participantLimit?: bigint;
    startDate: Time;
}
export interface Attempt {
    penalty: bigint;
    time: bigint;
}
export interface UserProfile {
    country?: string;
    displayName: string;
    gender?: string;
    mcubesId: string;
}
export enum CompetitionStatus {
    upcoming = "upcoming",
    completed = "completed",
    running = "running"
}
export enum Event {
    megaminx = "megaminx",
    fiveByFive = "fiveByFive",
    threeByThreeOneHanded = "threeByThreeOneHanded",
    clock = "clock",
    threeByThree = "threeByThree",
    pyraminx = "pyraminx",
    skewb = "skewb",
    twoByTwo = "twoByTwo",
    fourByFour = "fourByFour"
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
    getAllCompetitions(): Promise<Array<CompetitionPublic>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompetition(competitionId: bigint): Promise<Competition>;
    getCompetitionResults(competitionId: bigint, event: Event): Promise<Array<CompetitionResult>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
