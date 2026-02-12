import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LeaderboardEntry {
    bestTime: bigint;
    user: Principal;
    attempts: Array<Attempt>;
    userProfile?: PublicProfileInfo;
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
export interface SessionStateResponse {
    startTime?: bigint;
    isCompleted: boolean;
    endTime?: bigint;
    currentAttempt: bigint;
    attempts: Array<Attempt>;
    event: Event;
    inspectionStarted: boolean;
}
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
    events: Array<Event>;
    entryFee?: bigint;
    participantLimit?: bigint;
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
export interface Result {
    status: SolveStatus;
    user: Principal;
    attempts: Array<Attempt>;
    event: Event;
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
    isActive: boolean;
    events: Array<Event>;
    isLocked: boolean;
    entryFee?: bigint;
    participantLimit?: bigint;
    startDate: Time;
}
export interface AdminLeaderboardToggleResult {
    user: Principal;
    event: Event;
    isHidden: boolean;
    competitionId: bigint;
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
    activateCompetition(id: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(user: Principal): Promise<void>;
    confirmPayment(payment: PaymentConfirmation): Promise<void>;
    createCompetition(compInput: CompetitionInput): Promise<bigint>;
    createRazorpayOrder(request: RazorpayOrderRequest): Promise<RazorpayOrderResponse>;
    createUserProfile(displayName: string, country: string | null, gender: string | null): Promise<void>;
    deactivateCompetition(id: bigint): Promise<void>;
    deleteCompetition(id: bigint): Promise<void>;
    deleteUser(user: Principal): Promise<void>;
    duplicateCompetition(id: bigint): Promise<bigint>;
    generateSecureToken(): Promise<Uint8Array>;
    getCallerResult(competitionId: bigint, event: Event): Promise<Result | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompetition(id: bigint): Promise<Competition | null>;
    getCompetitions(): Promise<Array<CompetitionPublic>>;
    getLeaderboard(competitionId: bigint, event: Event): Promise<Array<LeaderboardEntry>>;
    getPublicProfileInfo(user: Principal): Promise<PublicProfileInfo | null>;
    getPublicResultsForUser(user: Principal, includeHidden: boolean): Promise<{
        results: Array<CompetitionResult>;
        profile?: PublicProfileInfo;
    }>;
    getRazorpayKeyId(): Promise<string | null>;
    getScramble(competitionId: bigint, event: Event, attemptNumber: bigint, sessionToken: Uint8Array): Promise<string | null>;
    getSessionState(competitionId: bigint, event: Event): Promise<SessionStateResponse | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isRazorpayConfigured(): Promise<boolean>;
    listAllUsers(): Promise<Array<UserSummary>>;
    listCompetitionResults(competitionId: bigint, event: Event): Promise<Array<CompetitionResult>>;
    lockCompetition(id: bigint): Promise<void>;
    resetUserCompetitionStatus(user: Principal, competitionId: bigint, event: Event): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setRazorpayCredentials(keyId: string, keySecret: string): Promise<void>;
    setUserEmail(email: string): Promise<void>;
    startCompetition(competitionId: bigint, event: Event): Promise<Uint8Array>;
    submitAttempt(competitionId: bigint, event: Event, attemptNumber: bigint, time: bigint, penalty: bigint, sessionToken: Uint8Array): Promise<void>;
    toggleLeaderboardEntryVisibility(user: Principal, competitionId: bigint, event: Event, shouldHide: boolean): Promise<AdminLeaderboardToggleResult>;
    unblockUser(user: Principal): Promise<void>;
    unlockCompetition(id: bigint): Promise<void>;
    updateCompetition(id: bigint, compInput: CompetitionInput): Promise<void>;
    updateResultAttempts(user: Principal, competitionId: bigint, event: Event, attempts: Array<AttemptInput>): Promise<void>;
}
