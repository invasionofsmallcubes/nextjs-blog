---
title: 'Notes From Voxxed Days 2016 in Zurich'
date: '2016-03-03'
---
### Kotlin - Ready for Production
Link to [schedule](https://cfp-vdz.exteso.com/program/talk/CPG-0115/Kotlin____Ready_for_production.html)
Kotlin is a pragmatic language, made to be efficient and avoid boilerplate code.
Intellij didn't consider Scala because it's a complicated language (for what they have to achieve).
Kotlin it's not a revolution, it's an improvement of the language they used.
Used in 10 products at Jetbrains.
You can have a look at its [repository](https://github.com/JetBrains/kotlin)
Then many code samples, basically go [here](https://kotlinlang.org/docs/tutorials/getting-started.html) to start.

### Speed, scale, query: can NoSQL give us all three?
Link to [schedule](https://cfp-vdz.exteso.com/program/talk/DXU-9635/Speed__scale__query__can_NoSQL_give_us_all_three_.html)
Can we achieve all those three feature now that NoSQL is mature?
What does have an impact on those?:
- NoSQL non-relational types: key-value, document, columnar, graph
- Architecture: master-slave, master-master (distributed topology or replicated). With distributed you got availability, with replicated you get eventual consistency but dataset must fit one machine

So, what we could have:
- one single server key-value: it's fast, not scalable
- master-salve document: eventual consistency, single point of failure, query could be slower
- dynamo-like distribued master-master column store: eventual consistency, the data model favour writes but architecture favour reads, there is no single point of failure
- distribued master-master, strong consistency, document: data model has simple get and set, scalable, consistency.

### Lambda core - hardcore
Link to [schedule](https://cfp-vdz.exteso.com/program/talk/WCB-3457/Lambda_core___hardcore.html)
Presentation not useful for our daily job!
Lambda (by Alonzo Church) from Lambda Calculus, a lot of math.

~~~~~~~~ java
lambda identity = x -> x
lambda funny = a->identity
~~~~~~~~

so funny.apply(funny) equals to identity

~~~~~~~~ java
lambda aTrue = x->y->x;
lambda aFalse = x->y->y;
lambda and = (p)->(q)->p.apply(q).apply(p);
lambda or = (p)->(q)->p.apply(p).apply(q);
~~~~~~~~

I took this note, then he goes on defining with lambdas key structure of a procedural language, eg:

~~~~~~~~ java
Lambda ifLambda = (c)->(t)->(f)->c.apply(t).apply(f).apply(x->x)
~~~~~~~~

Everything can be done purely functional without side effect and mutability :)
Since it's possible, we should do it!

### No more stress with the tests - Stresstesting with Gatling!
Link to [schedule](https://cfp-vdz.exteso.com/program/talk/BED-0378/No_more_stress_with_the_tests___Stresstesting_with_Gatling_.html)
For your stresstest use [gatling](http://gatling.io)
Based on Scala, Akka and Netty IO framework.
The gatling recorder act as a proxy between your browser and the server so that it can record macros.
Once the recorder has generated the script, you can actually write code about it with Scala directly.
Gatling supports Graphana dashboard to have real time monitoring.

### G1 Garbage Collector: details and tuning
Link to [schedule](https://cfp-vdz.exteso.com/program/talk/NSP-4199/G1_Garbage_Collector__details_and_tuning.html)
G1 is low-pause collector, since JDK7. Replace for CMS.
Low pause is valued more than max throughput for majority of Java apps.
You just need Xmx and the max stop-the-world pause you want in millis.
G1 is for young and old generation.
Young generation is stop-the-world, parallel, copying.
Old generation is concurrency marking but don't recall the space.

Keep G1 logging on always!! (almost no overhead)

G1 divides heap in small regions with a name: Eden, Survivor, Old regions and Homoungous which is a new region reserved for big objects.

G1 prepares Eden regions, application fills those regions. When Eden regions are full -> Young GC.
You can have pointers from old region to new region.

The Remembered Set keeps which information about external objects pointing to objects in its region.

The JVM has a write barrier that tracks inter-region pointers updates. It happens when you launch `object.field = <ref>`.

G1 Young Gen phases:
- stops the world
- the regions that will be subjects to collection
- root scanning
- updated remembered set
- process remembered set (understand actually which objects are alive in Eden)
- object copy (live objects copied to survivor/old regions)
- reference processing (soft, weak, phantom, final, jni weak references)

G1 Old Gen is scheduled when heap is 45% full. It's checked after young gc or humongous allocation.
G1 Old GC does only concurrent marking (using tri-color marking).
G1 uses Snapshot-at-the-beginning technique that basically use a write barrier `B.c = null` and saves C as to be analyzed at the next remark because `B.c = null`can consider c not more pointed by anyone but while marking, the application could do an assignment to c and G1 wouldn't know. Because of this, G1 works better if it has more space than need to retain floating garbage to get collected at the next cycle.
After this cleans up empty old regions (empty meaning that there is no pointer to it).

G1 deals with old regions that has some live reference in them in this way: it divides mixed old regions by 8, it takes those region, move live objects to another old region and clean this now that is full of garbage. It consider mixed regions to have only 5% of live objects (so moving them it's really quick).

You should avoid humongous allocations increasing heap size and region size.
Find cause of WeakReferences (ThreadLocals, RMI and Third party libraries).

### What is Pure Functional programming, and how it can improve our application testing?
Link to [schedule](https://cfp-vdz.exteso.com/program/talk/FPX-6471/What_is_Pure_Functional_programming__and_how_it_can_improve_our_application_testing_.html)
Functional programming: functions are values and can be used as arguments and basically can be used as value. They are focused on evaluating expression (what we want to do, not how) and not executing instructions.
In pure functional programming, every expression is pure, therefor it has referential transparency: an expression can be changed by its value without changing the behavior of a program:

~~~~~~~~ java
sum: (int, int) -> int
sum: a b = a + b
sum 2 3 = 5
sum 2 3 = 5 // always the the same output given the same input
~~~~~~~~

Testing pure code is far more easier because of referential transparency.
Testing with functions can abstract much better the business logic.
The secret is to separate the domain from the complexity of operations on the the edge of the domain.
Also tests must be deterministic.

[Property based testing](http://www.slideshare.net/ScottWlaschin/an-introduction-to-property-based-testing) means that generates a lot of random values with fixed properties that are invariant towards the tests. You use properties instead of assertions. Property based testing is easier with pure fp, because every time you generate the same property, you get the same output.

You should separates pure part from impure part. For pure parts you get unit testing and property testing, for impure part you get integration tests (impure parts are the one that communicates with a database for example).
