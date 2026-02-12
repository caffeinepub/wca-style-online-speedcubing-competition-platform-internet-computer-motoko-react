import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Nat8 "mo:core/Nat8";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



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

  public type Competition = {
    id : Nat;
    name : Text;
    slug : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : CompetitionStatus;
    participantLimit : ?Nat;
    entryFee : ?Nat;
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
    entryFee : ?Nat;
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
    entryFee : ?Nat;
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
      entryFee = comp.entryFee;
      events = comp.events;
    };
  };

  private func hasCompletedPayment(caller : Principal, competitionId : Nat, event : Event, entryFee : ?Nat) : Bool {
    switch (entryFee) {
      case (null) { true };
      case (?_fee) { payments.containsKey((competitionId, caller, event)) };
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

  private func verifyRazorpaySignature(orderId : Text, paymentId : Text, signature : Text) : Bool {
    signature == (orderId # "|" # paymentId);
  };

  private func validateSessionToken(
    caller : Principal,
    competitionId : Nat,
    event : Event,
    providedToken : [Nat8]
  ) : Bool {
    let sessionKey = (competitionId, caller, event);
    switch (activeSessions.get(sessionKey)) {
      case (null) { false };
      case (?session) {
        if (session.sessionToken.size() != providedToken.size()) {
          return false;
        };
        var i = 0;
        while (i < session.sessionToken.size()) {
          if (session.sessionToken[i] != providedToken[i]) {
            return false;
          };
          i += 1;
        };
        true;
      };
    };
  };

  private func toPublicProfileInfo(profile : UserProfile) : PublicProfileInfo {
    {
      displayName = profile.displayName;
      country = profile.country;
      gender = profile.gender;
    };
  };

  private func validateScrambles(scrambles : [([Text], Event)]) : Bool {
    for ((scrambleList, _event) in scrambles.vals()) {
      if (scrambleList.size() != 5) {
        return false;
      };
    };
    true;
  };

  func defaultPublicProfile() : PublicProfileInfo {
    {
      displayName = "Anonymous";
      country = null;
      gender = null;
    };
  };

  public shared ({ caller }) func generateSecureToken() : async [Nat8] {
    [] : [Nat8];
  };

  public shared ({ caller }) func setRazorpayCredentials(keyId : Text, keySecret : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set Razorpay credentials");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can set Razorpay credentials");
    };
    razorpayKeyId := ?keyId;
    razorpayKeySecret := ?keySecret;
  };

  public query func isRazorpayConfigured() : async Bool {
    switch (razorpayKeyId, razorpayKeySecret) {
      case (?_, ?_) { true };
      case _ { false };
    };
  };

  public query func getRazorpayKeyId() : async ?Text {
    razorpayKeyId;
  };

  public shared ({ caller }) func createRazorpayOrder(request : RazorpayOrderRequest) : async RazorpayOrderResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create orders");
    };
    if (not userProfiles.containsKey(caller)) {
      Runtime.trap("User profile does not exist");
    };
    switch (blockedUsers.get(caller)) {
      case (?true) { Runtime.trap("User is blocked") };
      case _ {};
    };
    switch (razorpayKeyId, razorpayKeySecret) {
      case (?_, ?_) {};
      case _ { Runtime.trap("Razorpay is not configured") };
    };

    switch (competitions.get(request.competitionId)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?competition) {
        switch (competition.entryFee) {
          case (null) { Runtime.trap("This is a free competition") };
          case (?fee) {
            let eventExists = competition.events.find(func(e) { e == request.event }) != null;
            if (not eventExists) {
              Runtime.trap("Event is not part of this competition");
            };

            if (payments.containsKey((request.competitionId, caller, request.event))) {
              Runtime.trap("Already paid for this event");
            };

            let orderId = "order_" # nextOrderId.toText();
            nextOrderId += 1;

            createdOrders.add(orderId, (caller, request.competitionId, request.event));

            {
              orderId;
              amount = fee;
              currency = "INR";
              competitionName = competition.name;
              event = request.event;
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func setUserEmail(email : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set email");
    };
    userEmails.add(caller, email);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getPublicProfileInfo(user : Principal) : async ?PublicProfileInfo {
    userProfiles.get(user).map(toPublicProfileInfo);
  };

  public shared ({ caller }) func createUserProfile(displayName : Text, country : ?Text, gender : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User profile already exists");
    };
    let mcubesId = "MCUBES-" # nextMcubesId.toText();
    nextMcubesId += 1;
    let newProfile : UserProfile = {
      displayName;
      mcubesId;
      country;
      gender;
    };
    userProfiles.add(caller, newProfile);
  };

  public shared ({ caller }) func createCompetition(compInput : CompetitionInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create competitions");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can create competitions");
    };

    if (not validateScrambles(compInput.scrambles)) {
      Runtime.trap("Invalid scrambles: Each event must have exactly 5 scrambles");
    };

    let competitionId = nextCompetitionId;
    nextCompetitionId += 1;

    let newComp : Competition = {
      id = competitionId;
      name = compInput.name;
      slug = compInput.slug;
      startDate = compInput.startDate;
      endDate = compInput.endDate;
      status = compInput.status;
      participantLimit = compInput.participantLimit;
      entryFee = compInput.entryFee;
      events = compInput.events;
      scrambles = compInput.scrambles;
      isActive = true;
      isLocked = false;
    };

    competitions.add(competitionId, newComp);
    competitionId;
  };

  public shared ({ caller }) func updateCompetition(id : Nat, compInput : CompetitionInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update competitions");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can update competitions");
    };

    switch (competitions.get(id)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?existingComp) {
        if (existingComp.isLocked) {
          Runtime.trap("Cannot update a locked competition");
        };

        if (not validateScrambles(compInput.scrambles)) {
          Runtime.trap("Invalid scrambles: Each event must have exactly 5 scrambles");
        };

        let updatedComp : Competition = {
          id;
          name = compInput.name;
          slug = compInput.slug;
          startDate = compInput.startDate;
          endDate = compInput.endDate;
          status = compInput.status;
          participantLimit = compInput.participantLimit;
          entryFee = compInput.entryFee;
          events = compInput.events;
          scrambles = compInput.scrambles;
          isActive = existingComp.isActive;
          isLocked = existingComp.isLocked;
        };

        competitions.add(id, updatedComp);
      };
    };
  };

  public shared ({ caller }) func deleteCompetition(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete competitions");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can delete competitions");
    };

    switch (competitions.get(id)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?comp) {
        if (comp.isLocked) {
          Runtime.trap("Cannot delete a locked competition");
        };
        competitions.remove(id);
      };
    };
  };

  public shared ({ caller }) func duplicateCompetition(id : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can duplicate competitions");
    };
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
          entryFee = comp.entryFee;
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

  public shared ({ caller }) func lockCompetition(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can lock competitions");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can lock competitions");
    };

    switch (competitions.get(id)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?comp) {
        let updatedComp : Competition = {
          id = comp.id;
          name = comp.name;
          slug = comp.slug;
          startDate = comp.startDate;
          endDate = comp.endDate;
          status = comp.status;
          participantLimit = comp.participantLimit;
          entryFee = comp.entryFee;
          events = comp.events;
          scrambles = comp.scrambles;
          isActive = comp.isActive;
          isLocked = true;
        };
        competitions.add(id, updatedComp);
      };
    };
  };

  public shared ({ caller }) func unlockCompetition(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can unlock competitions");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can unlock competitions");
    };

    switch (competitions.get(id)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?comp) {
        let updatedComp : Competition = {
          id = comp.id;
          name = comp.name;
          slug = comp.slug;
          startDate = comp.startDate;
          endDate = comp.endDate;
          status = comp.status;
          participantLimit = comp.participantLimit;
          entryFee = comp.entryFee;
          events = comp.events;
          scrambles = comp.scrambles;
          isActive = comp.isActive;
          isLocked = false;
        };
        competitions.add(id, updatedComp);
      };
    };
  };

  public shared ({ caller }) func activateCompetition(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can activate competitions");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can activate competitions");
    };

    switch (competitions.get(id)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?comp) {
        let updatedComp : Competition = {
          id = comp.id;
          name = comp.name;
          slug = comp.slug;
          startDate = comp.startDate;
          endDate = comp.endDate;
          status = comp.status;
          participantLimit = comp.participantLimit;
          entryFee = comp.entryFee;
          events = comp.events;
          scrambles = comp.scrambles;
          isActive = true;
          isLocked = comp.isLocked;
        };
        competitions.add(id, updatedComp);
      };
    };
  };

  public shared ({ caller }) func deactivateCompetition(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can deactivate competitions");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can deactivate competitions");
    };

    switch (competitions.get(id)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?comp) {
        let updatedComp : Competition = {
          id = comp.id;
          name = comp.name;
          slug = comp.slug;
          startDate = comp.startDate;
          endDate = comp.endDate;
          status = comp.status;
          participantLimit = comp.participantLimit;
          entryFee = comp.entryFee;
          events = comp.events;
          scrambles = comp.scrambles;
          isActive = false;
          isLocked = comp.isLocked;
        };
        competitions.add(id, updatedComp);
      };
    };
  };

  public query ({ caller }) func getCompetitions() : async [CompetitionPublic] {
    competitions.values().toArray().map(toPublicCompetition);
  };

  public query ({ caller }) func getCompetition(id : Nat) : async ?Competition {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view competition details");
    };

    switch (competitions.get(id)) {
      case (null) { null };
      case (?comp) {
        switch (comp.entryFee) {
          case (null) { ?comp };
          case (?_fee) {
            let hasPaidForAnyEvent = comp.events.find(
              func(event) {
                payments.containsKey((id, caller, event));
              }
            ) != null;

            if (hasPaidForAnyEvent or isAllowlistedAdmin(caller)) {
              ?comp;
            } else {
              Runtime.trap("Unauthorized: Payment required to access competition scrambles");
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func startCompetition(competitionId : Nat, event : Event) : async [Nat8] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can start competitions");
    };

    switch (blockedUsers.get(caller)) {
      case (?true) { Runtime.trap("User is blocked") };
      case _ {};
    };

    switch (competitions.get(competitionId)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?comp) {
        if (not hasCompletedPayment(caller, competitionId, event, comp.entryFee)) {
          Runtime.trap("Payment required for this event");
        };

        let sessionKey = (competitionId, caller, event);
        let sessionToken : [Nat8] = [];

        let newSession : SolveSession = {
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

        activeSessions.add(sessionKey, newSession);
        sessionToken;
      };
    };
  };

  public query ({ caller }) func getSessionState(competitionId : Nat, event : Event) : async ?SessionStateResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view session state");
    };

    let sessionKey = (competitionId, caller, event);
    switch (activeSessions.get(sessionKey)) {
      case (null) { null };
      case (?session) {
        ?{
          currentAttempt = session.currentAttempt;
          inspectionStarted = session.inspectionStarted;
          startTime = session.startTime;
          endTime = session.endTime;
          attempts = session.attempts;
          isCompleted = session.isCompleted;
          event = session.event;
        };
      };
    };
  };

  public query ({ caller }) func getScramble(competitionId : Nat, event : Event, attemptNumber : Nat, sessionToken : [Nat8]) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch scrambles");
    };

    if (not validateSessionToken(caller, competitionId, event, sessionToken)) {
      Runtime.trap("Invalid session token");
    };

    let sessionKey = (competitionId, caller, event);
    switch (activeSessions.get(sessionKey)) {
      case (null) { Runtime.trap("No active session") };
      case (?session) {
        if (attemptNumber != session.currentAttempt) {
          Runtime.trap("Can only fetch scramble for current attempt");
        };

        if (attemptNumber >= 5) {
          return null;
        };

        switch (competitions.get(competitionId)) {
          case (null) { null };
          case (?comp) {
            let eventScrambles = comp.scrambles.find(func((_, e)) { e == event });
            switch (eventScrambles) {
              case (null) { null };
              case (?(scrambles, _)) {
                if (attemptNumber < scrambles.size()) {
                  ?scrambles[attemptNumber];
                } else {
                  null;
                };
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func submitAttempt(
    competitionId : Nat,
    event : Event,
    attemptNumber : Nat,
    time : Nat,
    penalty : Nat,
    sessionToken : [Nat8]
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit attempts");
    };

    switch (blockedUsers.get(caller)) {
      case (?true) { Runtime.trap("User is blocked") };
      case _ {};
    };

    if (not validateSessionToken(caller, competitionId, event, sessionToken)) {
      Runtime.trap("Invalid session token");
    };

    let sessionKey = (competitionId, caller, event);
    switch (activeSessions.get(sessionKey)) {
      case (null) { Runtime.trap("No active session") };
      case (?session) {
        if (attemptNumber != session.currentAttempt) {
          Runtime.trap("Can only submit current attempt");
        };

        if (session.isCompleted) {
          return;
        };

        let newAttempt : Attempt = { time; penalty };
        let updatedAttempts = session.attempts.concat([newAttempt]);
        let isCompleted = updatedAttempts.size() >= 5;

        let updatedSession : SolveSession = {
          sessionToken = session.sessionToken;
          event = session.event;
          createdAt = session.createdAt;
          lastUpdated = Time.now();
          currentAttempt = session.currentAttempt + 1;
          inspectionStarted = false;
          startTime = null;
          endTime = null;
          attempts = updatedAttempts;
          competitionId = session.competitionId;
          isCompleted;
        };

        activeSessions.add(sessionKey, updatedSession);

        if (isCompleted) {
          let resultKey = (competitionId, caller, event);
          let resultInput : ResultInput = {
            user = caller;
            competitionId;
            event;
            attempts = updatedAttempts.map(func(a : Attempt) : AttemptInput {
              { time = a.time; penalty = a.penalty };
            });
            status = #completed;
          };
          results.add(resultKey, resultInput);
        };
      };
    };
  };

  public query ({ caller }) func getCallerResult(competitionId : Nat, event : Event) : async ?Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view results");
    };

    let resultKey = (competitionId, caller, event);
    switch (results.get(resultKey)) {
      case (null) { null };
      case (?resultInput) {
        ?{
          user = resultInput.user;
          competitionId = resultInput.competitionId;
          event = resultInput.event;
          attempts = resultInput.attempts.map(func(a : AttemptInput) : Attempt {
            { time = a.time; penalty = a.penalty };
          });
          status = resultInput.status;
        };
      };
    };
  };

  public query ({ caller }) func getLeaderboard(competitionId : Nat, event : Event) : async [LeaderboardEntry] {
    let allResults = results.entries().toArray();
    let filteredResults = allResults.filter(func((key, result)) : Bool {
      let (cId, user, ev) = key;
      cId == competitionId and ev == event and result.status == #completed and not hiddenLeaderboardEntries.containsKey((competitionId, user, event));
    });

    let leaderboardEntries = filteredResults.map(func((key, result)) : LeaderboardEntry {
      let (_, user, _) = key;
      let attempts = result.attempts.map(func(a : AttemptInput) : Attempt {
        { time = a.time; penalty = a.penalty };
      });
      let bestTime = attempts[0].time + attempts[0].penalty;

      let userProfile = switch (userProfiles.get(user)) {
        case (?profile) { ?toPublicProfileInfo(profile) };
        case (null) { null };
      };

      {
        user;
        userProfile;
        attempts;
        bestTime;
      };
    });

    leaderboardEntries.sort(func(a : LeaderboardEntry, b : LeaderboardEntry) : Order.Order {
      Nat.compare(a.bestTime, b.bestTime);
    });
  };

  public shared ({ caller }) func toggleLeaderboardEntryVisibility(user : Principal, competitionId : Nat, event : Event, shouldHide : Bool) : async AdminLeaderboardToggleResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle leaderboard entry visibility");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can toggle leaderboard entry visibility");
    };

    let key = (competitionId, user, event);

    if (shouldHide) {
      hiddenLeaderboardEntries.add(key, true);
    } else {
      hiddenLeaderboardEntries.remove(key);
    };

    {
      user;
      competitionId;
      event;
      isHidden = shouldHide;
    };
  };

  public query ({ caller }) func listAllUsers() : async [UserSummary] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list users");
    };

    userProfiles.entries().toArray().map(func((principal, profile)) : UserSummary {
      {
        principal;
        profile = ?profile;
        email = userEmails.get(principal);
        isBlocked = switch (blockedUsers.get(principal)) {
          case (?blocked) { blocked };
          case (null) { false };
        };
      };
    });
  };

  public shared ({ caller }) func blockUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can block users");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can block users");
    };

    blockedUsers.add(user, true);
  };

  public shared ({ caller }) func unblockUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can unblock users");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can unblock users");
    };

    blockedUsers.remove(user);
  };

  public shared ({ caller }) func deleteUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can delete users");
    };

    userProfiles.remove(user);
    userEmails.remove(user);
    blockedUsers.remove(user);
    userPayments.remove(user);
  };

  public shared ({ caller }) func resetUserCompetitionStatus(user : Principal, competitionId : Nat, event : Event) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reset competition status");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can reset competition status");
    };

    let sessionKey = (competitionId, user, event);
    activeSessions.remove(sessionKey);

    let resultKey = (competitionId, user, event);
    results.remove(resultKey);

    let hiddenKey = (competitionId, user, event);
    hiddenLeaderboardEntries.remove(hiddenKey);
  };

  public query ({ caller }) func listCompetitionResults(competitionId : Nat, event : Event) : async [CompetitionResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list competition results");
    };

    let allResults = results.entries().toArray();
    let filteredResults = allResults.filter(func((key, _result)) : Bool {
      let (cId, _user, ev) = key;
      cId == competitionId and ev == event;
    });

    filteredResults.map(func((key, result)) : CompetitionResult {
      let (_, user, _) = key;
      {
        user;
        userProfile = userProfiles.get(user);
        event = result.event;
        attempts = result.attempts.map(func(a : AttemptInput) : Attempt {
          { time = a.time; penalty = a.penalty };
        });
        status = result.status;
      };
    });
  };

  public shared ({ caller }) func updateResultAttempts(
    user : Principal,
    competitionId : Nat,
    event : Event,
    attempts : [AttemptInput]
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update result attempts");
    };
    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can update result attempts");
    };

    let resultKey = (competitionId, user, event);
    switch (results.get(resultKey)) {
      case (null) { Runtime.trap("Result does not exist") };
      case (?existingResult) {
        let updatedResult : ResultInput = {
          user = existingResult.user;
          competitionId = existingResult.competitionId;
          event = existingResult.event;
          attempts;
          status = existingResult.status;
        };
        results.add(resultKey, updatedResult);
      };
    };
  };

  public shared ({ caller }) func confirmPayment(payment : PaymentConfirmation) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can confirm payments");
    };

    if (not userProfiles.containsKey(caller)) {
      Runtime.trap("User profile does not exist");
    };

    switch (blockedUsers.get(caller)) {
      case (?true) { Runtime.trap("User is blocked") };
      case _ {};
    };

    switch (createdOrders.get(payment.razorpayOrderId)) {
      case (null) { Runtime.trap("Invalid order ID") };
      case (?(orderUser, orderCompId, orderEvent)) {
        if (orderUser != caller) {
          Runtime.trap("Order does not belong to this user");
        };
        if (orderCompId != payment.competitionId or orderEvent != payment.event) {
          Runtime.trap("Order details do not match");
        };
      };
    };

    if (not verifyRazorpaySignature(payment.razorpayOrderId, payment.razorpayPaymentId, payment.razorpaySignature)) {
      Runtime.trap("Invalid payment signature");
    };

    switch (competitions.get(payment.competitionId)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?competition) {
        switch (competition.entryFee) {
          case (null) { Runtime.trap("This is a free competition") };
          case (?entryFee) {
            let paymentKey = (payment.competitionId, caller, payment.event);

            if (payments.containsKey(paymentKey)) {
              Runtime.trap("Payment already confirmed for this event");
            };

            payments.add(paymentKey, payment);

            let paidEvent : PaidEvent = {
              id = payment.competitionId;
              competitionName = competition.name;
              event = payment.event;
              entryFee;
              paymentDate = Time.now();
              razorpayOrderId = payment.razorpayOrderId;
              razorpayPaymentId = payment.razorpayPaymentId;
              razorpaySignature = payment.razorpaySignature;
            };

            let existingEvents = switch (userPayments.get(caller)) {
              case (?events) { events };
              case (null) { Map.empty<Nat, PaidEvent>() };
            };

            existingEvents.add(payment.competitionId, paidEvent);
            userPayments.add(caller, existingEvents);
          };
        };
      };
    };
  };

  private func getResultsForUser(user : Principal, includeHidden : Bool) : [CompetitionResult] {
    let allResults = results.entries().toArray();
    let filteredResults = allResults.filter(func((key, result)) : Bool {
      let (_compId, resultUser, _event) = key;
      if (resultUser != user) {
        return false;
      };
      if (not includeHidden) {
        return not hiddenLeaderboardEntries.containsKey(key);
      };
      true;
    });

    filteredResults.map(func((key, resultInput)) {
      let (_compId, resultUser, _event) = key;
      {
        user = resultUser;
        userProfile = userProfiles.get(resultUser);
        event = resultInput.event;
        attempts = resultInput.attempts.map(func(a : AttemptInput) : Attempt {
          { time = a.time; penalty = a.penalty };
        });
        status = resultInput.status;
      };
    });
  };

  public query ({ caller }) func getPublicResultsForUser(user : Principal, includeHidden : Bool) : async {
    profile : ?PublicProfileInfo;
    results : [CompetitionResult];
  } {
    let publicProfile = userProfiles.get(user).map(toPublicProfileInfo);
    let userResults = getResultsForUser(user, includeHidden);
    {
      profile = publicProfile;
      results = userResults;
    };
  };
};
