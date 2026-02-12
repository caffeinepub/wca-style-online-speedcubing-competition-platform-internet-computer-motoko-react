import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";

module {
  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    ADMIN_EMAILS : [Text];
    nextCompetitionId : Nat;
    nextMcubesId : Nat;
    competitions : Map.Map<Nat, Competition>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    results : Map.Map<(Nat, Principal, Event), ResultInput>;
    payments : Map.Map<(Nat, Principal, Event), PaymentConfirmation>;
    userEmails : Map.Map<Principal, Text>;
  };

  type OldUserProfile = {
    displayName : Text;
    mcubesId : Text;
  };

  type NewUserProfile = {
    displayName : Text;
    mcubesId : Text;
    country : ?Text;
    gender : ?Text;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    ADMIN_EMAILS : [Text];
    nextCompetitionId : Nat;
    nextMcubesId : Nat;
    competitions : Map.Map<Nat, Competition>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
    results : Map.Map<(Nat, Principal, Event), ResultInput>;
    payments : Map.Map<(Nat, Principal, Event), PaymentConfirmation>;
    userEmails : Map.Map<Principal, Text>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_principal, oldProfile) {
        { oldProfile with country = null; gender = null };
      }
    );
    { old with userProfiles = newUserProfiles };
  };

  public type Event = { #twoByTwo; #threeByThree; #fourByFour; #fiveByFive; #skewb; #megaminx; #clock; #threeByThreeOneHanded; #pyraminx };
  public type CompetitionStatus = { #upcoming; #running; #completed };
  public type SolveStatus = { #not_started; #in_progress; #completed };
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
  public type Attempt = { time : Nat; penalty : Nat };
  public type Result = { user : Principal; competitionId : Nat; event : Event; attempts : [Attempt]; status : SolveStatus };
  public type ResultInput = { user : Principal; competitionId : Nat; event : Event; attempts : [AttemptInput]; status : SolveStatus };
  public type AttemptInput = { time : Nat; penalty : Nat };
  public type PaymentConfirmation = {
    competitionId : Nat;
    event : Event;
    razorpayOrderId : Text;
    razorpayPaymentId : Text;
    razorpaySignature : Text;
  };
};
