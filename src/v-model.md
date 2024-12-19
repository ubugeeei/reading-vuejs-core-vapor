# The v-model Directive

Consider a component like the following.

```vue
<script setup>
import { ref } from "vue";
const text = ref("");
</script>

<template>
  <input v-model="text" />
</template>
```

## Compilation Result and Overview

The compilation result is as follows.

```js
const _sfc_main = {
  vapor: true,
  __name: "App",
  setup(__props, { expose: __expose }) {
    __expose();

    const text = ref("");

    const __returned__ = { text, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};

import {
  vModelText as _vModelText,
  withDirectives as _withDirectives,
  delegate as _delegate,
  template as _template,
} from "vue/vapor";

const t0 = _template("<input>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _withDirectives(n0, [[_vModelText, () => _ctx.text]]);
  _delegate(n0, "update:modelValue", () => ($event) => (_ctx.text = $event));
  return n0;
}
```

What stands out the most is

```js
_withDirectives(n0, [[_vModelText, () => _ctx.text]]);
_delegate(n0, "update:modelValue", () => ($event) => (_ctx.text = $event));
```

Since `delegate` appears again, it somewhat indicates that this is for registering event handlers, but mysterious elements like `withDirectives` and `_vModelText` appear.\
While the details will be read later, let's first read the compiler.

## Reading the Compiler

Follow the path: `transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVModel`.

[packages/compiler-vapor/src/transforms/vModel.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts)
First, `bindingMetadata` is extracted from `context`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L34

This is collected by `compiler-sfc` and contains metadata about variables defined in the SFC, such as whether a `let` variable is defined in `setup`, or if it's a prop, data, etc.\
Specifically, it is enumerated as follows.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/options.ts#L109-L153

How it is collected will be traced elsewhere.

If the `bindingType` of `exp` is props, an error is thrown. Very considerate.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L37-L45

Then, the following branching is the main topic.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L84

First, if the tag is one of `input`, `textarea`, or `select`.\
In this case, it's `input`, so it matches here.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L84-L87

For `input`, it reads the `type` attribute and determines the `runtimeDirective`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L90-L118

The previously outputted `vModelText` seems to be the initial value of this variable.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L83

At this point, it registers an operation called `SET_MODEL_VALUE`, and

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L142-L148

uses the previously calculated `runtimeDirective` to register `withDirectives`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L151-L157

It's surprisingly simple.\
As for Codegen, it's a breeze once you reach this point.

It's the usual flow. No particular explanation needed.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L52-L53

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/modelValue.ts#L8-L38

The `withDirectives` part has a slightly different Codegen flow.\
It follows `genBlockContent` -> `genChildren` -> `genDirectivesForElement` -> `genWithDirective`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L36-L41

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L51-L53

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L18-L23

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L31

or

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L31

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/directive.ts#L23-L29

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/directive.ts#L31-L34

is the path.

## Reading the Runtime

While the part `_delegate(n0, "update:modelValue", () => ($event) => (_ctx.text = $event));` is fine, the issue lies with `withDirectives` and `_vModelText`.

### withDirectives

Let's read `withDirectives`.
The implementation is in [packages/runtime-vapor/src/directives.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts).

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L93-L96

`withDirectives` receives either `node` or `component`, and `directives`.

#### DirectiveArguments

The definition of `DirectiveArguments` is as follows.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L81-L91

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L71-L73

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L65-L69

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L58-L63

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L41-L57

It's somewhat complicated, but simply put, it defines the behavior for each lifecycle.\
(This seems to be the actual behavior of the directive.)

#### Inside withDirectives

First, there is a concept called `DirectiveBinding`.

This is an object that bundles necessary information, such as old and new values, modifiers, the directive itself (`ObjectDirective`), and in the case of a component, the instance.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L29-L37

Then, this function `withDirectives`, as the name suggests, can apply multiple directives.\
It processes each directive in the array of directives received as arguments.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L124

Let's look at what is done in this for loop.

First, extract various information from the definition.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L125

Also, normalize.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L127-L132

Define the base binding.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L134-L141

Wrap `source` with `ReactiveEffect`, and set up the `scheduler` of that `effect` to include update triggers.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L143-L164

The update trigger is simply a trigger that executes the lifecycle's `beforeUpdate` and `updated`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L228-L266

Finally, execute the created hook.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L168

### vModelText

Now that we've read this far, next let's read the implementation of the specific directive.\
The `runtimeDirective` related to v-model is implemented in [packages/runtime-vapor/src/directives/vModel.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts).

This time, `vModelText` is as follows.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L44-L48

Here, the behavior for each lifecycle related to this directive, such as `beforeMount`, `mounted`, `beforeUpdate`, etc., are defined.
Let's look at them one by one.

#### beforeMount

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L49

Registers the event handler.

Performs trimming of values and casts to numbers while updating the values.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L56-L66

Value updates use the assigner obtained from delegate event handlers.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L56-L66

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L21-L25

:::info Tips
Although the official documentation mentions that v-model handles composing such as IME, this is exactly this process.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L56-L57

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L73-L74

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L27-L37
:::

#### mounted

At mount time, it simply sets the initial value.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L83-L85

#### beforeUpdate

Handles composing, such as IME, and skips unnecessary updates up to update.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L86-L111

---

With that, the operation of `v-model` should be understood.\
There are various other directive definitions besides `vModelText`, but you should be able to proceed in the same way based on this.

And, since new concepts such as `runtimeDirective` and `withDirectives` have appeared this time, it became a bit lengthy, but you should be able to continue reading other directives based on this. (Your speed should also increase.)\
Let's keep reading in this manner.
