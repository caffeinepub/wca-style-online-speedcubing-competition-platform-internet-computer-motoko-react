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
export interface RazorpayOrderResponse {
    orderId: string;
    event: Event;
    currency: string;
    amount: bigint;
    competitionName: string;
}
export interface RazorpayOrderRequest {
    event: Event;
    competitionId: bigint;
}
export interface CompetitionResult {
    status: SolveStatus;
    user: Principal;
    attempts: Array<Attempt>;
    event: Event;
    userProfile?: UserProfile;
}
export interface AttemptInput {
    penalty: bigint;
    time: bigint;
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
export interface PaymentConfirmation {
    razorpayPaymentId: string;
    razorpaySignature: string;
    event: Event;
    razorpayOrderId: string;
    competitionId: bigint;
}
export interface FeeMode {
    perEvent?: bigint;
    basePlusAdditional?: { baseFee: bigint; additionalFee: bigint };
    allEventsFlat?: bigint;
}
export interface CompetitionPublic {
    id: bigint;
    name: string;
    slug: string;
    startDate: bigint;
    endDate: bigint;
    status: CompetitionStatus;
    participantLimit?: bigint;
    feeMode?: FeeMode;
    events: Array<Event>;
}
export interface Competition {
    id: bigint;
    name: string;
    slug: string;
    startDate: bigint;
    endDate: bigint;
    status: CompetitionStatus;
    participantLimit?: bigint;
    feeMode?: FeeMode;
    events: Array<Event>;
    scrambles: Array<[Array<string>, Event]>;
    isActive: boolean;
    isLocked: boolean;
}
export interface CompetitionInput {
    name: string;
    slug: string;
    startDate: bigint;
    endDate: bigint;
    status: CompetitionStatus;
    participantLimit?: bigint;
    feeMode?: FeeMode;
    events: Array<Event>;
    scrambles: Array<[Array<string>, Event]>;
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
export enum CompetitionStatus {
    upcoming = "upcoming",
    running = "running",
    completed = "completed"
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
    duplicateCompetition(id: bigint): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompetitionResults(competitionId: bigint, event: Event): Promise<Array<CompetitionResult>>;
    getRazorpayKeyId(): Promise<string | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isRazorpayConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setRazorpayCredentials(keyId: string, keySecret: string): Promise<void>;
    startSolveSession(competitionId: bigint, event: Event): Promise<void>;
    submitResult(result: ResultInput): Promise<void>;
}
