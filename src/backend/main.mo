import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Iter "mo:core/Iter";
import Blob "mo:core/Blob";
import Nat8 "mo:core/Nat8";



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

  var userPayments = Map.empty<Principal, Map.Map<Nat, PaidEvent>>();

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

  var nextCompetitionId = 0;
  var nextMcubesId = 1;
  var nextOrderId = 0;

  var competitions = Map.empty<Nat, Competition>();
  var userProfiles = Map.empty<Principal, UserProfile>();
  var results = Map.empty<(Nat, Principal, Event), ResultInput>();
  var payments = Map.empty<(Nat, Principal, Event), PaymentConfirmation>();
  var userEmails = Map.empty<Principal, Text>();

  // Email allowlist for admin access
  let emailAllowlist : [Text] = ["admin@mcubes.com"];

  // Razorpay configuration - admin only, never exposed
  var razorpayKeySecret : ?Text = null;
  var razorpayKeyId : ?Text = null;

  // Track created orders to prevent replay attacks
  var createdOrders = Map.empty<Text, (Principal, Nat, Event)>();

  module Result {
    public func compareByBestScore(a : ResultInput, b : ResultInput) : Order.Order {
      let bestScoreA = a.attempts[0].time + a.attempts[0].penalty;
      let bestScoreB = b.attempts[0].time + b.attempts[0].penalty;
      Nat.compare(bestScoreA, bestScoreB);
    };
  };

  private func isAllowlistedAdmin(caller : Principal) : Bool {
    // Must be an IC admin first
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return false;
    };

    // Check if user has a profile with mcubesId == "MCUBES-0"
    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (profile.mcubesId == "MCUBES-0") {
          return true;
        };
      };
      case (null) {};
    };

    // OR check if their stored email is in the allowlist
    switch (userEmails.get(caller)) {
      case (?email) {
        emailAllowlist.find(func(allowedEmail) { allowedEmail == email }) != null;
      };
      case (null) { false };
    };
  };

  private func hasCompletedPayment(caller : Principal, competitionId : Nat, event : Event, entryFee : ?Nat) : Bool {
    switch (entryFee) {
      case (null) { true };
      case (?_fee) { payments.containsKey((competitionId, caller, event)) };
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

  // For demonstration only, not a real signature verification
  private func verifyRazorpaySignature(orderId : Text, paymentId : Text, signature : Text) : Bool {
    signature == (orderId # "|" # paymentId);
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
    };

    competitions.add(competitionId, newComp);
    competitionId;
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

  public shared ({ caller }) func confirmPayment(payment : PaymentConfirmation) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can confirm payments");
    };

    if (not userProfiles.containsKey(caller)) {
      Runtime.trap("User profile does not exist");
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

            // Prevent double payment
            if (payments.containsKey(paymentKey)) {
              Runtime.trap("Payment already confirmed for this event");
            };

            payments.add(paymentKey, payment);

            // Create PaidEvent record
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

  public shared ({ caller }) func startCompetition(competitionId : Nat, event : Event) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can participate in competitions");
    };

    if (not userProfiles.containsKey(caller)) {
      Runtime.trap("User profile does not exist");
    };

    switch (competitions.get(competitionId)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?competition) {
        if (competition.status != #running) {
          Runtime.trap("Competition is not running");
        };

        if (not hasCompletedPayment(caller, competitionId, event, competition.entryFee)) {
          Runtime.trap("Payment required: Please complete payment before starting this competition");
        };

        let resultKey = (competitionId, caller, event);
        switch (results.get(resultKey)) {
          case (?existingResult) {
            if (existingResult.status != #not_started) {
              Runtime.trap("Already started or completed");
            };
          };
          case (null) {};
        };

        let newResult : ResultInput = {
          user = caller;
          competitionId;
          event;
          attempts = Array.tabulate(5, func(_) { { time = 0; penalty = 0 } });
          status = #in_progress;
        };
        results.add(resultKey, newResult);
      };
    };
  };

  public shared ({ caller }) func submitAttempt(competitionId : Nat, event : Event, attemptIndex : Nat, attempt : AttemptInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit attempts");
    };

    if (attemptIndex >= 5) {
      Runtime.trap("Invalid attempt index");
    };

    let resultKey = (competitionId, caller, event);
    switch (results.get(resultKey)) {
      case (null) { Runtime.trap("Result does not exist or not started") };
      case (?result) {
        if (result.user != caller) {
          Runtime.trap("Unauthorized: Can only submit your own attempts");
        };

        if (result.status != #in_progress) {
          Runtime.trap("Cannot modify completed result");
        };

        switch (competitions.get(competitionId)) {
          case (null) { Runtime.trap("Competition does not exist") };
          case (?competition) {
            if (competition.status != #running) {
              Runtime.trap("Competition is not running");
            };
          };
        };

        let newAttempts = Array.tabulate(
          5,
          func(i) {
            if (i == attemptIndex) { attempt : AttemptInput } else { result.attempts[i] };
          },
        );

        let allAttemptsCompleted = newAttempts.foldLeft(true, func(acc, att) { acc and (att.time > 0) });

        let newStatus = if (allAttemptsCompleted) { #completed } else { #in_progress };

        let newResult = {
          user = result.user;
          competitionId = result.competitionId;
          event = result.event;
          attempts = newAttempts;
          status = newStatus;
        };
        results.add(resultKey, newResult);
      };
    };
  };

  public query ({ caller }) func getResults(competitionId : Nat, event : Event) : async [ResultInput] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view results");
    };

    switch (competitions.get(competitionId)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?competition) {
        if (not hasCompletedPayment(caller, competitionId, event, competition.entryFee) and not isAllowlistedAdmin(caller)) {
          Runtime.trap("Unauthorized: Payment required to view results");
        };
      };
    };

    results.toArray().filter(func((key, _)) { key.0 == competitionId and key.2 == event }).map(
      func((_, resultInput)) { resultInput }
    );
  };

  public query ({ caller }) func getLeaderboard(competitionId : Nat, event : Event) : async [ResultInput] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view leaderboard");
    };

    switch (competitions.get(competitionId)) {
      case (null) { Runtime.trap("Competition does not exist") };
      case (?competition) {
        if (not hasCompletedPayment(caller, competitionId, event, competition.entryFee) and not isAllowlistedAdmin(caller)) {
          Runtime.trap("Unauthorized: Payment required to view leaderboard");
        };
      };
    };

    let filteredResults = results.values().toArray().filter(
      func(result) {
        result.competitionId == competitionId and result.event == event and result.status == #completed
      }
    );
    filteredResults.sort(Result.compareByBestScore);
  };

  public query ({ caller }) func getUserResult(competitionId : Nat, event : Event) : async ?ResultInput {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their results");
    };

    results.get((competitionId, caller, event));
  };

  public query ({ caller }) func getPublicProfileInfo(user : Principal) : async PublicProfileInfo {
    switch (userProfiles.get(user)) {
      case (?profile) {
        {
          displayName = profile.displayName;
          country = profile.country;
          gender = profile.gender;
        };
      };
      case (null) { defaultPublicProfile() };
    };
  };

  public query ({ caller }) func getMultiplePublicProfiles(users : [Principal]) : async [(Principal, PublicProfileInfo)] {
    users.map(
      func(user) {
        let profile = switch (userProfiles.get(user)) {
          case (?profile) {
            {
              displayName = profile.displayName;
              country = profile.country;
              gender = profile.gender;
            };
          };
          case (null) { defaultPublicProfile() };
        };
        (user, profile);
      }
    );
  };

  public query ({ caller }) func getUserPaymentHistory() : async [PaidEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment history");
    };

    let payments = switch (userPayments.get(caller)) {
      case (?events) { events.values().toArray() };
      case (null) { [] };
    };

    payments;
  };

  public shared ({ caller }) func getAllUserPayments() : async [PaymentConfirmation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all user payments");
    };

    if (not isAllowlistedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the allowlisted admin can view all user payments");
    };

    payments.values().toArray();
  };

  func defaultPublicProfile() : PublicProfileInfo {
    {
      displayName = "Anonymous";
      country = null;
      gender = null;
    };
  };
};
