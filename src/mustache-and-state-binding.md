# Mustache and State Binding

## Target Component for This Section

Now, let's continue reading through various components in the same manner.

Next, take a look at the following component:

```vue
<script setup>
import { ref } from "vue";
const count = ref(0);
</script>

<template>
  <p>{{ count }}</p>
</template>
```

In the above code, `count` doesn't change, so it's not a very practical example, but we have defined a state and bound it using mustache.

## Compilation Result

First, let's see what the compilation result of this SFC looks like.

```js
import { ref } from "vue";

const _sfc_main = {
  vapor: true,
  __name: "App",
  setup(__props, { expose: __expose }) {
    __expose();

    const count = ref(0);

    const __returned__ = { count, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};

import {
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}

import _export_sfc from "/@id/__x00__plugin-vue:export-helper";
export default /*#__PURE__*/ _export_sfc(_sfc_main, [
  ["render", _sfc_render],
  ["vapor", true],
  ["__file", "/path/to/core-vapor/playground/src/App.vue"],
]);
```

The structure has become slightly more complex than the previous component, but the basic structure remains the same.

```vue
<script setup>
import { ref } from "vue";
const count = ref(0);
</script>
```

is compiled into

```js
import { ref } from "vue";

const _sfc_main = {
  vapor: true,
  __name: "App",
  setup(__props, { expose: __expose }) {
    __expose();

    const count = ref(0);

    const __returned__ = { count, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};
```

And the template part

```vue
<template>
  <p>{{ count }}</p>
</template>
```

is compiled into

```js
import {
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}
```

As for the script part, this is not an implementation of `vuejs/core-vapor`, but rather the existing implementation of `compiler-sfc`. For those who have been using Vue.js since before the introduction of `<script setup>`, this might feel somewhat familiar.

It's implemented with a function called `compileScript`, but we'll skip that part for now.

What we want to focus on this time is the template part.

## Understanding the Overview of the Output Code

Let's focus on understanding the following code:

```js
import {
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}
```

<div v-pre>

First, the part written as `<p>{{ count }}</p>` in the template has been converted to `<p></p>`. The content `{{ count }}` is set to be updated whenever the value of `count` changes, through `_renderEffect` and `_setText`.

</div>

`setText` is, as the name suggests, a function that sets text to a specified element.\
So, what is `renderEffect`?

In short, it’s a "watchEffect with an update hook."

Vue.js has an API called `watchEffect`.

https://vuejs.org/api/reactivity-core.html#watcheffect

This function executes the callback function passed as an argument the first time and then tracks it.\
In other words, after the initial execution, the callback function will be re-executed whenever the reactive variable, in this case, `_ctx.count`, is updated.

Conceptually, it is similar to:

```js
watch(
  () => ctx.count,
  () => setText(n0, _ctx.count),
  { immediate: true }
);
```

With this, `setText` will be executed each time `count` is updated, and the text of `n0` will be updated (the screen will be refreshed).

Another important point of `renderEffect` is:

> with update hooks execution

Vue.js provides lifecycle hooks `beforeUpdate` and `updated` that are executed before and after the screen is updated.\
A normal watch does not execute these hooks when the callback is executed.\
(This is natural because it is not meant to handle screen updates.)

However, the effect in this case is undoubtedly meant to update the screen.\
`renderEffect` is designed to execute the `beforeUpdate` and `updated` hooks before and after the screen is updated.\
It is a function to create an effect for rendering the screen.

Conversely, the compiler wraps all effects that cause screen updates with `renderEffect`.

## Reading the Compiler's Implementation

First, let's output the AST of the template.

```json
{
  "type": "Root",
  "source": "\n  <p>{{ count }}</p>\n",
  "children": [
    {
      "type": "Element",
      "tag": "p",
      "ns": 0,
      "tagType": 0,
      "props": [],
      "children": [
        {
          "type": "Interpolation",
          "content": {
            "type": "SimpleExpression",
            "content": "count",
            "isStatic": false,
            "constType": 0,
            "ast": null
          }
        }
      ]
    }
  ],
  "helpers": {},
  "components": [],
  "directives": [],
  "hoists": [],
  "imports": [],
  "cached": [],
  "temps": 0
}
```

