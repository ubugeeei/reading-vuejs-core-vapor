# Overview of Transformer

## Implementation

Next, let's look at the `Transformer` that converts `AST` to `IR`.

![compiler vapor transformer](/compiler-overview-transformer/compiler-vapor.drawio.png)

As we discussed in the compiler overview, the concept of a transformer has existed in `compiler-core` since `vuejs/core`. The implementation is around here.

- [packages/compiler-core/src/transform.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/transform.ts)
- [packages/compiler-core/src/transforms/](https://github.com/vuejs/vue-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/transforms)

Since it is not related to Vapor Mode, we will skip it this time, but the transformer in Vapor Mode is designed with reference to the original transformer (not used).\
The transformer for Vapor Mode that we will read this time is implemented around here.

- [packages/compiler-vapor/src/transform.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts)
- [packages/compiler-vapor/src/transforms/](https://github.com/vuejs/vue-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms)

We are calling a function called `transform` implemented in `transform.ts` in the compiler.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L209-L213

Call sequence (compile: parse -> transform -> generate):

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L36-L40

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L62

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L76-L89

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L91

## Design of Transformer

There are two types of interfaces in the Transformer.
`NodeTransform` and `DirectiveTransform`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L31-L34

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L36-L40

Various transformers are implemented in [/transforms/](https://github.com/vuejs/vue-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms), and they are either one of these two.

To quickly summarize which is which:

- NodeTransform
  - [transformChildren](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts)
  - [transformComment](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformComment.ts)
  - [transformElement](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts)
  - [transformSlotOutlet](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformSlotOutlet.ts)
  - [transformTemplateRef](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformTemplateRef.ts)
  - [transformText](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts)
- DirectiveTransform
  - [transformVBind](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vBind.ts)
  - [transformVFor](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vFor.ts)
  - [transformVHtml](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vHtml.ts)
  - [transformVIf](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts)
  - [transformVModel](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts)
  - [transformVOn](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts)
  - [transformVOnce](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOnce.ts)
  - [transformVShow](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vShow.ts)
  - [transformVSlot](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vSlot.ts)
  - [transformVText](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vText.ts)

As you might guess from the names.
These transformers convert the AST into IR.

As you can see from

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L76-L89

these transformers are passed as options to the `transform` function.

`nodeTransforms` and `directiveTransforms` come from the following:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L63-L64

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L100-L125

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L16-L31

## Reading the `transform` Function

Let's read the `transform` function right away.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L210-L229

The `transform` function holds a single object called `TransformContext`.

In short, it's an object that holds options and state necessary for the transformation.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L62

We'll read the implementation in this context as we follow the actual transformation process.

For now, we start the transformation process by passing this context to a function called `transformNode`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L224-L226

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L231-L233

This time, we will follow the process of transforming the AST obtained from the small component we are currently reading.

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

The obtained AST is as follows:

```json
{
  "type": "RootNode",
  "source": "\n  <p>Hello, Vapor!</p>n",
  "children": [
    {
      "type": "ElementNode",
      "tag": "p",
      "ns": 0,
      "tagType": "Element",
      "props": [],
      "children": [
        {
          "type": "TextNode",
          "content": "Hello, Vapor!"
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

First, this Node goes into `transformNode`, and `transformNode` sequentially executes the `nodeTransforms` passed as options.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L237-L240

By design, after applying a transform, any functions to be executed at the end are received as `onExit`. These are stored to be executed later,

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L241-L247

and are executed at the end of `transformNode`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L259-L262

Let's look at the execution of `nodeTransforms` right away. The order is as follows:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L105-L114

<div v-pre>

Since we are not yet using directives or slots this time, we will read `transformText` -> `transformElement` -> `transformChildren` in order.

</div>

## transformText

The implementation is here.

[packages/compiler-vapor/src/transforms/transformText.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts)

If the `type` of the `node` we are looking at is `ELEMENT`, and all its child nodes are text-like and contain interpolations, we treat that node as a "text container" and process it (`processTextLikeContainer`). A text-like node is either text or interpolation.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L63-L78

This time, as you can see from the AST,

```json
{
  "type": "ElementNode",
  "tag": "p",
  "ns": 0,
  "tagType": "Element",
  "props": [],
  "children": [
    {
      "type": "TextNode",
      "content": "Hello, Vapor!"
    }
  ]
}
```

Since we do not include interpolations this time, we do not enter this branch.

Although the order is a bit out of sequence, we proceed to read the nodes one by one, and when we enter the `TextNode`, we pass through the following branch further down.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L40-L42

We add the content of the text node to the `template` property of the context and finish. The `template` becomes `"Hello, Vapor!"`.



## transformElement

The implementation is here.

[packages/compiler-vapor/src/transforms/transformElement.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts)

First of all, this transform operates entirely within the `onExit` lifecycle.\
Note that it returns a function.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L43

Since it is not a Component this time, `transformNativeElement` will be executed (assuming we are reading the `p` tag now).

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L55

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L62-L66

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L130-L134

In `transformNativeElement`, we generate a string to pass as an argument to the `template` function.

<div v-pre>

First, we extract the tag name from the AST and concatenate it with `<`.

</div>

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L137-L139

If there are props, we generate those as well, but since there are none this time, we'll skip it.

Finally, we insert the `childrenTemplate` held in the `context` and generate the closing tag to finish.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L165-L169

`childrenTemplate` is created in `transformChildren`.

In terms of the execution order of the transforms, it's `transformText` -> `transformElement` -> `transformChildren`, but since the `transformElement` processing we just saw is executed in `onExit`, `transformChildren` is executed first, so the `childrenTemplate` has already been generated.

Now let's look at where `childrenTemplate` is actually created.

## transformChildren

The implementation is here.

[packages/compiler-vapor/src/transforms/transformChildren.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts)

What it does is simple: it sequentially executes `transformNode` on each of the `children` of the incoming `node`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L18-L20

What's interesting here is that when it enters a child node, it first creates a new context (`childContext`) specifically for the child node.\
Then, after `transformNode` is done, it retrieves the `template` held in that `childContext` and pushes it into the parent `context`.\
(The push is just [Array.prototype.push](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push))

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L32-L34

<div v-pre>

We have been able to create the string `"<p>Hello, Vapor!</p>"` in `context.template`.

</div>

## Not Finished Yet

Although we were able to generate the string, we actually need to generate code like:

```js
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

We still lack some information to achieve this.\
We haven't yet seen the implementation that makes this template into `t0`, assigns the result to `n0`, and returns it in the render function.\
We'll see where this is done on the next page.
