---
title: 'Notes About Reactive Programming With RxJava'
date: '2017-04-17'
---
Central to RxJava is the `Observable` type that represents a stream of data or events.

The entire point of RxJava being reactive, is to support push. To support push `Observable` and `Observer` connect via subscription.

```
interface Observable<T> {
  Subscription subscribe(Observer s);
}
```

Once subscription is made, streams of data are handled using the following interface

```
interface Observer<T> {
  void onNext(T t);
  void onError(Throwable t);
  void onCompleted();
}
```

`onError` and `onCompleted` are terminal events and only one of them can happen (if the stream is not infinite).

An `Observable`, by default, is synchronous. Although it's bad to use an Observable with synchronous blocking I/O. It's generally not always wrong to use a synchronous `Observable`. For example, if we retrieve data from a cache, it doesn't make sense to add complexity to the code with asynchronous behavior because a cache has a lookup time of micro/nano seconds.

The actual criteria to decide about how we should implement our `Observable`, is whether the event production is blocking or not blocking.

That being said, most `Observable` functions pipeline are synchronous (map, filter, ...) because we want to produce the event stream but then we want to run computation on them. This will guarantee us efficiency and will avoid nondeterministic behavior due to scheduling, context switching and so on.

Parallelism is simultaneous execution of tasks, tipically on different CPUs or machines. Concurrency, on the other hand, is the composition or interleaving of multiple tasks.

The contract of `Observable` is that events (`onNext()`, `onCompleted()`,`onError()`) can never be emitted concurrently. Allowing concurrent `Observable` streams (with concurrent `onNext()`) would limit the types of events that can be processed and required thread-safe data structures. Is also slower to do generic fine-grained parallelism.

It is far more efficient to synchronously execute on a single thread and take advantage of the many memory and CPU optimizations for sequential computation. On a list is quite is to reason in this way but a stream does not know the work ahead of time, it just receives data via `onNext()` and therefore cannot automatically chunk the work.

The `Observable` type is lazy, meaning it does nothing until it is subscribed to. With lazyiness is possible to compose `Observable` together. Creating one does not actually cause any work to happen. The work will happen once subscribed. Being lazy also allows that a particular instance can be invoked more than once.

An `Observable` is the *dual* of an `Iterable`. It push instead of pull. Besides that, the same programming model can be applied by both:

```
getDataFromMemory(). // return Stream<String>
// OR
getDataAsynch(). // Observable<String>
.skip(10)
.limit(5)
.map(s -> s + "_transformed")
.forEach(System::out::println)
```

`rx.Observable<T>` is the abstraction is going to be used all the time. An `Observable` can produce an
arbitrary number of events. It can produce:
- Values of type T, as declared by `Observable`
- Completion events
- Error event

An instance of `Observable` does not emit any events until someone is actually interested in receiving them (this are called *cold* `Observable`).

```
tweets.subscribe(
    (Tweet tweet) -> { System.out.println(tweet); },
    (Throwable t) -> { t.printStackTrace(); }
  );
```

It's guaranteed that no other Tweet will be emitted after the exception.

By default Observable runs on current thread if not otherwise specified:

```
Observable<Integer> ints = Observable.create(
        subscriber -> {
            log("CREATE");
            subscriber.onNext(5);
            subscriber.onNext(6);
            subscriber.onNext(7);
            subscriber.onCompleted();
            log("COMPLETED");
        }
);
log("STARTING");
ints.subscribe( i -> log("Element"+ i) );
log("FINISHED");
```

This will print out:

```
main: STARTING
main: CREATE
main: Element5
main: Element6
main: Element7
main: COMPLETED
main: FINISHED
```

We can implement others `Observable` constructors as `create`:

```
static <T> Observable<T> just(T t) {
    return Observable.create(
            s -> {
                s.onNext(t);
                s.onCompleted();
            }
    );
}

static <T> Observable<T> never() {
    return Observable.create(
            s -> {}
    );
}

static <T> Observable<T> empty() {
    return Observable.create(
            s -> {
                s.onCompleted();
            }
    );
}

static Observable<Integer> range(Integer from, Integer to) {
    return Observable.create(
            s -> {
                IntStream.range(from, to).forEach( i -> s.onNext(i));
                s.onCompleted();
            }
    );
}
```

Every time we call `subscribe()`, the subscrition handler inside `create` is invoked. If you want to avoid call
create every time, you can use `cache()` that will give events already computed. Of course if stream is infinite, using `cache()` will kill a kitten.

To produce infinite streams it's not really convenient calling the computation inside the client thread, but rather start a new thread that will handle the computation. For how long should we keep computing stuff?

It is advised to use the method `isUnsubscribed()` to check if we have subscribers listening:

```
static Observable<BigInteger> naturalNumbers() {
    return Observable.create(
            s -> {
                Runnable r = () -> {
                    BigInteger i = BigInteger.ZERO;
                    while(!s.isUnsubscribed()) {
                        s.onNext(i);
                        i = i.add(BigInteger.ONE);
                    }
                };
                Thread thread = new Thread(r);
                thread.start();
                s.add(Subscriptions.create(thread::interrupt));
            });
}
```

```
Subscription subscribe = naturalNumbers()
        .subscribe(System.out::println,
          e -> System.out.println(e.getMessage())); // not triggered

// do something else [...]

    subscribe.unsubscribe();
```

Between the check of isUnsubscribed and the actual computation we could have also seconds to wait because the computation could be really big.

Passing thread::interrupt to the subscription allows you to quit as soon as possible without wasting time.
Be Aware that this will not trigger the `onError`. Subscription will end gracefully.

