---
title: 'Notes About Java Concurrency in Practice'
date: '2017-01-22'
---
I just finished the book "Java Concurrency in Practice" by B. Goetz and others.

Here's you have a preview from Google Books. (Apparently previews cannot be scaled so it's a little bit big)

<script type="text/javascript" src="//books.google.com/books/previewlib.js"></script>
<script type="text/javascript">
GBS_insertEmbeddedViewer('ISBN:0321349601',600,500);
</script>

I heard about this book many times over the years but I've decided to read it after watching Ben Christensen's [Functional Reactive Programming with RxJava](https://www.youtube.com/watch?v=_t06LRX0DV0).

He read this book many and many times before starting the design of RxJava.

I actually agree with him about read it at least one more time to better understand some of the concepts.
For that I decided to write these notes as a way to read again some of the interesting parts I found in the book.

I honestly don't think I have to spend much time on saying why everyone who works with Java, or any other of the JVM languages for that matter, should read it because we are talking about a really well known book but I still like to put here the following words:

> Our goal is to give readers a set of design rules and mental models that make it easier, and more funny
to build correct, performant concurrent classes and applications in Java.

Now let's move on the actual notes from "Java Concurrency in Practice".

#### Thread confinement
Accessing shared, mutable data requires using synchronization. One way to avoid it is *not to share*.

`ThreadLocal` is a way to maintain [thread confinement](https://docs.oracle.com/javase/8/docs/api/java/lang/ThreadLocal.html) associating a value on a per-thread basis. `ThreadLocal` has a method `protected T initialValue()` that you have to override to set the initialValue for this `ThreadLocal`. The overridden method is invoked when for the first time `get` is called. There is also the `set` method that allows you to reset the value for the thread.

But, the best way to keep thread confinement is **immutability**. If you ever took a course about functional programming, you already know the power of immutability. Immutable object are simple, their state cannot change because it's controlled by the constructor.

An object is *immutable* if:
  * its state cannot be modified after construction
  * all its fields are *final*
  * the *this* reference does not escape during construction


#### Synchronizers
A *synchronizers* is any object that coordinates the control flow of threads based on its state. All synchronizers share a common pattern: when a thread arrives to the synchronizer, relies on the internal state of
the synchronizer to understand if it needs to wait or can proceed over.

##### Latches
A latch is a gate. Until the latch reaches its terminal state, the gate is closed and no thread can pass. A latch can be used to block a thread until resources it needs to use are ready, or to check, in a multiplayer game that every player is read before starting the match.

Here's an example:

```
public class TestHarness {

    private long timeTasks(int nThreads, final Runnable task) throws InterruptedException {
        final CountDownLatch startGate = new CountDownLatch(1);
        final CountDownLatch endGate = new CountDownLatch(nThreads);

        range(0, nThreads).forEach( (x) -> new Thread(() -> {
            try {
                startGate.await(); // waiting for the main thread to finish to create nThread
                task.run(); // do my job
                endGate.countDown(); // job done, one task less to do
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start());

        long start = System.nanoTime();
        startGate.countDown(); // all threads can start
        endGate.await(); // wait for all thread to finish
        return System.nanoTime() - start;
    }
}
```

##### Semaphores
If latches are a gate, semaphores could be seen as a counter of how many threads can access a resources at the same time. A Semaphore manages a set of virtual permits (which is passed as initial number to the constructor).
A thread con `acquire` a permit and then `release` it.

A semaphore with just one permit is a degenerate case of binary semaphore: a mutex. It's used to allow the usage of a certain resource one thread at the time.

A semaphore can also be used to transform any collection to a blocking bounded collection.
```
public class BoundedHashSet<T> {
    private final Set<T> set;
    private final Semaphore semaphore;

    public BoundedHashSet(int bound) {
        this.set = Collections.synchronizedSet(new HashSet<T>());
        this.semaphore = new Semaphore(bound);
    }

    public boolean add(T o) throws InterruptedException {
        semaphore.acquire(); // I can add only if set has available spots
        boolean wasAdded = false;
        try {
            wasAdded = set.add(o);
            return wasAdded;
        } finally {
            if(!wasAdded) {
                /*
                 if the element was not added then I can
                 free the spot because I don't need it anymore
                 */
                semaphore.release();
            }
        }
    }

    public boolean remove(T o) throws InterruptedException {
        boolean wasRemoved = set.remove(o);
        if(wasRemoved) {
            semaphore.release(); // spot free for another add!
        }
        return wasRemoved;
    }
}
```

##### Barriers
Barriers blocks a group of thread until something has occurred. Latches wait for events, barriers wait for other threads. It's like saying "we'll meet at the office at 6PM, once everyone has arrived, we'll decide what to do next".

With a barrier every thread that has finished its job calls *await*. If await timeouts or a thread gets interrupted then the barrier is broken and every thread will get a `BrokenBarrierException`. If the barrier successfully passed by everythread, await returns a unique arrival index for each thread.

A common usage of a barrier is when you can split the work of an algorithm in many subtasks that can be run in parallel. After every subtask has finished, the result can be manipulated and move forward.

```
private CellularAutomata(Board board) {
    this.mainBoard = board;
    int count = Runtime.getRuntime().availableProcessors();
    // barriers and workers
    // associated to available processors
    this.barrier = new CyclicBarrier(count, mainBoard::commitNewValues);
    // commitNewValues is what's happening when everyone has arrived
    // at the barriers
    this.workers = new Worker[count];
    range(0, count).forEach(i -> workers[i] = new Worker(mainBoard.getSubBoard(count, i)));
}

// [...]

private void start() {
    IntStream.range(0, workers.length).forEach(x -> new Thread(workers[x]).start());
    mainBoard.waitForConvergence();
}

private class Worker implements Runnable {
    private Board subBoard;
    Worker(Board subBoard) {
        this.subBoard = subBoard;
    }

    @Override
    public void run() {
        while (!subBoard.hasConverged()) {
            // keep doing it until stop condition
            // always reach the barrier
            range(0, subBoard.getMaxX()).forEach(
                    x -> range(0, subBoard.getMaxY()).forEach(
                            y -> subBoard.setNewValue(x, y, computeValue(x,y))
                    )
            );
            try {
                barrier.await();
            } catch (InterruptedException | BrokenBarrierException | TimeoutException e) {
                return ;
            }
        }
    }
// [...]
```

#### Disadvantages of unbounded thread creation
It's not a wise choice to create threads with no bounds for a series of reasons:
- the lifecycle of a thread has quite an overhead. Creating a thread costs units of computing. This is not always necessary. Generally you can reuse threads for requests (like the ones handling a webserver).
- Having more thread than available processors means that at a certain point in time will have threads sitting idle while waiting for their time on a processor. Threads occupy memory so if you keep creating them, you will fill up that memory.
- up to a certain point threads can improve throughput, but beyond that point, creating more threads will just slow down the system.

#### Thread pools
Thread pools helps avoiding unbounded thread creation, they offers execution policies that can help fine tune the requirements of our app.

Using worker threads minimizes the overhead due to thread creation. Thread objects use a significant amount of memory, and in a large-scale application, allocating and deallocating many thread objects creates a significant memory management overhead.

Here's some example:
- the first example of thread pool that can directly respond to the problem explained on the previous paragraph is the `newFixedThreadPool`. It's a fixed thread pool that creates task as they are submitted, up to a maximum pool size, after that new task will be put on a queue. It offers the concept of *graceful degradation* because if there are more task than available threads, the pool doesn't just start creating new threads, just keeps serving task with the maximum number of threads meaning that of course some task will be worked after a while (hence *graceful*).

- a different example of thread pool is a `newCachedThreadPool` which is much more flexible because it doesn't actually have an upper bound and keeps threads cached for a specific amount of time (60 seconds), thus avoiding the recreation of a thread if one is available. It could be a little bit dangerous because if task keeps coming with a really high rate this pool will fill up the memory.

- the `newSingleThreadExecutor` is a single-threaded executor meaning that there is only one thread and tasks will be processed sequentially according to the order imposed by the task queue.

These methods are present on `java.util.concurrent.Executors`. They all wrap `ThreadPoolExecutor` which is a configurable way of creating new executors. It gives you granular control and therefore you can do the following:

- set the task queue as bounded queue to have better control
- configure the correct `RejectionHandler`, it could be yours or default handlers provided by JDK
- If you have something to do on before/after completion of task, override `beforeExecute(Thread, Runnable)` and `afterExecute(Runnable, Throwable)`
- Override ThreadFactory if thread customization is required

#### Conclusion
I'll probably read again the second part of the book, which is about scalability, testing and measuring how our system is performing. I would say that, when thread are involved, those concepts need a deeper understanding of how concurrency works.

As an example I will leave you with this: Amdahl's law express how much a program can theorically sped up by additional computing resources. The formula is based on the proportion between parallel and serial work.

So it would be wise to say that if you can create task that can be completely run in parallel, then we have basically zero serial work and we can add more and more cores to sped up our computation power.

This is not actually true though, because every parallel program needs to handle, as an example, the work queue. The access to work queue needs to have some sort of synchronization because the work queue is shared among many threads.

Happy reading!
