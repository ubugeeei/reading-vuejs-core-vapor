# Scheduler

So far, the term "scheduler" has come up several times.  
In this page, we will take a closer look at that scheduler.

## What is a Scheduler

A scheduler is something that schedules and executes tasks.\
Sometimes it's about adjusting execution timing, sometimes it's about queuing.

Operating systems also have schedulers that schedule processes.

Vue.js also has mechanisms to schedule various actions.\
This concept originates not only from vuejs/core-vapor (runtime-vapor) but also from vuejs/core (runtime-core).\
For example, the well-known `nextTick` is an API of this scheduler.

https://vuejs.org/api/general.html#nexttick

Additionally, the `flush` option that can be set as an option in watchers like `watch` and `watchEffect` is also related to scheduling execution.

https://vuejs.org/api/reactivity-core.html#watch

https://github.com/vuejs/core/blob/a177092754642af2f98c33a4feffe8f198c3c950/packages/runtime-core/src/apiWatch.ts#L44-L46

## Overview of the Scheduler API

Before looking into detailed implementations, let's see how the scheduler is actually used.\
This is about how Vue.js internally uses it, not an API that Vue.js users directly use.

The implementation of the scheduler is in [packages/runtime-vapor/src/scheduler.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts).

First, the basic structure includes a `queue` and `job`.\
And there are two types of queues.\
`queue` and `pendingPostFlushCbs`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L22-L23

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L28-L30

Here, it manages the queued jobs and the current execution index.

`job` is the actual execution target.\
It's a function with `id` and `flag` (to be discussed later) attached.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/scheduler.ts#L23-L30

Next, about the functions that manipulate these.

There are `queueJob` which adds a `job` to the `queue`, `queueFlush` and `flushJobs` which execute the `jobs` in the `queue`.\
(`flushJobs` is called from `queueFlush`.)\
Then, in `flushJobs`, after executing the jobs in the queue, it also executes the jobs in `pendingPostFlushCbs`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L35

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L74

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L110

Also, there are `queuePostFlushCb` which adds a `job` to `flushPostFlushCbs`, and `flushPostFlushCbs` which executes the `jobs` in `pendingPostFlushCbs`.\
(as mentioned before, `flushPostFlushCbs` is also called from `flushJobs`.)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L57

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L81

And the execution of these jobs (flushJobs) is wrapped in a Promise (like `Promise.resolve().then(flushJobs)`), and the current job execution (Promise) is managed as `currentFlushPromise`.\
Then, task scheduling is done by connecting to the `then` of this `currentFlushPromise`.

And the well-known `nextTick` is just a function that registers a callback to the `then` of this `currentFlushPromise`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L144-L150

## Where is it Used?

Let's see where the implementation that manipulates the queue is.

### queueJob

Currently, in Vapor, it's used in three places.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L161

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directivesChildFragment.ts#L65-L68

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L41

What's common among these is that they are set in `effect.scheduler`.\
Let's read a bit ahead about what these are.

### queueFlush

Contrary to `queueJob`, `queueFlush` is only handled internally in the scheduler implementation.\
When these are executed depends on when we look at the implementation details.

### queuePostFlushCb

This is used in several places.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L165-L171

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/componentLifecycle.ts#L16-L29

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L251-L262

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directivesChildFragment.ts#L137-L154

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L74-L85

What is common among the above five is that they are some kind of lifecycle hooks.\
It seems that they add the execution of the callback functions registered in those hooks to `pendingPostFlushCbs`.

Lifecycle hooks like `updated`, `mounted`, `unmounted`, etc., might not have the DOM updated yet if executed immediately.\
By controlling the execution timing via the scheduler and Promises (event loop), it seems to manage the execution timing.\
We will read more about the implementation details together later.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L29-L40

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/templateRef.ts#L117-L132

As for the above two, since `event` and `templateRef` haven't been introduced yet, let's skip them for now.

### flushPostFlushCbs

This mainly appears in `apiRender.ts`. It also appeared in the t runtime explanation of this book.

It seems to flush after mounting the component.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L106-L112

Similarly, during unmounting.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L155-L173

## Implementation Details

Now, let's look at the implementations of these four functions.

### queueJob

First, `queueJob`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L35-L55

It checks the `flags` of the `job` passed as an argument to determine whether it has already been added to the queue.\  
If it has, it ignores it.

Then, if the `job` does not have an `id` set, it adds it to the queue unconditionally.\  
Because it's impossible to control deduplication and the like (since it can't be identified).

