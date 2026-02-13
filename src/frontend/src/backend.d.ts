import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RazorpayCredentials {
    keyId: string;
    keySecret: string;
}
export interface LeaderboardEntry {
    ao5?: bigint;
    bestTime: bigint;
    user: Principal;
    attempts: Array<Attempt>;
    userProfile?: PublicProfileInfo;
}
export type Time = bigint;
export interface PublicProfileInfo {
    country?: string;
    displayName: string;
    gender?: string;
}
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
export interface CompetitorResults {
    results: Array<CompetitionResult>;
    competitor: Principal;
}
export interface CompetitionResult {
    ao5?: bigint;
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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    confirmPayment(confirmation: PaymentConfirmation): Promise<void>;
    createRazorpayOrder(request: RazorpayOrderRequest): Promise<RazorpayOrderResponse>;
    getAllCompetitions(): Promise<Array<CompetitionPublic>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompetition(competitionId: bigint): Promise<Competition>;
    getCompetitionLeaderboard(competitionId: bigint, event: Event): Promise<Array<LeaderboardEntry>>;
    getCompetitionResults(competitionId: bigint, event: Event): Promise<Array<CompetitionResult>>;
    getCompetitorResults(competitor: Principal): Promise<CompetitorResults>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasRazorpayConfig(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setRazorpayCredentials(credentials: RazorpayCredentials): Promise<void>;
    startOrResumeCompetitionSession(competitionId: bigint, event: Event): Promise<Uint8Array>;
}
