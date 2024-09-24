# v-on Directive

Now, let's take a look at the `v-on` directive.\
There are two types of `v-on`: one for native elements and one for components. Since I don't know how to handle components yet, I will explain the one for native elements here.\
(By the way, when it comes to components, it's mostly props, so there's not much to explain.)

Let's consider a component like the following.

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);
function increment() {
  count.value++;
}
</script>

<template>
  <button type="button" @click="increment">{{ count }}</button>
</template>
```

This is a common counter component.

## Compilation Result

The compilation result looks like the following.

```js
const _sfc_main = {
vapor: true,
**name: "App",
setup(**props, { expose: **expose }) {
**expose();

    const count = ref(0);
    function increment() {
      count.value++;
    }

    const __returned__ = { count, increment, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;

},
};

import {
delegate as _delegate,
renderEffect as _renderEffect,
setText as _setText,
delegateEvents as _delegateEvents,
template as _template,
} from "vue/vapor";

const t0 = _template('<button type="button"></button>');

_delegateEvents("click");

function _sfc_render(_ctx) {
const n0 = t0();
_delegate(n0, "click", () => _ctx.increment);
_renderEffect(() => _setText(n0, _ctx.count));
return n0;
}
```

As usual, the script part is not significant, so let's focus on the following part.

```js
import {
  delegate as _delegate,
  renderEffect as _renderEffect,
  setText as _setText,
  delegateEvents as _delegateEvents,
  template as _template,
} from "vue/vapor";

const t0 = _template('<button type="button"></button>');

_delegateEvents("click");

function _sfc_render(_ctx) {
  const n0 = t0();
  _delegate(n0, "click", () => _ctx.increment);
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}
```

## Understanding the Overview

The generation of the template and the `renderEffect` ~ `setText` are as usual.\
This time, the main parts are

```js
_delegateEvents("click");
```

and

```js
_delegate(n0, "click", () => _ctx.increment);
```

As expected, the latter probably adds a `click` event to `n0`.\
However, I don't understand what "delegate" means or what the former `_delegateEvents` is doing.

For now, let's leave this as a mystery and look at the compiler's implementation.\
We will understand the mystery as we proceed to read the runtime.

## Reading the Compiler

### IR

As usual, let's take a peek at the `IR`.\
There is something suspicious called `SET_EVENT`, but I don't see anything else.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L22

Let's have a look.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L115-L132

It seems this Node has a `delegate` flag.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L129

Then, let's look for the transformer that generates this Node.\
Found it. It is [packages/compiler-vapor/src/transforms/vOn.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts) .

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L73-L86

### DirectiveTransform

Since it's the first time DirectiveTransform appears, let's see how it is called.\
DirectiveTransform is called from `transformElement`.\
Specifically, it is called during the processing of element attributes.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L42

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L56-L60

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L188-L192

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L255

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L284-L288

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L301-L304

In this case, it gets the v-on transformer from the name like `on`, and calls `transformVOn`.\
Then, in `transformVOn`, `context.registerEffect` is called at the end, registering the effect.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L88

### transformVOn

Now, let's take a look at `transformVOn`.

`dir` is the AST of the directive.
This is implemented in `runtime-core` and is created at the parse stage.

From here, we extract `arg`, `expr`, `modifiers`, and so on.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L21

To explain briefly, in `v-on:click.stop="handler"`, `click` corresponds to `arg`, `stop` corresponds to `modifiers`, and `handler` corresponds to `expr`.

First, we resolve and organize `modifiers` by type.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L32-L38

`resolveModifiers` is a function implemented in `compiler-dom` that categorizes modifiers.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-dom/src/transforms/vOn.ts#L35-L44

Next, we determine whether to enable `delegate`. (For now, let's leave aside what `delegate` is.)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L42-L43

It is enabled when all of the following conditions are met:

- `arg` is static\
  This is when it is not something like `v-on[eventName]="handler"`.
- `modifiers` are empty.
- It is a delegate target\
  This is a determination of whether it is an event defined here.
  https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L13-L18

After that, based on the information obtained so far, registering the effect with `registerEffect` completes the process.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L73-L88

## Reading Codegen

Let's focus mainly on how the `delegate` flag affects things, and skim through the rest.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L44-L45

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/event.ts#L17-L42

This flow is now familiar, and there should be no difficult parts.\
What I particularly want to highlight is here.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/event.ts#L36

When the `delegate` in `IR` is enabled, it generates a `delegate` helper; otherwise, it generates an `on` helper.\
In other words, when reading the runtime next, comparing these two should help you grasp the role of `delegate`.

You can also see that events are registered in `context.delegates` just before this.\
You can also understand that this is probably the hoisted `_delegateEvents("click");` part.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/event.ts#L28-L31

## Reading the Runtime

Now, there are three functions I want to read.\
They are `delegateEvents`, `delegate`, and `on`.

First, let's look at `delegateEvents` in the order of execution.

### delegateEvents

The implementation is as follows.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L83-L96

As you can see from the comments, this concept seems to be borrowed from Solid.\
Looking at Solid's documentation, there is an explanation of delegate.

https://docs.solidjs.com/concepts/components/event-handlers

> Solid provides two ways to add event listeners to the browser:
>
> - `on:__`: adds an event listener to the element. This is also known as a native event.
>
> - `on__`: adds an event listener to the document and dispatches it to the element. This can be referred to as a delegated event.
>
> Delegated events flow through the component tree, and save some resources by performing better on commonly used events. Native events, however, flow through the DOM tree, and provide more control over the behavior of the event.

`delegateEvents` listens to `delegatedEventHandler` on the document with the passed events.

Let's look at `delegatedEventHandler`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L98-L128

`e.composedPath` is a method that returns the event's path (EventTarget) as an array.

https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath

```js
// Example

e.composedPath(); // [button, div, body, html, document]
```

First, using a function called `getMetadata`, it retrieves metadata from `node` and obtains handlers from the event information there.\

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L114

Then, it executes all those handlers.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L115-L118

After that, it propagates this flow by traversing up through the host and parent.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L123-L126

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L113

Let's also read `delegate` in this flow.

### delegate

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L58-L67

`delegate` creates a handler and registers it in the metadata with the delegate flag set.

`recordEventMetadata` is implemented in another file, [packages/runtime-vapor/src/componentMetadata.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/componentMetadata.ts).

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/componentMetadata.ts#L21-L26

As you can see from this, metadata is directly registered to the element in a property called `$$metadata`. It has the following type.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/componentMetadata.ts#L5-L13

It seems to have event handlers and Props.

In other words, instead of directly registering event handlers here, it only holds the handlers, and actually, when the handler registered in `document` by `delegateEvents` is called, it refers to this metadata to execute the handlers.

### on

Now, when the `delegate` flag in `IR` is not set, `on` is called.

This is very simple, as it calls `addEventListener` with `queuePostFlushCb`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L29-L51

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L14-L22

Cleanup processing is also implemented.

## delegate vs on

Now, we understand the differences in each implementation, but why are they used differently?\
As can be seen from Solid's documentation, in the case of `delegate`, it seems to save resources.

To explain a bit more specifically, the act of "attaching events to elements" incurs costs (time and memory).\
While `on` attaches events to each element individually, `delegate` attaches events only to the document and, when an event occurs, determines which element the event originated from and triggers the event on the corresponding element.\
This seems to contribute to performance. (I haven't benchmarked it myself, so I don't know how effective it is in Vapor. If you know, please let me know.)