You cannot call the `onNext` from multiple threads. Don't do it, it violates Rx principles.

The class `Observable` has two useful methods: `timer` and `interval`.

The first one is like the method `sleep`, the latter instread emits at a fixed rate some element.

A cold `Observable` is lazy and doesn't emits until someone subscribes. This implies that every subscriber has its own copy of the stream because for every subscription the method `create` as mentioned above. Generally speaking a cold `Observable` involves some side effect like connecting to a database.

Hot `Observable` are independent from consumers, they emits even if there is no subscriber. At a certain point, when a subscriber subscribes, it will receive events that are being currently being emitted. An example of hot `Observable` is for example mouse events.

An example of hot subscriber can be seen via the method `publish` from `Observable`.
An example of what (to me seems) an almost cold subscriber can be seen via `share()`.

Given:

```
private static void refCount(Observable<Status> observable) {
    Observable<Status> observable1 = observable.share(); // or observable.publish().refCount();

    System.out.println("Subscribe1");
    Subscription subscribe1 = observable1.subscribe();

    System.out.println("Subscribe2");
    Subscription subscribe2 = observable1.subscribe();

    System.out.println("Unsubscribe1");
    subscribe1.unsubscribe();

    System.out.println("Unsubscribe2");
    subscribe2.unsubscribe();

}

private static void publish(Observable<Status> observable) {
    ConnectableObservable<Status> publish = observable.publish();

    System.out.println("Subscribe1");
    Subscription subscribe1 = publish.subscribe();

    System.out.println("Subscribe2");
    Subscription subscribe2 = publish.subscribe();

    Subscription connect = publish.connect();

    System.out.println("Unsubscribe1");
    subscribe1.unsubscribe();

    System.out.println("Unsubscribe2");
    subscribe2.unsubscribe();

    System.out.println("Disposing connection");
    connect.unsubscribe();
}
```

Running:

```
System.out.println("with Share:");
refCount(observable);
System.out.println("");
System.out.println("with Publish:");
publish(observable);
```

You get this output:

```
with Share:
Subscribe1
Connecting...
Subscribe2
Unsubscribe1
Unsubscribe2
Disconnecting...

with Publish:
Subscribe1
Subscribe2
Connecting...
Unsubscribe1
Unsubscribe2
Disposing connection
Disconnecting...
```

There are many operators.

One interesting thing is:

```
System.out.println("SCAN");
Observable.just(1,2,3).scan((total, chunk) -> total+chunk).subscribe(out::println);
System.out.println("REDUCE");
Observable.just(1,2,3).reduce((total, chunk) -> total+chunk).subscribe(out::println);
```

and the output is:

```
SCAN
1
3
6
REDUCE
6
```

Keep in mind that in case of infinite stream `scan` will keep emitting whereas reduce will never emit. If we use `distinct`, this will cause problems because it caches every event generated.

You can do this: `concat(fromCache, fromDb).first()` and just call `fromDb` only when element is not present in cache!! (`concat is lazy!`)

```
Observable<String> fromCacheEmpty = Observable.empty();
Observable<String> fromCacheOneElem = Observable.just("1");
Observable<String> fromCacheNElem = Observable.just("1", "3");
Observable<String> fromDb = Observable.just("2");

System.out.println("EMPTY -> DB");
Observable.concat(fromCacheEmpty, fromDb).first().subscribe(out::println);
System.out.println("CACHE1 -> NODB");
Observable.concat(fromCacheOneElem, fromDb).first().subscribe(out::println);
System.out.println("CACHE2 -> DB");
Observable.concat(fromCacheNElem, fromDb).first().subscribe(out::println);
```

with output:

```
EMPTY -> DB
2
CACHE1 -> NODB
1
CACHE2 -> DB
1
```

Read on the chapter about `concat`, `merge` and `switchOnNext` starting on page 97. It's so cool.

Want to do event sourcing with RxJava? Done!

```
eventStore
.observe()
.groupBy(event::uuid)
.subscribe( uuid -> uuid.subscribe(this::updateProjection));
```

You can use `observeOn` and `subScribeOn` to move on different thread the computation and the subscription of your flow of data. `subscribeOn` allows you to tell on which thread you want to push events down to your stream. A common use case is to process the stream on the the background but emit it on another thread (common example is to do heavy computation on the backend and observe on the UI thread). In this case you can use the `observeOn` method.

You can also achieve parallelism with this feature but keep in mind that you need to take care of how much parallelism your system can handle. `flatMap` method has an overloaded method that allows you to control parallelism. You have many `Schedulers` from which you can get threads. Remember that `io()` will spawn new threads if existing ones are being used whereas `computation()` has CPU-bound threads.

To recap:

* `Observable` without `subscribeOn` will work like a single threaded program with blocking calls
* `Observable` with `subscribeOn` will start a thread on background where the work is done (inside the thread still sequential calls)
* `Observable` using `flatMap` and inside it `subscribeOn` will start a new thread for each `Observable`

Another concept really important with reactive programming is *backpressure*. In every system based on message passing, the problem of the consumer not
consuming fast enough can be present. If the consumer is able to give a feedback to the producer, the producer now can control how much it's producing (although if you have a hot producer, that could be not true).

Many operators have backpressure built-in so there is no need to worry about it. If you have to produce from scratch a producer, you can use `SyncOnSubscribe.createStatless|createStateful` (there is also the Async version). Don't use `create` from `Observable` because you won't have backpressure on it.

To know about testing, you can read about it [here](https://www.infoq.com/articles/Testing-RxJava)
