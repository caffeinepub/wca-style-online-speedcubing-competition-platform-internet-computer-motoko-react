import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  public type OldCompetition = {
    id : Nat;
    name : Text;
    slug : Text;
    startDate : Int; // Time.Time is just Int underneath
    endDate : Int;
    status : {
      #upcoming;
      #running;
      #completed;
    };
    participantLimit : ?Nat;
    feeMode : ?{
      #perEvent : Nat;
      #basePlusAdditional : {
        baseFee : Nat;
        additionalFee : Nat;
      };
      #allEventsFlat : Nat;
    };
    events : [{
      #twoByTwo;
      #threeByThree;
      #fourByFour;
      #fiveByFive;
      #skewb;
      #megaminx;
      #clock;
      #threeByThreeOneHanded;
      #pyraminx;
    }];
    scrambles : [([Text], {
      #twoByTwo;
      #threeByThree;
      #fourByFour;
      #fiveByFive;
      #skewb;
      #megaminx;
      #clock;
      #threeByThreeOneHanded;
      #pyraminx;
    })];
    isActive : Bool;
    isLocked : Bool;
  };

  public type OldActor = {
    nextCompetitionId : Nat;
    competitions : Map.Map<Nat, OldCompetition>;
  };

  public type NewCompetition = {
    id : Nat;
    name : Text;
    slug : Text;
    startDate : Int;
    endDate : Int;
    status : {
      #upcoming;
      #running;
      #completed;
    };
    participantLimit : ?Nat;
    feeMode : ?{
      #perEvent : Nat;
      #basePlusAdditional : { baseFee : Nat; additionalFee : Nat };
      #allEventsFlat : Nat;
    };
    events : [{
      #twoByTwo;
      #threeByThree;
      #fourByFour;
      #fiveByFive;
      #skewb;
      #megaminx;
      #clock;
      #threeByThreeOneHanded;
      #pyraminx;
    }];
    scrambles : [([Text], {
      #twoByTwo;
      #threeByThree;
      #fourByFour;
      #fiveByFive;
      #skewb;
      #megaminx;
      #clock;
      #threeByThreeOneHanded;
      #pyraminx;
    })];
    isActive : Bool;
    isLocked : Bool;
    registrationStartDate : ?Int;
  };

  public type NewActor = {
    nextCompetitionId : Nat;
    competitions : Map.Map<Nat, NewCompetition>;
  };

  public func run(old : OldActor) : NewActor {
    let newCompetitions = old.competitions.map<Nat, OldCompetition, NewCompetition>(
      func(_id, oldComp) {
        { oldComp with registrationStartDate = null };
      }
    );
    {
      old with
      competitions = newCompetitions;
    };
  };
};
