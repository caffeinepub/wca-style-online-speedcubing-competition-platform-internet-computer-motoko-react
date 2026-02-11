import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // comparison function for (Nat, Principal) tuple
  module NatPrincipal {
    public func compare(x : (Nat, Principal), y : (Nat, Principal)) : Order.Order {
      switch (Nat.compare(x.0, y.0)) {
        case (#equal) { Principal.compare(x.1, y.1) };
        case (other) { other };
      };
    };
  };

  // Types
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
  };

  public type Competition = {
    id : Nat;
    name : Text;
    slug : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : CompetitionStatus;
    participantLimit : ?Nat;
    scrambles : [Text];
  };

  public type Attempt = {
    time : Nat;
    penalty : Nat; // +2 seconds or DNF (use max time)
  };

  public type Result = {
    user : Principal;
    competitionId : Nat;
    attempts : [Attempt];
    status : SolveStatus;
  };

  public type ResultInput = {
    user : Principal;
    competitionId : Nat;
    attempts : [AttemptInput];
    status : SolveStatus;
  };

  public type AttemptInput = {
    time : Nat;
    penalty : Nat;
  };

  // Persistent storage
  var nextCompetitionId = 0;
  var competitions = Map.empty<Nat, Competition>();
  var userProfiles = Map.empty<Principal, UserProfile>();
  var results = Map.empty<(Nat, Principal), ResultInput>();

  // Module for result score comparison
  module Result {
    public func compareByBestScore(a : ResultInput, b : ResultInput) : Order.Order {
      let bestScoreA = a.attempts[0].time + a.attempts[0].penalty;
      let bestScoreB = b.attempts[0].time + b.attempts[0].penalty;
      Nat.compare(bestScoreA, bestScoreB);
    };
  };

  // User Profile Management - Required by frontend
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

  public shared ({ caller }) func createUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User profile already exists");
    };
    userProfiles.add(caller, profile);
  };

  // Competition Management
  public shared ({ caller }) func createCompetition(comp : Competition) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create competitions");
    };

    let competitionId = nextCompetitionId;
    nextCompetitionId += 1;

    let newComp : Competition = {
      id = competitionId;
      name = comp.name;
      slug = comp.slug;
      startDate = comp.startDate;
      endDate = comp.endDate;
      status = comp.status;
      participantLimit = comp.participantLimit;
      scrambles = comp.scrambles;
    };

    competitions.add(competitionId, newComp);
    competitionId;
  };

  public query ({ caller }) func getCompetitions() : async [Competition] {
    // Public read - no auth check needed
    competitions.values().toArray();
  };

  public query ({ caller }) func getCompetition(id : Nat) : async ?Competition {
    // Public read - no auth check needed
    competitions.get(id);
  };

  // Results Management
  public shared ({ caller }) func startCompetition(competitionId : Nat) : async () {
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

        let resultKey = (competitionId, caller);
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
          attempts = Array.tabulate(5, func(_) { { time = 0; penalty = 0 } });
          status = #in_progress;
        };
        results.add(resultKey, newResult);
      };
    };
  };

  public shared ({ caller }) func submitAttempt(competitionId : Nat, attemptIndex : Nat, attempt : AttemptInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit attempts");
    };

    if (attemptIndex >= 5) {
      Runtime.trap("Invalid attempt index");
    };

    let resultKey = (competitionId, caller);
    switch (results.get(resultKey)) {
      case (null) { Runtime.trap("Result does not exist or not started") };
      case (?result) {
        // Verify ownership - users can only submit their own attempts
        if (result.user != caller) {
          Runtime.trap("Unauthorized: Can only submit your own attempts");
        };

        if (result.status != #in_progress) {
          Runtime.trap("Cannot modify completed result");
        };

        // Verify competition is still running
        switch (competitions.get(competitionId)) {
          case (null) { Runtime.trap("Competition does not exist") };
          case (?competition) {
            if (competition.status != #running) {
              Runtime.trap("Competition is not running");
            };
          };
        };

        // Update the attempt at the specific index
        let newAttempts = Array.tabulate(
          5,
          func(i) {
            if (i == attemptIndex) { attempt : AttemptInput } else { result.attempts[i] };
          },
        );

        let newResult = {
          user = result.user;
          competitionId = result.competitionId;
          attempts = newAttempts;
          status = result.status;
        };
        results.add(resultKey, newResult);
      };
    };
  };

  public query ({ caller }) func getResults(competitionId : Nat) : async [ResultInput] {
    // Public read - no auth check needed for viewing results
    results.entries().toArray().filter(func((key, _)) { key.0 == competitionId }).map(
      func((_, resultInput)) { resultInput }
    );
  };

  public query ({ caller }) func getLeaderboard(competitionId : Nat) : async [ResultInput] {
    // Public read - no auth check needed for viewing leaderboard
    let filteredResults = results.values().toArray().filter(
      func(result) {
        result.competitionId == competitionId and result.status == #completed
      }
    );
    filteredResults.sort(Result.compareByBestScore);
  };
};
