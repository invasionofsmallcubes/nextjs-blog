---
title: 'Notes From JBrains Workshop in Milan 2015'
date: '2015-12-16'
---
So I had a chance to follow a workshop by [JBrains](http://www.jbrains.ca)
thanks to the company I work for, lastminute.com.

Here you can find the notes I took during these two days.

The workshop was composed by programming sessions, Q&A sessions and TDD sessions
where JBrains explained how to do Evolutionary Design
(which is a really cool name for what I do every day, instead of TDD).

*Here's my notes (contact me on twitter if you see any error):*

Ask about the interface to the customer.
Example: what happens if I don't find the bar-code?

Book "Getting things done!".

Get to the green bar as fast as you can.
Spend as much time as possible in the
green code-base. Write everything when
everything is in the green bar.

Reduce the margin cost of adding a new feature.
If we "don't clean the kitchen" the margin cost
will go up like an exponential curve.

Ownership of responsibility. Code without error
is your responsibility as a programmer.

Usage of primitive obsession: usage of simple
types instead of complex objects.

Objective of refactoring is to make the next
task easy.

A feature is READY: somebody will be able to use this

Testing steps:

* Arrange (constructors, resources for the test)
* Act (do the actual action)
* Assert (check it's working)

Not more than one action per test.

Teams should not have different vision on code.
It's a problem otherwise: a failure is "keeping the marriage together for the kids".

The customer doesn't know how many details
he needs to give you. Try to get an approximate
idea of what they want and then give back an implementation
to get a quick feedback. A that point you can talk
giving examples on what they need.

ALWAYS ask to the customer.

Check for signs that the design is going out of control.
Example: you test arithmetics checking strings.

Check for irrelevant lines, separate them and you
can see when you need to remove them from the class.

The link between the input and the expected output
must be clear.

Book "Chess: 5334 Problems, Combinations and Games".

The only problems we have when dealing with client-server are
the ones about not respecting the contract.
Example: I don't pass you "null".

In case of copy and paste code, use learning tests.
If I don't have control of the design I don't do TDD,
I can write learning to test to understand the
contract.

Test First programming to avoid mistakes!

If a test is difficult to write or we are testing something indirectly
then probably production code has problems.

Find a community of people with more experience than you,
they can give you advice when you have doubts on your code.

With TDD you can learn module design.

Agile works when you're willing to change the plan.

Book "The Goal" about theory of constraints.

The 4 rules of simple design.
A simple design means:

1. <del>Passes its tests</del>
2. Minimizes duplication
3. Maximizes clarity
4. <del>Has fewer elements</del>

You just need those 2.

Developing strong skills on detecting duplication,
removing duplication, identifying naming problems,
and fixing naming problems equates to learning
everything ever written about object-oriented
design.

- Remove Duplication => Structure Emerges
- Improve Names => Redistribute Responsibilities

If the name has "if, then, but, or, and" then
something is wrong with the method. Also check for
something like: *displayResult(String barcode)* is something
that should let you think because it tells you that inside
you are finding the price associated to the barcode and
then displaying it.

The single most important thing a human can do is
abstraction. We need to treat a box like a single thing.

Improve names -> Abstraction emerge ->
Higher-level duplication -> remove duplication ->
structures emerge -> structures need names
-> go to "Improve names" and start again.

When it works STOP WRITING. Then go for removing
duplication and liability.

Egoless programming: <http://blog.codinghorror.com/the-ten-commandments-of-egoless-programming/>

Don't use static because it's a strong dependency
in your code.

You need to move your classes from test to
production as soon someone needs it.

If you feel the need to format the code, just
format it then commit and then start working
otherwise diff will not be clear.

When you see a typo made by another team
member count to 15 before telling him.

Mistake proof: build the system so that the
components goes in one place in one way (I think).
Poka-yoke for more information: <https://en.wikipedia.org/wiki/Poka-yoke>

Programming by accident: move the things until
the things seems to work.

Course: "Structure and Interpretation of
Computer Programs"

TDD is a bad name. Test is actually an implementation of what we could call evolutionary design.
TDD doesn't mean it's tested. It means I design using tests to control what I'm doing without the fear of losing features.
