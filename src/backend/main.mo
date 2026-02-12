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
import Migration "migration";

(with migration = Migration.run)
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
    registrationStartDate : ?Time.Time;
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
    registrationStartDate : ?Time.Time;
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
    registrationStartDate : ?Time.Time;
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

  public type AdminResultEntry = {
    user : Principal;
    competitionId : Nat;
    event : Event;
    attempts : [Attempt];
    status : SolveStatus;
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
      registrationStartDate = comp.registrationStartDate;
    };
  };

  // Auto-transition competition status based on registrationStartDate
  private func autoTransitionCompetition(comp : Competition) : Competition {
    switch (comp.status) {
      case (#upcoming) {
        switch (comp.registrationStartDate) {
          case (?regStartDate) {
            let now = Time.now();
            if (now >= regStartDate) {
              // Auto-transition to running
              {
                comp with status = #running
              };
            } else {
              comp;
            };
          };
          case (null) {
            // No registration start date, keep as is
            comp;
          };
        };
      };
      case (_) {
        comp;
      };
    };
  };

  // Check if registration is gated for a competition
  private func isRegistrationGated(comp : Competition) : Bool {
    switch (comp.status) {
      case (#upcoming) {
        switch (comp.registrationStartDate) {
          case (?regStartDate) {
            let now = Time.now();
            now < regStartDate;
          };
          case (null) {
            false;
          };
        };
      };
      case (_) {
        false;
      };
    };
  };

  // Enforce registration gating authorization
  private func enforceRegistrationGating(caller : Principal, competitionId : Nat, event : Event) {
    // Check if user is blocked
    if (blockedUsers.get(caller) == ?true) {
      Runtime.trap("User is blocked");
    };

    // Get competition and auto-transition if needed
    let comp = switch (competitions.get(competitionId)) {
      case (?c) {
        let transitioned = autoTransitionCompetition(c);
        if (transitioned.status != c.status) {
          competitions.add(competitionId, transitioned);
        };
        transitioned;
      };
      case (null) {
        Runtime.trap("Competition does not exist");
      };
    };

    // Check if competition is active
    if (not comp.isActive) {
      Runtime.trap("Competition is not active");
    };

    // Check if competition is locked
    if (comp.isLocked) {
      Runtime.trap("Competition is locked");
    };

    // Check if event is part of competition
    let eventExists = comp.events.find(func(e) { e == event });
    if (eventExists == null) {
      Runtime.trap("Event is not part of this competition");
    };

    // CRITICAL: Enforce registration gating
    if (isRegistrationGated(comp)) {
      Runtime.trap("Registration has not started yet for this competition");
    };
  };

  public query ({ caller }) func getAllCompetitions() : async [CompetitionPublic] {
    let allComps = competitions.values().toArray();
    let activeComps = allComps.filter(func(c) { c.isActive });
    // Auto-transition competitions before returning
    let transitionedComps = activeComps.map(autoTransitionCompetition);
    transitionedComps.map<Competition, CompetitionPublic>(toPublicCompetition);
  };

  public query ({ caller }) func getCompetition(competitionId : Nat) : async Competition {
    switch (competitions.get(competitionId)) {
      case (?c) { autoTransitionCompetition(c) };
      case (null) { Runtime.trap("Competition does not exist") };
    };
  };

  public query ({ caller }) func getCompetitionResults(competitionId : Nat, event : Event) : async [CompetitionResult] {
    let comp = switch (competitions.get(competitionId)) {
      case (?c) { autoTransitionCompetition(c) };
      case (null) { Runtime.trap("Competition does not exist") };
    };

    let filteredResults = results.filter(
      func((cid, user, eventId), result) {
        cid == competitionId and event == eventId and result.status == #completed and not (hiddenLeaderboardEntries.get((competitionId, user, eventId)) == ?true);
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

  // User: Create Razorpay order for competition entry
  public shared ({ caller }) func createRazorpayOrder(request : RazorpayOrderRequest) : async RazorpayOrderResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create payment orders");
    };

    // CRITICAL: Enforce registration gating
    enforceRegistrationGating(caller, request.competitionId, request.event);

    // Check if already paid
    if (hasCompletedPaymentForEvent(caller, request.competitionId, request.event)) {
      Runtime.trap("Already paid for this event");
    };

    let comp = switch (competitions.get(request.competitionId)) {
      case (?c) { c };
      case (null) { Runtime.trap("Competition does not exist") };
    };

    let feeMode = switch (comp.feeMode) {
      case (?fm) { fm };
      case (null) { Runtime.trap("Competition has no fee mode configured") };
    };

    let amount = calculatePaymentAmount(caller, request.competitionId, request.event, feeMode);
    let orderId = "order_" # nextOrderId.toText();
    nextOrderId += 1;

    createdOrders.add(orderId, (caller, request.competitionId, request.event));

    {
      orderId;
      amount;
      currency = "INR";
      competitionName = comp.name;
      event = request.event;
    };
  };

  // User: Confirm payment
  public shared ({ caller }) func confirmPayment(confirmation : PaymentConfirmation) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can confirm payments");
    };

    // CRITICAL: Enforce registration gating
    enforceRegistrationGating(caller, confirmation.competitionId, confirmation.event);

    // Verify order exists and belongs to caller
    let orderInfo = switch (createdOrders.get(confirmation.razorpayOrderId)) {
      case (?(user, compId, event)) {
        if (user != caller) {
          Runtime.trap("Order does not belong to caller");
        };
        if (compId != confirmation.competitionId or event != confirmation.event) {
          Runtime.trap("Order details mismatch");
        };
        (user, compId, event);
      };
      case (null) {
        Runtime.trap("Order not found");
      };
    };

    // Check if already paid
    if (hasCompletedPaymentForEvent(caller, confirmation.competitionId, confirmation.event)) {
      Runtime.trap("Already paid for this event");
    };

    // Store payment confirmation
    payments.add((confirmation.competitionId, caller, confirmation.event), confirmation);

    // Store in user payments
    let comp = switch (competitions.get(confirmation.competitionId)) {
      case (?c) { c };
      case (null) { Runtime.trap("Competition does not exist") };
    };

    let feeMode = switch (comp.feeMode) {
      case (?fm) { fm };
      case (null) { Runtime.trap("Competition has no fee mode") };
    };

    let amount = calculatePaymentAmount(caller, confirmation.competitionId, confirmation.event, feeMode);

    let paidEvent : PaidEvent = {
      id = nextPaymentId;
      competitionName = comp.name;
      event = confirmation.event;
      entryFee = amount;
      paymentDate = Time.now();
      razorpayOrderId = confirmation.razorpayOrderId;
      razorpayPaymentId = confirmation.razorpayPaymentId;
      razorpaySignature = confirmation.razorpaySignature;
    };
    nextPaymentId += 1;

    let userPaymentMap = switch (userPayments.get(caller)) {
      case (?map) { map };
      case (null) {
        let newMap = Map.empty<Nat, PaidEvent>();
        userPayments.add(caller, newMap);
        newMap;
      };
    };

    userPaymentMap.add(paidEvent.id, paidEvent);
  };

  // User: Start competition session
  public shared ({ caller }) func startCompetitionSession(competitionId : Nat, event : Event) : async [Nat8] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start sessions");
    };

    // CRITICAL: Enforce registration gating
    enforceRegistrationGating(caller, competitionId, event);

    // Check if payment is required
    let comp = switch (competitions.get(competitionId)) {
      case (?c) { c };
      case (null) { Runtime.trap("Competition does not exist") };
    };

    switch (comp.feeMode) {
      case (?_) {
        // Payment required, check if paid
        if (not hasCompletedPaymentForEvent(caller, competitionId, event)) {
          Runtime.trap("Payment required for this event");
        };
      };
      case (null) {
        // No payment required
      };
    };

    // Check if session already exists
    if (activeSessions.containsKey((competitionId, caller, event))) {
      Runtime.trap("Session already exists for this competition and event");
    };

    // Create session token (simplified)
    let sessionToken : [Nat8] = [1, 2, 3, 4, 5, 6, 7, 8];

    let session : SolveSession = {
      sessionToken;
      event;
      createdAt = Time.now();
      lastUpdated = Time.now();
      currentAttempt = 0;
      inspectionStarted = false;
      startTime = null;
      endTime = null;
      attempts = [];
      competitionId;
      isCompleted = false;
    };

    activeSessions.add((competitionId, caller, event), session);
    sessionToken;
  };

  public shared ({ caller }) func createCompetition(comp : Competition) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create competitions");
    };

    // Validate scrambles: each event must have exactly 5 scrambles
    for ((scrambles, event) in comp.scrambles.vals()) {
      if (scrambles.size() != 5) {
        Runtime.trap("Each event must have exactly 5 scrambles");
      };
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
      registrationStartDate = comp.registrationStartDate;
    };
    competitions.add(compId, newComp);
    compId;
  };

  // Admin: Update competition
  public shared ({ caller }) func updateCompetition(competitionId : Nat, comp : CompetitionInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update competitions");
    };

    let existing = switch (competitions.get(competitionId)) {
      case (?c) { c };
      case (null) { Runtime.trap("Competition does not exist") };
    };

    // Validate scrambles: each event must have exactly 5 scrambles
    for ((scrambles, event) in comp.scrambles.vals()) {
      if (scrambles.size() != 5) {
        Runtime.trap("Each event must have exactly 5 scrambles");
      };
    };

    let updated : Competition = {
      id = competitionId;
      name = comp.name;
      slug = comp.slug;
      startDate = comp.startDate;
      endDate = comp.endDate;
      status = comp.status;
      participantLimit = comp.participantLimit;
      feeMode = comp.feeMode;
      events = comp.events;
      scrambles = comp.scrambles;
      isActive = existing.isActive;
      isLocked = existing.isLocked;
      registrationStartDate = comp.registrationStartDate;
    };
    competitions.add(competitionId, updated);
  };

  // Admin: Delete competition
  public shared ({ caller }) func deleteCompetition(competitionId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete competitions");
    };

    switch (competitions.get(competitionId)) {
      case (?_) { competitions.remove(competitionId) };
      case (null) { Runtime.trap("Competition does not exist") };
    };
  };

  // Admin: Lock/unlock competition
  public shared ({ caller }) func lockCompetition(competitionId : Nat, locked : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can lock competitions");
    };

    let existing = switch (competitions.get(competitionId)) {
      case (?c) { c };
      case (null) { Runtime.trap("Competition does not exist") };
    };

    let updated : Competition = {
      id = existing.id;
      name = existing.name;
      slug = existing.slug;
      startDate = existing.startDate;
      endDate = existing.endDate;
      status = existing.status;
      participantLimit = existing.participantLimit;
      feeMode = existing.feeMode;
      events = existing.events;
      scrambles = existing.scrambles;
      isActive = existing.isActive;
      isLocked = locked;
      registrationStartDate = existing.registrationStartDate;
    };
    competitions.add(competitionId, updated);
  };

  // Admin: Activate/deactivate competition
  public shared ({ caller }) func activateCompetition(competitionId : Nat, active : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can activate/deactivate competitions");
    };

    let existing = switch (competitions.get(competitionId)) {
      case (?c) { c };
      case (null) { Runtime.trap("Competition does not exist") };
    };

    let updated : Competition = {
      id = existing.id;
      name = existing.name;
      slug = existing.slug;
      startDate = existing.startDate;
      endDate = existing.endDate;
      status = existing.status;
      participantLimit = existing.participantLimit;
      feeMode = existing.feeMode;
      events = existing.events;
      scrambles = existing.scrambles;
      isActive = active;
      isLocked = existing.isLocked;
      registrationStartDate = existing.registrationStartDate;
    };
    competitions.add(competitionId, updated);
  };

  // Admin: List all users
  public query ({ caller }) func adminListUsers() : async [UserSummary] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list users");
    };

    let allUsers = userProfiles.entries().toArray();
    allUsers.map<(Principal, UserProfile), UserSummary>(
      func((principal, profile)) {
        {
          principal;
          profile = ?profile;
          email = userEmails.get(principal);
          isBlocked = blockedUsers.get(principal) == ?true;
        };
      }
    );
  };

  // Admin: Block/unblock user
  public shared ({ caller }) func adminBlockUser(user : Principal, blocked : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can block users");
    };

    if (blocked) {
      blockedUsers.add(user, true);
    } else {
      blockedUsers.remove(user);
    };
  };

  // Admin: Delete user
  public shared ({ caller }) func adminDeleteUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };

    userProfiles.remove(user);
    userEmails.remove(user);
    blockedUsers.remove(user);
    userPayments.remove(user);

    // Remove all user's results
    let userResults = results.filter(func((_, u, _), _) { u == user });
    for ((key, _) in userResults.entries()) {
      results.remove(key);
    };

    // Remove all user's payments
    let userPaymentEntries = payments.filter(func((_, u, _), _) { u == user });
    for ((key, _) in userPaymentEntries.entries()) {
      payments.remove(key);
    };

    // Remove all user's sessions
    let userSessions = activeSessions.filter(func((_, u, _), _) { u == user });
    for ((key, _) in userSessions.entries()) {
      activeSessions.remove(key);
    };
  };

  // Admin: Reset user's competition status
  public shared ({ caller }) func adminResetUserCompetitionStatus(user : Principal, competitionId : Nat, event : Event) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reset competition status");
    };

    // Remove result
    results.remove((competitionId, user, event));

    // Remove session
    activeSessions.remove((competitionId, user, event));

    // Remove hidden state
    hiddenLeaderboardEntries.remove((competitionId, user, event));
  };

  // Admin: List all results for a competition with hidden state
  public query ({ caller }) func adminListCompetitionResults(competitionId : Nat) : async [AdminResultEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list results");
    };

    let compResults = results.filter(func((cid, _, _), _) { cid == competitionId });
    compResults.toArray().map<((Nat, Principal, Event), ResultInput), AdminResultEntry>(
      func(((cid, user, event), result)) {
        {
          user;
          competitionId = cid;
          event;
          attempts = result.attempts.map(func(a) { { time = a.time; penalty = a.penalty } });
          status = result.status;
          isHidden = hiddenLeaderboardEntries.get((cid, user, event)) == ?true;
        };
      }
    );
  };

  // Admin: Hide/unhide result
  public shared ({ caller }) func adminToggleResultVisibility(user : Principal, competitionId : Nat, event : Event, hidden : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle result visibility");
    };

    // Verify result exists
    switch (results.get((competitionId, user, event))) {
      case (?_) {
        if (hidden) {
          hiddenLeaderboardEntries.add((competitionId, user, event), true);
        } else {
          hiddenLeaderboardEntries.remove((competitionId, user, event));
        };
      };
      case (null) { Runtime.trap("Result does not exist") };
    };
  };

  // Admin: Get user's solve history
  public query ({ caller }) func adminGetUserSolveHistory(user : Principal) : async [(Nat, Event, ResultInput)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view solve history");
    };

    let userResults = results.filter(func((_, u, _), _) { u == user });
    userResults.toArray().map<((Nat, Principal, Event), ResultInput), (Nat, Event, ResultInput)>(
      func(((cid, _, event), result)) {
        (cid, event, result);
      }
    );
  };
};
