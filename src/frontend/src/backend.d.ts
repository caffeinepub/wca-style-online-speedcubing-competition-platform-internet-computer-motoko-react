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
    event: Event;
    competitionId: bigint;
}
export interface CompetitionInput {
    status: CompetitionStatus;
    endDate: Time;
    scrambles: Array<[Array<string>, Event]>;
    name: string;
    slug: string;
    feeMode?: FeeMode;
    events: Array<Event>;
    participantLimit?: bigint;
    registrationStartDate?: Time;
    startDate: Time;
}
export type Time = bigint;
export interface RazorpayOrderRequest {
    event: Event;
    competitionId: bigint;
}
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
export interface CompetitionPublic {
    id: bigint;
    status: CompetitionStatus;
    endDate: Time;
    name: string;
    slug: string;
    feeMode?: FeeMode;
    events: Array<Event>;
    participantLimit?: bigint;
    registrationStartDate?: Time;
    startDate: Time;
}
export interface AttemptInput {
    penalty: bigint;
    time: bigint;
}
export interface PaymentConfirmation {
    razorpayPaymentId: string;
    razorpaySignature: string;
    event: Event;
    razorpayOrderId: string;
    competitionId: bigint;
}
export interface RazorpayOrderResponse {
    orderId: string;
    event: Event;
    currency: string;
    amount: bigint;
    competitionName: string;
}
export interface AdminResultEntry {
    status: SolveStatus;
    user: Principal;
    attempts: Array<Attempt>;
    event: Event;
    isHidden: boolean;
    competitionId: bigint;
}
export interface UserSummary {
    principal: Principal;
    isBlocked: boolean;
    email?: string;
    profile?: UserProfile;
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
    registrationStartDate?: Time;
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
    activateCompetition(competitionId: bigint, active: boolean): Promise<void>;
    adminBlockUser(user: Principal, blocked: boolean): Promise<void>;
    adminDeleteUser(user: Principal): Promise<void>;
    adminGetUserSolveHistory(user: Principal): Promise<Array<[bigint, Event, ResultInput]>>;
    adminListCompetitionResults(competitionId: bigint): Promise<Array<AdminResultEntry>>;
    adminListUsers(): Promise<Array<UserSummary>>;
    adminResetUserCompetitionStatus(user: Principal, competitionId: bigint, event: Event): Promise<void>;
    adminToggleResultVisibility(user: Principal, competitionId: bigint, event: Event, hidden: boolean): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    confirmPayment(confirmation: PaymentConfirmation): Promise<void>;
    createCompetition(comp: Competition): Promise<bigint>;
    createRazorpayOrder(request: RazorpayOrderRequest): Promise<RazorpayOrderResponse>;
    deleteCompetition(competitionId: bigint): Promise<void>;
    getAllCompetitions(): Promise<Array<CompetitionPublic>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompetition(competitionId: bigint): Promise<Competition>;
    getCompetitionResults(competitionId: bigint, event: Event): Promise<Array<CompetitionResult>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    lockCompetition(competitionId: bigint, locked: boolean): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startCompetitionSession(competitionId: bigint, event: Event): Promise<Uint8Array>;
    updateCompetition(competitionId: bigint, comp: CompetitionInput): Promise<void>;
}
