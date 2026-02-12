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
    events: Array<Event>;
    entryFee?: bigint;
    participantLimit?: bigint;
    startDate: Time;
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
export interface AttemptInput {
    penalty: bigint;
    time: bigint;
}
export interface CompetitionPublic {
    id: bigint;
    status: CompetitionStatus;
    endDate: Time;
    name: string;
    slug: string;
    events: Array<Event>;
    entryFee?: bigint;
    participantLimit?: bigint;
    startDate: Time;
}
export interface PaidEvent {
    id: bigint;
    razorpayPaymentId: string;
    razorpaySignature: string;
    event: Event;
    razorpayOrderId: string;
    paymentDate: Time;
    entryFee: bigint;
    competitionName: string;
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
    events: Array<Event>;
    entryFee?: bigint;
    participantLimit?: bigint;
    startDate: Time;
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
    confirmPayment(payment: PaymentConfirmation): Promise<void>;
    createCompetition(compInput: CompetitionInput): Promise<bigint>;
    createRazorpayOrder(request: RazorpayOrderRequest): Promise<RazorpayOrderResponse>;
    createUserProfile(displayName: string, country: string | null, gender: string | null): Promise<void>;
    getAllUserPayments(): Promise<Array<PaymentConfirmation>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompetition(id: bigint): Promise<Competition | null>;
    getCompetitions(): Promise<Array<CompetitionPublic>>;
    getLeaderboard(competitionId: bigint, event: Event): Promise<Array<ResultInput>>;
    getMultiplePublicProfiles(users: Array<Principal>): Promise<Array<[Principal, PublicProfileInfo]>>;
    getPublicProfileInfo(user: Principal): Promise<PublicProfileInfo>;
    getRazorpayKeyId(): Promise<string | null>;
    getResults(competitionId: bigint, event: Event): Promise<Array<ResultInput>>;
    getUserPaymentHistory(): Promise<Array<PaidEvent>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserResult(competitionId: bigint, event: Event): Promise<ResultInput | null>;
    isCallerAdmin(): Promise<boolean>;
    isRazorpayConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setRazorpayCredentials(keyId: string, keySecret: string): Promise<void>;
    setUserEmail(email: string): Promise<void>;
    startCompetition(competitionId: bigint, event: Event): Promise<void>;
    submitAttempt(competitionId: bigint, event: Event, attemptIndex: bigint, attempt: AttemptInput): Promise<void>;
}