By now, you should be able to understand the general nodes of the Template AST.\
And since you've seen the implementation of the parser, you should already know how to obtain this object.

## Reading the transformer

Next, let's look at the implementation of how to transform this.\
Probably, this kind of flow (skim through AST, Parse and thoroughly read the transformer) will become more common from now on.

As usual, when entering `transform` ->`transformNode`, the NodeTransformer is executed.\
It enters `transformElement` (onExit) -> `transformChildren`, and then comes into `transformText`.

Up to here it's as usual, and from here is the main point this time.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L22

This time, when passing this check,

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L89-L96

Because it includes `Interpolation`, it enters the following branch.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L29-L37

Let's look at `processTextLikeContainer`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L63-L78

Apparently, it calls a function called `registerEffect` here.\
And it correctly sets `type: IRNodeTypes.SET_TEXT`.

It also retrieves the literals, and if none of them are null, it concatenates them as is and adds them to `context.childrenTemplate`, then finishes.\
(In other words, it falls into the `template` argument)

Conversely, if not, `context.childrenTemplate` remains empty, so this part does not get passed to the `template` argument.\
(In this case, the final template becomes `"<p></p>"`)

Otherwise, it is `registerEffect`.\
It executes `context.reference`, marks keeping this Node in a variable, and obtains the id.

## registerEffect

Let's take a look at the contents of the function called `registerEffect`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L137-L140

It takes `expressions` and `operations` as arguments.

`expression` is a `SimpleExpression` of the AST. (e.g. `count`, `obj.prop`, etc.)

`operations` is a new concept.\
This is a kind of `IR`, called `OperationNode`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L211-L228

If you look at this definition, you can probably imagine, but it's a Node that represents an "operation".\
For example, `SetTextIRNode` is an operation to "set text".\
There are also `SetEventIRNode` to set events and `CreateComponentIRNode` to create components.

This time, since `SetTextIRNode` is used, let's take a look.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L108-L112

`SetTextIRNode` has the element's id (number) and values (SimpleExpression[]).

For example, if the id is 0 and the value is a SimpleExpression representing `count`,

```ts
setText(n0, count);
```

it represents the `IR` of code like this.

Returning to the continuation of `registerEffect`,

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L151-L154

It pushes the incoming `expressions` and `operations` to `block.effect`.

`block.effect` is

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L51

With this, the generation of the `IR` for the master stack is roughly complete.\
All that's left is to perform codegen based on this.

## Reading Codegen

Well, as expected, there's nothing particularly difficult.\
It just branches and processes the `effects` held by the `block` based on the `type`.

You can probably read it without any explanations.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L36-L41

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L56

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L75-L81

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L86-L107

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L42-L43

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/text.ts#L12-L26

And just like that, completely mastering the compiler!

## Reading the Runtime

Now, let's read the runtime (actual behavior) part of the compiled result:

```js
import {
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}
```

In the application entry, a component instance is created, and the component's `render` function is called to place the resulting node into the container, which is the same as before.\
Let's see what actually happens when `render` is executed.

First, `setText`.\
These operations are mostly implemented in [packages/runtime-vapor/src/dom](https://github.com/vuejs/vue-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom).

The implementation of `setText` is as follows:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/prop.ts#L188-L194

It really does only very simple things. It's just a DOM operation. It `joins` the `values` and assigns them to the `textContent` of `el`.

Next, let's look at the implementation of `renderEffect` to conclude this page.\
In other words, `renderEffect` is a "watchEffect with an update hook execution".

The implementation is in [packages/runtime-vapor/src/renderEffect.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts).

While setting the current instance and effectScope, it wraps the callback,

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L19-L35

and generates a `ReactiveEffect`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L37-L39

For `effect.scheduler` (a behavior called via triggers rather than through `effect.run`), it sets a function called `job` (discussed later).

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L41

The following is the initial execution.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L50

This is the `job` part.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L52

Before executing the `effect`, it runs the lifecycle hook (beforeUpdate).

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L62-L70

Then, it executes the `effect`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L72

Finally, it runs the lifecycle hook (updated).\
In reality, it just queues it in the scheduler.\
(The scheduler appropriately handles deduplication and executes it at the proper time.)

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L74-L85

Since the implementation around the scheduler is starting to come up frequently, in the next page, let's take a look at the implementation of the scheduler!
