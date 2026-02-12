import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type OldCompetition = {
    id : Nat;
    name : Text;
    slug : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : { #upcoming; #running; #completed };
    participantLimit : ?Nat;
    entryFee : ?Nat;
    events : [{ #twoByTwo; #threeByThree; #fourByFour; #fiveByFive; #skewb; #megaminx; #clock; #threeByThreeOneHanded; #pyraminx }];
    scrambles : [([Text], { #twoByTwo; #threeByThree; #fourByFour; #fiveByFive; #skewb; #megaminx; #clock; #threeByThreeOneHanded; #pyraminx })];
    isActive : Bool;
    isLocked : Bool;
  };

  type NewFeeMode = {
    #perEvent : Nat;
    #basePlusAdditional : { baseFee : Nat; additionalFee : Nat };
    #allEventsFlat : Nat;
  };

  type NewCompetition = {
    id : Nat;
    name : Text;
    slug : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : { #upcoming; #running; #completed };
    participantLimit : ?Nat;
    feeMode : ?NewFeeMode;
    events : [{ #twoByTwo; #threeByThree; #fourByFour; #fiveByFive; #skewb; #megaminx; #clock; #threeByThreeOneHanded; #pyraminx }];
    scrambles : [([Text], { #twoByTwo; #threeByThree; #fourByFour; #fiveByFive; #skewb; #megaminx; #clock; #threeByThreeOneHanded; #pyraminx })];
    isActive : Bool;
    isLocked : Bool;
  };

  type OldActor = {
    competitions : Map.Map<Nat, OldCompetition>;
  };

  type NewActor = {
    competitions : Map.Map<Nat, NewCompetition>;
  };

  public func run(old : OldActor) : NewActor {
    let newCompetitions = old.competitions.map<Nat, OldCompetition, NewCompetition>(
      func(_id, oldComp) {
        {
          id = oldComp.id;
          name = oldComp.name;
          slug = oldComp.slug;
          startDate = oldComp.startDate;
          endDate = oldComp.endDate;
          status = oldComp.status;
          participantLimit = oldComp.participantLimit;
          feeMode = oldComp.entryFee.map(func(fee) { #perEvent(fee) });
          events = oldComp.events;
          scrambles = oldComp.scrambles;
          isActive = oldComp.isActive;
          isLocked = oldComp.isLocked;
        };
      }
    );
    { competitions = newCompetitions };
  };
};
