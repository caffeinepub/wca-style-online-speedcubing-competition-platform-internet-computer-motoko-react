import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

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

  public type AdminScrambleView = {
    id : Nat;
    event : Event;
    scrambleRecords : [(Text, Bool)];
  };

  public type EventScrambles = {
    event : Event;
    scrambles : [Text];
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
  var createdOrders = Map.empty<Text, (Principal, Nat, Event)>();

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

  private func hasAccessToEvent(caller : Principal, competitionId : Nat, event : Event, feeMode : ?FeeMode) : Bool {
    switch (feeMode) {
      case (null) { true };
      case (?mode) {
        switch (mode) {
          case (#perEvent(_)) {
            hasCompletedPaymentForEvent(caller, competitionId, event);
          };
          case (#basePlusAdditional(_)) {
            hasCompletedPaymentForEvent(caller, competitionId, event);
          };
          case (#allEventsFlat(_)) {
            hasAnyPaymentForCompetition(caller, competitionId);
          };
        };
      };
    };
  };

  private func isAllowlistedAdmin(caller : Principal) : Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return false;
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (profile.mcubesId == "MCUBES-0") {
          return true;
        };
      };
      case (null) {};
    };

    switch (userEmails.get(caller)) {
      case (?email) {
        emailAllowlist.find(func(allowedEmail) { allowedEmail == email }) != null;
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func createRazorpayOrder(request : RazorpayOrderRequest) : async RazorpayOrderResponse {
    // Authorization: Only authenticated users
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create orders");
    };

    // User must have a profile
    if (not userProfiles.containsKey(caller)) {
      Runtime.trap("User profile does not exist");
    };

    // User must not be blocked
    switch (blockedUsers.get(caller)) {
      case (?true) { Runtime.trap("User is blocked") };
      case _ {};
    };

    // Razorpay must be configured
    switch (razorpayKeyId, razorpayKeySecret) {
      case (?_, ?_) {};
      case _ { Runtime.trap("Razorpay is not configured") };
    };

    switch (competitions.get(request.competitionId)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?competition) {
        // Competition must be active
        if (not competition.isActive) {
          Runtime.trap("Competition is not active");
        };

        // Competition must not be locked
        if (competition.isLocked) {
          Runtime.trap("Competition registration is closed");
        };

        // Competition must be upcoming or running
        switch (competition.status) {
          case (#completed) { Runtime.trap("Competition has ended") };
          case _ {};
        };

        switch (competition.feeMode) {
          case (null) { Runtime.trap("This is a free competition") };
          case (?mode) {
            // Event must be part of competition
            let eventExists = competition.events.find(func(e) { e == request.event }) != null;
            if (not eventExists) {
              Runtime.trap("Event is not part of this competition");
            };

            // Check if already paid based on fee mode
            let alreadyPaid = switch (mode) {
              case (#perEvent(_)) {
                hasCompletedPaymentForEvent(caller, request.competitionId, request.event);
              };
              case (#basePlusAdditional(_)) {
                hasCompletedPaymentForEvent(caller, request.competitionId, request.event);
              };
              case (#allEventsFlat(_)) {
                hasAnyPaymentForCompetition(caller, request.competitionId);
              };
            };

            if (alreadyPaid) {
              Runtime.trap("Already paid for this event or competition");
            };

            // Create order
            let orderId = "order_" # nextOrderId.toText();
            nextOrderId += 1;
            createdOrders.add(orderId, (caller, request.competitionId, request.event));

            let amount = calculatePaymentAmount(caller, request.competitionId, request.event, mode);

            {
              orderId;
              amount;
              currency = "INR";
              competitionName = competition.name;
              event = request.event;
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func confirmPayment(confirmation : PaymentConfirmation) : async () {
    // Authorization: Only authenticated users
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can confirm payments");
    };

    // User must not be blocked
    switch (blockedUsers.get(caller)) {
      case (?true) { Runtime.trap("User is blocked") };
      case _ {};
    };

    // Verify order exists and belongs to caller
    switch (createdOrders.get(confirmation.razorpayOrderId)) {
      case (null) { Runtime.trap("Invalid order ID") };
      case (?(orderOwner, orderedCompId, orderedEvent)) {
        // Authorization: Order must belong to caller
        if (orderOwner != caller) {
          Runtime.trap("Unauthorized: This order does not belong to you");
        };

        // Verify competition and event match
        if (orderedCompId != confirmation.competitionId or orderedEvent != confirmation.event) {
          Runtime.trap("Order details do not match");
        };

        // Check if already paid
        if (payments.containsKey((confirmation.competitionId, caller, confirmation.event))) {
          Runtime.trap("Payment already confirmed for this event");
        };

        // Get competition to determine fee mode
        switch (competitions.get(confirmation.competitionId)) {
          case (null) { Runtime.trap("Competition does not exist") };
          case (?competition) {
            switch (competition.feeMode) {
              case (null) { Runtime.trap("This is a free competition") };
              case (?mode) {
                // For allEventsFlat mode, check if any payment exists
                switch (mode) {
                  case (#allEventsFlat(_)) {
                    if (hasAnyPaymentForCompetition(caller, confirmation.competitionId)) {
                      Runtime.trap("Payment already confirmed for this competition");
                    };
                  };
                  case _ {};
                };

                // Store payment confirmation
                payments.add((confirmation.competitionId, caller, confirmation.event), confirmation);

                // Store in user payments history
                let paymentId = nextPaymentId;
                nextPaymentId += 1;

                let amount = calculatePaymentAmount(caller, confirmation.competitionId, confirmation.event, mode);

                let paidEvent : PaidEvent = {
                  id = paymentId;
                  competitionName = competition.name;
                  event = confirmation.event;
                  entryFee = amount;
                  paymentDate = Time.now();
                  razorpayOrderId = confirmation.razorpayOrderId;
                  razorpayPaymentId = confirmation.razorpayPaymentId;
                  razorpaySignature = confirmation.razorpaySignature;
                };

                switch (userPayments.get(caller)) {
                  case (null) {
                    let newMap = Map.empty<Nat, PaidEvent>();
                    newMap.add(paymentId, paidEvent);
                    userPayments.add(caller, newMap);
                  };
                  case (?existingMap) {
                    existingMap.add(paymentId, paidEvent);
                  };
                };

                // Remove order from pending orders
                createdOrders.remove(confirmation.razorpayOrderId);
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func startSolveSession(competitionId : Nat, event : Event) : async () {
    // Authorization: Only authenticated users
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can start solve sessions");
    };

    // User must not be blocked
    switch (blockedUsers.get(caller)) {
      case (?true) { Runtime.trap("User is blocked") };
      case _ {};
    };

    switch (competitions.get(competitionId)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?competition) {
        // Competition must be active and running
        if (not competition.isActive) {
          Runtime.trap("Competition is not active");
        };

        switch (competition.status) {
          case (#running) {};
          case _ { Runtime.trap("Competition is not currently running") };
        };

        // Event must be part of competition
        let eventExists = competition.events.find(func(e) { e == event }) != null;
        if (not eventExists) {
          Runtime.trap("Event is not part of this competition");
        };

        // Authorization: Check payment/access for paid competitions
        if (not hasAccessToEvent(caller, competitionId, event, competition.feeMode)) {
          Runtime.trap("Unauthorized: Payment required to access this event");
        };

        // Check if session already exists
        if (activeSessions.containsKey((competitionId, caller, event))) {
          Runtime.trap("Session already exists for this event");
        };

        // Create session (implementation details omitted for brevity)
      };
    };
  };

  public shared ({ caller }) func submitResult(result : ResultInput) : async () {
    // Authorization: Only authenticated users
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit results");
    };

    // Authorization: User can only submit their own results
    if (result.user != caller) {
      Runtime.trap("Unauthorized: You can only submit your own results");
    };

    // User must not be blocked
    switch (blockedUsers.get(caller)) {
      case (?true) { Runtime.trap("User is blocked") };
      case _ {};
    };

    switch (competitions.get(result.competitionId)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?competition) {
        // Competition must be active
        if (not competition.isActive) {
          Runtime.trap("Competition is not active");
        };

        // Competition must be running
        switch (competition.status) {
          case (#running) {};
          case _ { Runtime.trap("Competition is not currently running") };
        };

        // Event must be part of competition
        let eventExists = competition.events.find(func(e) { e == result.event }) != null;
        if (not eventExists) {
          Runtime.trap("Event is not part of this competition");
        };

        // Authorization: Check payment/access for paid competitions
        if (not hasAccessToEvent(caller, result.competitionId, result.event, competition.feeMode)) {
          Runtime.trap("Unauthorized: Payment required to submit results for this event");
        };

        // Store result
        results.add((result.competitionId, caller, result.event), result);
      };
    };
  };

  public query ({ caller }) func getCompetitionResults(competitionId : Nat, event : Event) : async [CompetitionResult] {
    // No authentication required - public leaderboard
    // However, hidden entries are filtered out

    switch (competitions.get(competitionId)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?_competition) {
        let resultsList = results.entries().toArray().filter(
          func((key, _result)) {
            key.0 == competitionId and key.2 == event and not (hiddenLeaderboardEntries.get(key) == ?true);
          }
        );

        resultsList.map<((Nat, Principal, Event), ResultInput), CompetitionResult>(
          func((key, result)) {
            {
              user = result.user;
              userProfile = userProfiles.get(result.user);
              event = result.event;
              attempts = result.attempts.map<AttemptInput, Attempt>(func(a) { { time = a.time; penalty = a.penalty } });
              status = result.status;
            };
          }
        );
      };
    };
  };

  public shared ({ caller }) func setRazorpayCredentials(keyId : Text, keySecret : Text) : async () {
    // Authorization: Only admins
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set Razorpay credentials");
    };

    // Additional authorization: Only allowlisted admins
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can set Razorpay credentials");
    };

    razorpayKeyId := ?keyId;
    razorpayKeySecret := ?keySecret;
  };

  public query func isRazorpayConfigured() : async Bool {
    // Public query - no authorization needed
    switch (razorpayKeyId, razorpayKeySecret) {
      case (?_, ?_) { true };
      case _ { false };
    };
  };

  public query func getRazorpayKeyId() : async ?Text {
    // Public query - key ID is safe to expose (not the secret)
    razorpayKeyId;
  };

  public shared ({ caller }) func duplicateCompetition(id : Nat) : async Nat {
    // Authorization: Only admins
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can duplicate competitions");
    };

    // Additional authorization: Only allowlisted admins
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can duplicate competitions");
    };

    switch (competitions.get(id)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?comp) {
        let newId = nextCompetitionId;
        nextCompetitionId += 1;

        let duplicatedComp : Competition = {
          id = newId;
          name = comp.name # " (Copy)";
          slug = comp.slug # "-copy-" # newId.toText();
          startDate = comp.startDate;
          endDate = comp.endDate;
          status = #upcoming;
          participantLimit = comp.participantLimit;
          feeMode = comp.feeMode;
          events = comp.events;
          scrambles = comp.scrambles;
          isActive = false;
          isLocked = false;
        };

        competitions.add(newId, duplicatedComp);
        newId;
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // Authorization: Only authenticated users
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Authorization: Users can view their own profile, admins can view any profile
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // Authorization: Only authenticated users
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };
};