After that, if `flags` are not `PRE`, it adds it to the end; otherwise, it inserts it at the appropriate index.\  
That index is found based on `id` using `findInsertionIndex`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L152-L176

Since the queue is specified to maintain the order of increasing `id`, it uses binary search to quickly determine the position.

Once that's done, it sets `flags` to `QUEUED` and finishes.\  
The key point here is that it finally calls `queueFlush()`.

Next, let's look at `queueFlush`.

### queueFlush -> flushJobs

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L74-L79

`queueFlush` simply calls `resolvedPromise.then(flushJobs)`.\  
At this point, `flushJobs` is wrapped with `resolvedPromise.then`, and that Promise is set to `currentFlushPromise`.

Let's take a look at `flushJobs`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L110-L142

First, the queue is sorted by `id`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L121

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L181-L190

Then, they are executed in order.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L123-L127

In the `finally` block, it also executes `flushPostFlushCbs`, and finally, it checks `queue` and `pendingPostFlushCbs` again; if there are still jobs remaining, it recursively calls `flushJobs` again.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L128-L140

### queuePostFlushCb

Similarly, the target is `pendingPostFlushCbs`, and the basic flow is the same as `queueJob`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L57-L72

For flushing after queuing, just remember it's `queueFlush`. (`queue` is also consumed)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L71

### flushPostFlushCbs

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L81-L107

Also, it removes duplicates using `new Set`, sorts by `id`, and executes `pendingPostFlushCbs` in order.

## ReactiveEffect and Scheduler

Now, there is one more aspect of the scheduler that we need to understand.

> What is common among them is that they are set in `effect.scheduler`.

This is the part.

The `scheduler` option that the effect has is used to wrap the processing in the form of `queueJob`.\  
So, what exactly is this `effect.scheduler`?

`effect` is an instance of `ReactiveEffect`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L113

It receives the function (fn) that you want to execute and creates an instance.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L142

And there are two methods to execute a `ReactiveEffect`:\
`run` and `trigger`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L182

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L226

The `run` method can be executed at any desired time, such as:

```ts
const effect = new ReactiveEffect(() => console.log("effect"));
effect.run();
```

It is also executed via this `run` during the initial execution of `renderEffect`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L37-L50

On the other hand, `trigger` is primarily used when reactivity is established.\
For example, when the `set` method of a ref object is called.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/ref.ts#L134

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/ref.ts#L153

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/dep.ts#L118-L122

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/dep.ts#L148-L150

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L173

When looking at the `trigger` function,

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L226-L234

if it has a `scheduler`, it is given priority to execute.

This mechanism ensures that unnecessary executions do not occur when reactive effects are triggered based on certain dependencies.\  
The `scheduler` property allows you to appropriately set up the processing to be queued by the scheduler, optimizing the execution of effects.

For example, let's look at the implementation of `renderEffect`.\  
It sets `() => queueJob(job)` as the `scheduler`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L37-L41

And suppose `renderEffect` is called as follows.

```ts
const t0 = template("<p></p>");

const n0 = t0();
const count = ref(0);
const effect = () => setText(n0, count.value);
renderEffect(effect);
```

This way, the `effect` (a job that wraps `effect`) is tracked by `count`, and when `count` changes, it triggers that job.\  
When `trigger` is called, the `scheduler` property set internally is executed, but in this case, it is set to "add the job to the queue" rather than "execute the job", so it is not executed immediately but passed to the scheduler.

Now, let's consider such a trigger.

```ts
const count = ref(0);
const effect = () => setText(n0, count.value);
renderEffect(effect);

count.value = 1; // enqueue job
count.value = 2; // enqueue job
```

Doing so will execute `() => queueJob(job)` twice.\  
And recalling the implementation of `queueJob`,

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L37

if the job is already added, it will be ignored.\  
Since this function executes `queueFlush` at the end, you might think the queue would be emptied each time, but actually, because it is connected via a Promise, the `flush` has not yet occurred at this point, and the `job` remains in the queue.

This achieves deduplication of jobs mediated by the event loop, preventing unnecessary executions.\  
In fact, consider the following:

```ts
count.value = 1;
count.value = 2;
```

Even though written like this, visually, only the second

```ts
setText(n0, 2);
```

should be executed, which is fine.

With this, you should have a general understanding of the scheduler.\  
To control the execution of unnecessary effects, Promises and the `queue` are utilized, and to properly execute after waiting for updates to the screen and other actions through lifecycle hooks, a separate queue called `pendingPostFlushCbs` is prepared to control the execution timing.
