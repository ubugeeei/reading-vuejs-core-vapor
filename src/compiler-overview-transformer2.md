# Overview of Transformer Part 2

I split it because it got a bit long, but here's the continuation.\
Although it's called an overview, before I realized it, I was reading the details of the specific implementation, but well, perhaps it's a good natural introduction (laughs).

Up to the previous page, we looked at the implementation that generates the template string passed as an argument to the `template` function.\
Here, we'll look at index management of `Block` and so on.

## registerTemplate

There is a function called `registerTemplate` in `TransformContext`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L131-L135

This `registerTemplate` calls a function called `pushTemplate`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L123-L130

Templates (strings) are registered into `this.ir.template` (array).

`this.ir` is a `RootIRNode`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L87-L88

That is, here.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L56-L60

And, this `registerTemplate` is called in three places.

1. At the end of `transformNode` (only when root)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L264-L266

2. After processing children in `transformChildren` (only when it's a Fragment)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L22-L24

3. When `context.enterBlock` is called (`onExit`)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L104-L113

`context.enterBlock` is a function called when entering a `Block` in `transformVFor` or `transformVIf`.\
We'll look at this when we see the implementation of compiling `v-for` and `v-if`, but for now, it's fine to just grasp 1 and 2.

<div v-pre>

Regarding 1, there's nothing special, I think.\
In the small component we're reading now, the template is registered here.\
In other words, at this point, `this.ir.template` is in the state of `["<p>Hello, Vapor!</p>"]`.

</div>

If we have this, we know the index of the template, so,

```js
const t0 = template("<p>Hello, Vapor!</p>");
```

It seems we can generate such code. (We'll actually see this again during codegen.)

In the case of 2, the Fragment, it's when we write a template like:

```vue
<template>
  <p>Hello, Vapor 1</p>
  <p>Hello, Vapor 2</p>
  <p>Hello, Vapor 3</p>
</template>
```

In this case, three templates are registered at timing 2.

```js
// this.ir.template
["<p>Hello, Vapor 1</p>", "<p>Hello, Vapor 2</p>", "<p>Hello, Vapor 3</p>"];

const t0 = template("<p>Hello, Vapor 1</p>");
const t1 = template("<p>Hello, Vapor 2</p>");
const t2 = template("<p>Hello, Vapor 3</p>");
```

## Return Value of the render Function

Returning to the discussion about

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

Let's look back again at the `IR` obtained from this.\
(Unnecessary parts are omitted)

```json
{
  "type": "RootIRNode",
  "template": ["<p>Hello, Vapor!</p>"],
  "block": {
    "type": "BlockIRNode",
    "returns": [0]
  }
}
```

Looking closely, there's something rather suspicious called `"returns": [0]`.\
From this information, we can understand that the node at index 0 seems to be the return value of the render function.

This is done in `transformChildren`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L26-L31

Under certain conditions, the `id` of that node is pushed into `block.returns`.\
This id is calculated from the length when `pushTemplate` is called.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L123-L135

And,

> Under certain conditions

As to what these conditions are, the first condition is when `isFragment` is `true`.\
This is when the `node` executing `transformChildren` is one of `Root`, `Element`, `Template`, or `Component`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L10-L14

The second condition is when `dynamic.flags` is **not** `NON_TEMPLATE` or is `INSERT`.\
(Note: It might look a bit confusing at first glance, but since it's a bitmask, each flag is not exclusive.)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L27-L28

When these two conditions are met, `id` is pushed into `block.returns`.\
I think the first condition is fine.\
Regarding the second condition, about `dynamic.flags`.

## dynamic.flags

`dynamic` is a property of `TransformContext`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L74

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L246-L252

Since `context.ir` holds this information, its reference is held in `TransformContext`.\
In particular, this time, the information called `DynamicFlag` that `IRDynamicInfo` holds is important, so let's focus on that.

`DynamicFlag` is a flag that represents what kind of properties a node has.\
The properties are as described in the comments.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L230-L244

Since it's expressed with bitmasking, each property can coexist.

Let's see when each flag is marked.

### DynamicFlag.REFERENCED

> This node is referenced and needs to be saved as a variable.

As stated.

There are two places where `DynamicFlag.REFERENCED` is set.

1. When `context.reference` is called.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L117-L121

2. When `IRDynamicInfo` is generated via `newDynamic` (as a default value)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/utils.ts#L20-L23

First, in case 1, `context.reference` is called in quite a few places.\
For example, it's called in the conditional branch when `isFragment` is `true` in `transformChildren` we looked at earlier.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L22-L24

Then, as for what this flag is used for, it's to generate `id` when generating code.\
We'll look at this in detail later when we see the implementation of codegen, but nodes with this flag set will generate an `id` and store it in a variable.

> needs to be saved as a variable.

As stated.

It's understandable that this flag is set in `isFragment` in `transformChildren`.\
By doing this,

```js
const n0 = t0();
const n1 = t1();
const n2 = t2();
```

We can output code that holds in variables like `n${id}`.\
Conversely, nodes that don't need to be stored in variables don't have this flag set.

In this case,

```js
const t0 = template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0(); // here
  return n0;
}
```

Since we need to hold `n0` in a variable, this flag is set.

### DynamicFlag.NON_TEMPLATE

Next is `DynamicFlag.NON_TEMPLATE`.\
Whether this flag is set is quite important; if it's not set, `id` will be pushed into `block.returns`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L26-L31

> This node is not generated from template, but is generated dynamically.

As stated, it seems this flag is set for nodes that are not generated from templates but are generated dynamically.

For example, this flag is set in `transformComponentElement`, `transformSlotOutlet`, `transformVFor`, etc.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L96

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformSlotOutlet.ts#L31

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vFor.ts#L50

Skipping a bit, an important point used in combination with this flag is `DynamicFlag.INSERT`.

### DynamicFlag.INSERT

Whether to push the `id` into `returns` is first determined by checking whether `DynamicFlag.NON_TEMPLATE` is not set.\
If it's not set, it is pushed into `returns` at this point.

If it is set, we check whether `DynamicFlag.INSERT` is set.

Looking at

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L96

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformSlotOutlet.ts#L31

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vFor.ts#L50

you can see that `Component`, `SlotOutlet`, and `v-for` have this flag set from the start.

However,

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L40

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vSlot.ts#L115

do not have this flag set at this point.

Regarding `if`, in the case of `v-if` (not `v-else-if` or `v-else`), this flag is set.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L41-L43

And in the case of inserted slots like `<template #foo>`, this flag is not set.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vSlot.ts#L110-L115

In this way, they select what to push into `block.returns` and what not to.

---

In the case of our small component, since the `DynamicFlag.NON_TEMPLATE` flag is not set, `id` is pushed into `block.returns`.
With this, we've generated (transformed) all the `IR` that seems necessary for codegen!

Next, let's look at the implementation of codegen!
