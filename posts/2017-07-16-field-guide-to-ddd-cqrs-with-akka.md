---
title: 'Field Guide to DDD/CQRS With Akka'
date: '2017-07-16'
---
## Notes on "field Guide to DDD/CQRS with Akka"

This is are the notes as seen on this talk at Devoxxx Belgium:

<iframe width="560" height="315" src="https://www.youtube.com/embed/fQkKu4tTgCE?rel=0&amp;controls=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>

Let's begin
- aggregate is responsible for consistency *(DDD)*
- you can only modify one aggregate per transaction *(DDD)*
- write model receives commands and produce events *(CQRS)*
- strict consistency on write model side *(DDD/CQRS)*
- read models are created from events *(CQRS)*
- eventual consistency if asynch *(CQRS/ES)*
- events can be stored and replayed (ES)

Now we will se what operation we should implement for CQRS (in a non-reactive way)

```scala
trait DomainCommand
trait DomainEvent
trait Aggregate

trait Behavior {
  // this is part of the constructor
  // it has to validate the DomainComman then it produces an event
  // only if DomainCommand is valid
  def validate(cmd: DomainCommand) : DomainEvent

  // once the first event is created we use this method to creat an aggregate
  def applyEvent(evt: DomainEvent) : Aggregate

  // we have to separate method because:
  // 1) we want to write code between validation and application of an event
  // 2) in case of replay, we don't have commands, just events

  // this method validates a command against an existing aggregate
  def validate(cmd: DomainCommand, agg: Aggregate) : DomainEvent

  // application of an event on the aggregate
  // aggregate is immutable, so we produce a new aggregate every time we use this apply event
  def applyEvent(evt: DomainEvent, agg: Aggregate) : Aggregate
}
```

In Akka the main component is a `PartialFunction[Any,Unit]` that will consume any type and will return a `Unit` . It's too broad and we know, given a command in input, which domain we will produce.

Akka is an actor system. We send messages to an *actor* which we cannot manipulate directly, we use its `ActorRef`.

The message will go to the `Actor` mailbox and the `Actor` will consume it when it is ready to do so.

An `Actor`can have an internal mutable state but it cannot be accessed from outside.

An `Actor` stays in memory until dies or it's terminated. With `Akka Persistence` we can save the events we send after processing a message and so we can then recover a state.

An `Actor` has a receive method that can handle messages that comes from the system. If that `Actor` will receive a message it cannot handle, will just ignore it. It will send it to a *dead letter queue*.

The `Actor` will collect messages in the `Mailbox` until it is not ready to read another one. In the `Mailbox` messages are kept in order of arrival. `Akka` will guarantee it for you.

With event sourcing you have first to persist the event generated from a command (the message) using the Behavior trait and after that I can finally apply that command to the aggregate.

The `AggregateManager` is the entry point for a given Aggregate type. It forwards message to the correct Aggregate based on the id. It also stops children according to a *passivation strategy*.

In `Akka Persistence` you can have snapshots.

`Akka` being a `PartialFunction` that goes from `Any` to `Unit` is to broad and doesn't respect our domain. So we want to define something more stricter, done specifically for our domain.

We give to the scala compiler the responsibility about signaling if something is wrong about the usage of my commands and events.

```scala
trait ProtocolDef {
  trait ProtocolCommand extends DomainCommand
  trait ProtocolEvent extends DomainEvent
}

trait Aggregate {
  type Protocol <: ProtocolDef
  // type member (similar to type parameter)
  // a type member can be referenced and so
  // you can navigate your type
}

object ProductProtocol extends ProtocolDef {
  case class CreateProduct ... extends ProtocolCommand
  case class ProductCreate ... extends ProtocolEvent
}

case class Product(...) extends Aggregate {
  type Protocol = ProductProtocol.type
  // so aggregate Product responds to
  // protocol of type ProductProtocol
  // they are bounded
}

trait Behavior[ A <: Aggregate ] {
  type AggregateType : A
  type Command: AggregateType#Protocol#ProtocolCommand
  type Event = AggregateType#Protocol#Protocolvent

  // AggregateType bounds Command and Event to be only of that type
  // you will have compile error

  def validate(cmd: Command) : Event
  def applyEvent(evt: Event) : AggregateType
}
```

With this strategy we use the type system in our favour to create a sound domain.

Now we want to make our behavior more reactive.

```scala
def validate(cmd: Command) : Future[DomainEvent]
```

With `Future` the problem is that some command can take more time than another one so there could be a problem with order arrival of a `DomainEvent`. A `Future` will return instantly so the actor will consume the next message from the mailbox.

We can have two types of aggregate:

- **Authoritative**: can validate everything it receives grabbing information from other systems
- **Authomonus**: can validate everything it receives without the necessity to ask outside of itself

Aggregate needs to be open to async programming.

```scala
def validate(cmd: Command) : Future[Seq[DomainEvent]]
```

One command can also release more than one event.

Never apply an event async. Always sync!

The read model needs to work the same way as the write model, so it has to process one event ad the time in a stream. There is a `ProjectionActor` that subscribe to a stream (with `Akka Persistence Query`) and until the Projection has finished applying that event, it won't work on another one. `ProjectionActor` is responsible for doing backpressure on the stream.

Generally you have one `Actor` per `AggregateId`.

To handle, let's say, with good performance, all the commands end events, it's good to return a `Future` instead of the value so that you can process them in a different executor. This aims to not overwhelm the actor system executor with *business logic* work. To do that, you need to *switch* the nature of your Actor from *normal* (when it is able to process every event) to *busy* meaning that it doesn't process anything until the previous task has ended.

This is the `Busy` state:

```scala
  private def busy: Receive = {
    val busyReceive: Receive = {
      case Successful(events, nextState, origSender) => onSuccess(events, nextState, origSender)
      case failedCmd: FailedCommand                  => onFailure(failedCmd)
      case TypedCommand(cmd) =>
        log.debug("aggregate '{}' received {} while processing another command", identifier, cmd)
        stash()
    }
    defaultReceive orElse busyReceive
  }
```

This is the `Available` state:

```scala
    val receive: Receive = {
      case TypedCommand(cmd) =>
        log.debug("aggregate '{}' received cmd: {}", identifier, cmd)
        val eventualTimeout =
          after(duration = commandTimeout, using = context.system.scheduler) {
            Future.failed(new TimeoutException(s"Async command took more than $commandTimeout to complete: $cmd"))
          }
        val eventualEvents = interpreter.applyCommand(aggregateState, cmd)
        val eventWithTimeout = Future firstCompletedOf Seq(eventualEvents, eventualTimeout)
        val origSender = sender()
        eventWithTimeout map {
          case (events, nextState) => Successful(events, nextState, origSender)
        } recover {
          case NonFatal(cause) => FailedCommand(cmd, cause, origSender)
        } pipeTo self
        changeState(Busy)
    }
```

As taken from the library [`fun.CQRS`](https://github.com/strongtyped/fun-cqrs) discussed in the talk.
