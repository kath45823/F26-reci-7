# Reflection

**Name / Andrew ID: Katherine (kgeng2)**

**Recitation group members (Task 2): N/A**

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

One property I wrote was an invariant property that ensures matchGuess always returns five colors. It doesn't catch any of the mutants, but it's still a valid property because it passes on any correct implementation and it checks the length of the output (it's weak in that it doesn't check if the five colors are actually right). A concrete bug it would catch could be something like an off by one loop that builds the color result with push (so something that would return only 4 colors by accident). 

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

The mutants that survived because of my generato were touchingNotMerged and mergesIntegerNeighbors. The generator failed to produce intervals that shared an endpoint or sit exactly 1 apart. 

Before: 
  ~ touchingNotMerged       flaky: killed in 1/5 runs  by: returns sorted intervals that neither overlap nor touch
      Counterexample: [[[236,236],[-270,236]]]
      AssertionError: expected 236 to be less than 236
  ~ mergesIntegerNeighbors  flaky: killed in 4/5 runs  by: returns already-disjoint input sorted and otherwise unchanged; covers exactly the same points as the input
      Counterexample: [[[[0,0],[1,1]],[[0,0],[1,1]]]]
      AssertionError: expected [ [ +0, 1 ] ] to deeply equal [ [ +0, +0 ], [ 1, 1 ] ]

Mutation score: 5/7 killed (71%)

After: 
  ✔ touchingNotMerged       killed  by: returns sorted intervals that neither overlap nor touch; does not depend on the order of the input
      Counterexample: [[[0,1],[1,1]]]
      AssertionError: expected 1 to be less than 1
  ✔ mergesIntegerNeighbors  killed  by: covers exactly the same points as the input; returns already-disjoint input sorted and otherwise unchanged
      Counterexample: [[[16,16],[15,15]]]
      AssertionError: expected true to be false // Object.is equality

Mutation score: 7/7 killed (100%)

The fix is that starts are now in -20,..20 and lenghts are from 0,..5 so shared endpoint cases come up more often. The disjoint generator also uses gaps of 1,..3 so a gap of exactly 1 is also pretty common. 

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

  ✔ mergesIntegerNeighbors  killed  by: covers exactly the same points as the input; ...
      Counterexample: [[[16,16],[15,15]]]
      AssertionError: expected true to be false // Object.is equality

The result must cover exactly the same points as the input (including real numbers) but the input [16, 16] and [15, 15] leaves a gap where no point between 15 and 16 is covered like 15.5 for example. The mutant treats intervals 1 apart as touching and merges them into [15, 16] so the differential check sees 15.5 covered in the output but not in the input. 

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

Function: Sortable ID Generation (IDs used for sessions, messages, etc.)

Property #1 (Invariant): For any sequence of IDs createed one after another, all of them are different and sorting them as plain strings gives exactly they order they were created in 

Property #2 (Metamorphic): Create the same sequence twice at the same timestamps once with ascending and once with descending. Sorting the descending IDs should give the reverse of the ascending order

Generator: A list of creation timestamps. A naive generator would just call ascending a few times in a loop which doesn't cover cases when there are many IDs in the same millisecond, timestamps at the edges, etc. 
