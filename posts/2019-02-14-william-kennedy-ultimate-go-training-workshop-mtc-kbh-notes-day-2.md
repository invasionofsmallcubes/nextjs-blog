---
title: 'William Kennedy - Ultimate Go Training - Workshop@MTC-KBH - Notes Day 2'
date: '2019-02-14'
---

Don't use interfaces in the first place, discover them while refactoring.
Don't repeat yourself sometimes it's more harmful than anything.

Write the first thing that it's easy, don't worry about optimization now.

`func (*Xenia) Pull() (*Data, error)` 
this will put data on the heap

`func (*Xenia) Pull(d *Data) error` this will not put data in heap, but will keep in the stack.

Now I finally understood why marshall and decode have the return element in the argument.

After we see that the system is stable, when we need to add a new behavior, then we introduce the interface.

Don't define alias as `type Handle int`. If you have to explaining it using `int` then it's a real use type.
`type Duration int64` makes sense because you can explain like **that represents a nanosecond of time**

For the rest check [here](https://github.com/ardanlabs/gotraining/blob/master/topics/courses/go/design/README.md)

You need to understand your workload to understand before starting writing for concurrency. You have CPU bound workload and IO bound workload.

CPU bound workload is when you have an algorithm that doesn't move your thread from running to waiting state, only an external event could do that (OS scheduler)

IO bound workload is a workload that will move from running to waiting, you run operation on OS, open a file for example, use mutexes.

CPU bound workload is the more efficient work you can do.

Never use more or less threads than the number of hardware threads you have.

Every OS has a thread pooling technology. You put the request into the pools and try to do the work with the less number of threads possible.

What causes a scheduling decision:

- go function
- GC
- syscall (async/sync)
    -- networking in go is really fast

A runtime will use work stealing algorithms.

Channels are slow, they're filled with latency costs. We need to use them with careful attention. Avoid the use of WaitGroups for performance reasons but you should use them to track the work that has been done.

To find race conditions, you can run `go build -race` or you can use the also go test `go test -race -cpu 24`, with extra threads.

For the rest check [here](https://github.com/ardanlabs/gotraining/blob/master/topics/courses/go/concurrency/README.md)