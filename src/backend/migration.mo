import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
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

  public type AttemptInput = {
    time : Nat;
    penalty : Nat;
  };

  public type ResultInput = {
    user : Principal;
    competitionId : Nat;
    event : Event;
    attempts : [AttemptInput];
    status : SolveStatus;
  };

  public type PaymentConfirmation = {
    competitionId : Nat;
    event : Event;
    razorpayOrderId : Text;
    razorpayPaymentId : Text;
    razorpaySignature : Text;
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

  public type OldActor = {
    nextCompetitionId : Nat;
    nextMcubesId : Nat;
    competitions : Map.Map<Nat, Competition>;
    userProfiles : Map.Map<Principal, UserProfile>;
    results : Map.Map<(Nat, Principal, Event), ResultInput>;
    payments : Map.Map<(Nat, Principal, Event), PaymentConfirmation>;
    userEmails : Map.Map<Principal, Text>;
  };

  public type NewActor = {
    nextCompetitionId : Nat;
    nextMcubesId : Nat;
    competitions : Map.Map<Nat, Competition>;
    userProfiles : Map.Map<Principal, UserProfile>;
    results : Map.Map<(Nat, Principal, Event), ResultInput>;
    payments : Map.Map<(Nat, Principal, Event), PaymentConfirmation>;
    userEmails : Map.Map<Principal, Text>;
    userPayments : Map.Map<Principal, Map.Map<Nat, PaidEvent>>;
  };

  public func run(old : OldActor) : NewActor {
    {
      nextCompetitionId = old.nextCompetitionId;
      nextMcubesId = old.nextMcubesId;
      competitions = old.competitions;
      userProfiles = old.userProfiles;
      results = old.results;
      payments = old.payments;
      userEmails = old.userEmails;
      userPayments = Map.empty<Principal, Map.Map<Nat, PaidEvent>>();
    };
  };
};
