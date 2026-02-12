import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import Nat8 "mo:core/Nat8";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  module NatPrincipalEvent {
    public func compare(x : (Nat, Principal, Event), y : (Nat, Principal, Event)) : Order.Order {
      switch (Nat.compare(x.0, y.0)) {
        case (#equal) {
          switch (Principal.compare(x.1, y.1)) {
            case (#equal) {
              compareEvents(x.2, y.2);
            };
            case (other) { other };
          };
        };
        case (other) { other };
      };
    };

    public func compareEvents(a : Event, b : Event) : Order.Order {
      func eventToNat(e : Event) : Nat {
        switch (e) {
          case (#twoByTwo) { 0 };
          case (#threeByThree) { 1 };
          case (#fourByFour) { 2 };
          case (#fiveByFive) { 3 };
          case (#skewb) { 4 };
          case (#megaminx) { 5 };
          case (#clock) { 6 };
          case (#threeByThreeOneHanded) { 7 };
          case (#pyraminx) { 8 };
        };
      };
      Nat.compare(eventToNat(a), eventToNat(b));
    };
  };

  public type PaidEvent = {
    id : Nat;
    competitionName : Text;
    event : Event;
    entryFee : Nat;
    paymentDate : Time.Time;
    razorpayOrderId : Text;
    razorpayPaymentId : Text;
    razorpaySignature : Text;
  };

  public type CompetitionStatus = {
    #upcoming;
    #running;
    #completed;
  };

  public type SolveStatus = {
    #not_started;
    #in_progress;
    #completed;
  };

  public type UserProfile = {
    displayName : Text;
    mcubesId : Text;
    country : ?Text;
    gender : ?Text;
  };

  public type PublicProfileInfo = {
    displayName : Text;
    country : ?Text;
    gender : ?Text;
  };

  public type FeeMode = {
    #perEvent : Nat;
    #basePlusAdditional : { baseFee : Nat; additionalFee : Nat };
    #allEventsFlat : Nat;
  };

  public type Competition = {
    id : Nat;
    name : Text;
    slug : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : CompetitionStatus;
    participantLimit : ?Nat;
    feeMode : ?FeeMode;
    events : [Event];
    scrambles : [([Text], Event)];
    isActive : Bool;
    isLocked : Bool;
  };

  public type CompetitionPublic = {
    id : Nat;
    name : Text;
    slug : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : CompetitionStatus;
    participantLimit : ?Nat;
    feeMode : ?FeeMode;
    events : [Event];
  };

  public type Attempt = {
    time : Nat;
    penalty : Nat;
  };

  public type Result = {
    user : Principal;
    competitionId : Nat;
    event : Event;
    attempts : [Attempt];
    status : SolveStatus;
  };

  public type ResultInput = {
    user : Principal;
    competitionId : Nat;
    event : Event;
    attempts : [AttemptInput];
    status : SolveStatus;
  };

  public type AttemptInput = {
    time : Nat;
    penalty : Nat;
  };

  public type CompetitionInput = {
    name : Text;
    slug : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : CompetitionStatus;
    participantLimit : ?Nat;
    feeMode : ?FeeMode;
    events : [Event];
    scrambles : [([Text], Event)];
  };

  public type RazorpayOrderRequest = {
    competitionId : Nat;
    event : Event;
  };

  public type RazorpayOrderResponse = {
    orderId : Text;
    amount : Nat;
    currency : Text;
    competitionName : Text;
    event : Event;
  };

  public type PaymentConfirmation = {
    competitionId : Nat;
    event : Event;
    razorpayOrderId : Text;
    razorpayPaymentId : Text;
    razorpaySignature : Text;
  };

  public type UserSummary = {
    principal : Principal;
    profile : ?UserProfile;
    email : ?Text;
    isBlocked : Bool;
  };

  public type SolveSession = {
    sessionToken : [Nat8];
    event : Event;
    createdAt : Time.Time;
    lastUpdated : Time.Time;
    currentAttempt : Nat;
    inspectionStarted : Bool;
    startTime : ?Nat;
    endTime : ?Nat;
    attempts : [Attempt];
    competitionId : Nat;
    isCompleted : Bool;
  };

  public type SessionStateResponse = {
    currentAttempt : Nat;
    inspectionStarted : Bool;
    startTime : ?Nat;
    endTime : ?Nat;
    attempts : [Attempt];
    isCompleted : Bool;
    event : Event;
  };

  public type CompetitionResult = {
    user : Principal;
    userProfile : ?UserProfile;
    event : Event;
    attempts : [Attempt];
    status : SolveStatus;
  };

  public type AttemptValidation = {
    time : Nat;
    penalty : Nat;
    isValid : Bool;
    validationTime : Time.Time;
  };

  public type JudgeDecision = {
    judgeName : Text;
    decisionTime : Time.Time;
    notes : ?Text;
  };

  public type CompetitionResultValidation = {
    id : ?Nat;
    result : ?CompetitionResult;
    judgeName : Text;
    decisionTime : Time.Time;
    attempts : [AttemptValidation];
    finalTime : ?Nat;
    notes : ?Text;
    decision : Text;
  };

  public type Event = {
    #twoByTwo;
    #threeByThree;
    #fourByFour;
    #fiveByFive;
    #skewb;
    #megaminx;
    #clock;
    #threeByThreeOneHanded;
    #pyraminx;
  };

  public type AdminScrambleView = {
    id : Nat;
    event : Event;
    scrambleRecords : [(Text, Bool)];
  };

  public type EventScrambles = {
    event : Event;
    scrambles : [Text];
  };

  public type ResultSession = {
    user : Principal;
    resultId : Nat;
    attempts : [Nat];
    penalties : [Nat];
    event : Event;
    status : SolveStatus;
    attemptNo : Nat;
  };

  public type LeaderboardEntry = {
    user : Principal;
    userProfile : ?PublicProfileInfo;
    attempts : [Attempt];
    bestTime : Nat;
  };

  public type AdminLeaderboardToggleResult = {
    user : Principal;
    competitionId : Nat;
    event : Event;
    isHidden : Bool;
  };

  var nextCompetitionId = 0;
  var nextMcubesId = 1;
  var nextOrderId = 0;
  var nextPaymentId = 0;
  let competitions = Map.empty<Nat, Competition>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let activeSessions = Map.empty<(Nat, Principal, Event), SolveSession>();
  let payments = Map.empty<(Nat, Principal, Event), PaymentConfirmation>();
  let results = Map.empty<(Nat, Principal, Event), ResultInput>();
  let userEmails = Map.empty<Principal, Text>();
  let hiddenLeaderboardEntries = Map.empty<(Nat, Principal, Event), Bool>();
  let blockedUsers = Map.empty<Principal, Bool>();
  let userPayments = Map.empty<Principal, Map.Map<Nat, PaidEvent>>();
  var razorpayKeySecret : ?Text = null;
  var razorpayKeyId : ?Text = null;
  let createdOrders = Map.empty<Text, (Principal, Nat, Event)>();

  let emailAllowlist : [Text] = [
    "midhun.speedcuber@gmail.com",
    "thirdparty.mcubes@gmail.com"
  ];

  module Result {
    public func compareByBestScore(a : ResultInput, b : ResultInput) : Order.Order {
      let bestScoreA = a.attempts[0].time + a.attempts[0].penalty;
      let bestScoreB = b.attempts[0].time + b.attempts[0].penalty;
      Nat.compare(bestScoreA, bestScoreB);
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  private func toPublicCompetition(comp : Competition) : CompetitionPublic {
    {
      id = comp.id;
      name = comp.name;
      slug = comp.slug;
      startDate = comp.startDate;
      endDate = comp.endDate;
      status = comp.status;
      participantLimit = comp.participantLimit;
      feeMode = comp.feeMode;
      events = comp.events;
    };
  };

  public query ({ caller }) func getAllCompetitions() : async [CompetitionPublic] {
    let allComps = competitions.values().toArray();
    let activeComps = allComps.filter(func(c) { c.isActive });
    activeComps.map<Competition, CompetitionPublic>(toPublicCompetition);
  };

  public query ({ caller }) func getCompetition(competitionId : Nat) : async Competition {
    switch (competitions.get(competitionId)) {
      case (?c) { c };
      case (null) { Runtime.trap("Competition does not exist") };
    };
  };

  public query ({ caller }) func getCompetitionResults(competitionId : Nat, event : Event) : async [CompetitionResult] {
    let comp = switch (competitions.get(competitionId)) {
      case (?c) { c };
      case (null) { Runtime.trap("Competition does not exist") };
    };

    let filteredResults = results.filter(
      func((cid, _, eventId), result) {
        cid == competitionId and event == eventId and result.status == #completed and not (hiddenLeaderboardEntries.get((competitionId, caller, eventId)) == ?true);
      }
    );

    let sortedResults = filteredResults.toArray().map(
      func(((cid, user, event), result)) {
        {
          user;
          userProfile = userProfiles.get(user);
          event;
          attempts = result.attempts.map(func(a) { { time = a.time; penalty = a.penalty } });
          status = result.status;
        };
      }
    );
    sortedResults;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  private func hasCompletedPaymentForEvent(caller : Principal, competitionId : Nat, event : Event) : Bool {
    payments.containsKey((competitionId, caller, event));
  };

  private func hasAnyPaymentForCompetition(caller : Principal, competitionId : Nat) : Bool {
    for ((key, _payment) in payments.entries()) {
      if (key.0 == competitionId and key.1 == caller) {
        return true;
      };
    };
    false;
  };

  private func calculatePaymentAmount(caller : Principal, competitionId : Nat, event : Event, feeMode : FeeMode) : Nat {
    switch (feeMode) {
      case (#perEvent(fee)) {
        fee;
      };
      case (#basePlusAdditional({ baseFee; additionalFee })) {
        if (hasAnyPaymentForCompetition(caller, competitionId)) {
          additionalFee;
        } else {
          baseFee;
        };
      };
      case (#allEventsFlat(fee)) {
        fee;
      };
    };
  };

  public shared ({ caller }) func createCompetition(comp : Competition) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create competitions");
    };
    let compId = nextCompetitionId;
    nextCompetitionId += 1;
    let newComp : Competition = {
      id = compId;
      name = comp.name;
      slug = comp.slug;
      startDate = comp.startDate;
      endDate = comp.endDate;
      status = #upcoming;
      participantLimit = comp.participantLimit;
      feeMode = comp.feeMode;
      events = comp.events;
      scrambles = comp.scrambles;
      isActive = true;
      isLocked = false;
    };
    competitions.add(compId, newComp);
    compId;
  };
};
