import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type AttemptInput = {
    time : Nat;
    penalty : Nat;
  };

  type SolveStatus = {
    #not_started;
    #in_progress;
    #completed;
  };

  type NewResultInput = {
    user : Principal;
    competitionId : Nat;
    event : {
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
    attempts : [AttemptInput];
    status : SolveStatus;
    ao5 : ?Nat;
  };

  type OldResultInput = {
    user : Principal;
    competitionId : Nat;
    event : {
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
    attempts : [AttemptInput];
    status : SolveStatus;
  };

  // Ensure calculateAo5 function is idempotent in this context
  func calculateAo5(attempts : [AttemptInput]) : ?Nat {
    if (attempts.size() != 5) return null;

    let validAttempts = List.empty<Nat>();
    var dnfCount = 0;

    for (att in attempts.vals()) {
      if (att.time == 0) {
        dnfCount += 1;
      } else if (att.time > 0) {
        validAttempts.add(att.time + att.penalty);
      };
    };

    if (validAttempts.isEmpty()) return null;

    if (dnfCount >= 2) return null;

    let sorted = validAttempts.toArray().sort();
    let validSize = sorted.size();

    if (validSize >= 3 and validSize != 0) {
      let trimmed = Array.tabulate(validSize - 2, func(i) { sorted[i + 1] });
      let sum = trimmed.foldLeft(0, func(acc, t) { acc + t });
      ?(sum / trimmed.size());
    } else {
      null;
    };
  };

  type OldActor = {
    results : Map.Map<(Nat, Principal, { #twoByTwo; #threeByThree; #fourByFour; #fiveByFive; #skewb; #megaminx; #clock; #threeByThreeOneHanded; #pyraminx }), OldResultInput>;
  };
  type NewActor = {
    results : Map.Map<(Nat, Principal, { #twoByTwo; #threeByThree; #fourByFour; #fiveByFive; #skewb; #megaminx; #clock; #threeByThreeOneHanded; #pyraminx }), NewResultInput>;
  };

  public func run(old : OldActor) : NewActor {
    let newResults = old.results.map<(Nat, Principal, { #twoByTwo; #threeByThree; #fourByFour; #fiveByFive; #skewb; #megaminx; #clock; #threeByThreeOneHanded; #pyraminx }), OldResultInput, NewResultInput>(
      func(_id, oldResult) {
        {
          oldResult with
          ao5 = calculateAo5(oldResult.attempts);
        };
      }
    );
    { results = newResults };
  };
};
