---
title: 'William Kennedy - Ultimate Go Training - Workshop@MTC-KBH - notes day 1'
date: '2019-02-13'
---
# [Workshop Link](https://github.com/ardanlabs/gotraining)

- external latency will give you problems
- microservices is a people problem, not a technical problem
- garbage collection will give you a problem in performance but you need it
- internal latency due to syncronization
- how you acess data will affect your performance
- logs will give you observability

*DO NOT USE A DEBUGGER, USE OBSERVABILITY.*
Develop a mental mode of your code, don't use a debugger, use a logs.

The go runtime is not a VM, it has many stuff (like gc) but it's not a VM.

- first priority integrity
- second priority is to avoid to consume resources

When you mutate memory => when bugs happen.

Go syntax comes from Pascal syntax.

Will work with the value of the data and with the value of the address of that data.
Data is both value and address.

You have both value semantics and pointer semantics.
Value semantics means that every piece of code has is own copy, data locality comes from value semantics.

With value semantics we can isolate mutation.

Value semantics will come at a cost, it will be inefficient.
With pointer semantics you have side effects but it's more efficient.

Go always pass by copy, but you can pass the value of the address by copy.

Factory functions to create structs

## V1

```golang
func createUserV1() user { // We're using value semantic
    u := user { name: "bill", email: "something@mail.com"}
    return u
}
```

## V2

```golang
func createUserV1() *user { // We're using pointer semantic
    u := user { name: "bill", email: "something@mail.com"}
    println("V2", &u)
    return &u
}
```

Construction on line 47, you don't know where the construction is.
On line 48 we are sharing down on the call stack so it's safe.
What happens when we go up? (line 49)
On line 49 we are putting the variable on the heap because it's pointer semantics.
We should avoid the non productive allocations.
Tthe garbage collection will get involved.

Don't use empty literal constructions, use `var` declaration for zero values struct construction.

Don't do

```golang
func a() *user {
    a := &model{}
    return a
}
```

at construction time. It hides stuff.

To understand escape analysis [click here](http://www.agardner.me/golang/garbage/collection/gc/escape/analysis/2015/10/18/go-escape-analysis.html)

Go doesn't have optimization for recurion nor tail recursion.

We need to control the gap for garbage collection. We want to use small heap to consume less resources.
Don't make the gap larger, reduce the memory footprint (because you can reduce it usually).

The GC uses go routines, so it needs CPU capacity that won't be used by your software.
The GC needs to use stop the world time to clean stuff because you can't write while cleaning.

The go routine needs to go to a safe point before starting a stop the world. (it happens when the gorouting makes a function call)

You must make user that your code makes function call in a reasonable amount of time.

The goal is to increase the throughtput in between garbage collection.
Another way of doing it is to reduce the pointer semantics.

## How do you access data

When you run a benchmark, you machine must be idle, if it's not idle you will have the wrong output. Needs to be idle.
Don't run benchmark on cloud computers, too much noise.
Find a value B.N (banchmark value) so that the cycle will be run for the entire benchmark cycle.
The hardware also uses value semantics. (L1, L2, L3)

Unless there is no good reason, always use slice of values to give memory continuity.
We always use use slices and array and there is no linked list because slice and array are performant.

You can use whatever structure you want, but when you need optmization, you can reduce it to an array or slice.

You need to maximize your cache usage (L1, L2).

Go does not have a virtual machine, hardware is our platform.

Watch the first three video on CPU Caches/Memory from [here](https://github.com/ardanlabs/gotraining)

```golang
for i, fruit := range fruits {
    fmt.Println(i, fruit)
}
```

This is the value semantic version of a for loop.
It means that fruit points to an element of a copy of fruits.

*Guideline #1*: Use value semantics for built-in types when you're passing around parameters unless you need the idea of null then use a pointer.

We are going to focus on consistency, easy to read. We don't have any issue ad the moment with performance until the tools say we have a performance problem.

*Guideline #2*: When you move a reference type around your program, you have to use the Value semantics. (struct, interface, arrays and slices).

```golang
var data []string // slice
var data [6]string // array
```

This is different:

```golang
var data []string // nil slice
data := []string{} // empty slice
var es struct{} // empty struct, if you create 100 of those, they will share the same address, no memory consumption
```

In go we have a separation of state and behavior. That data has a behavior it's an exception (I don't really agree).
Methods can have pointer and value receiver.

```golang
func (u user) notify() { // value receiver
    fmt.Prinf("send %s %s", u.name, u.email)
}
func (u *user) changeEmail() { // pointer receiver
    u.email = "ciao"
}
```

For factory function the return is the struct itself.
The Time struct use always value semantics, the only pointer semantic is in Unmarshall, Decode methods.
If you choose Value semantics, always use Value semantics for receivers of methods (besides unmarshall and decode).

Polymorphism means that a piece of code changes its behavior depending on the concrete data it operates on.
Everything is data driven.

An interface can only declare a method set of behavior. It's abstract.
There are some requirements for it:

- if we work with value of type T, only method implemented with value semantics
- if we work with value of type *T, method implemented with value and pointer semantics

Check on [language mechanics](https://github.com/ardanlabs/gotraining/blob/master/topics/courses/go/language/README.md) to see the rest on this topic.