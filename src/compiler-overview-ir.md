# The IR in Vapor Mode

Now, let's move on to the `IR`. \
From here, we'll delve into the specific implementations of Vapor Mode.

![compiler-vapor-ir](/compiler-overview-ir/compiler-vapor.drawio.png)

We'll first look at the `IR` before proceeding to read the source code of the `transformer`.

## What is IR?

`IR` stands for Intermediate Representation. \
While the `SFCDescriptor` and `AST` were essentially structured versions of the user's (web application developer's) input code, the `IR` can be thought of as the "structured version of the output code." \
The definition of `IR` can be found in `ir/index.ts`.

[https://github.com/vuejs/core-vapor/packages/compiler-vapor/src/ir/index.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts)

Recall the compiler output of the small component we read at the beginning:

```js
import { template as _template } from "vue/vapor";
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

It's somewhat difficult to output these directly from the AST. \
As a strategy, we can prepare an object (IR) to represent the code above, generate the IR by manipulating the AST, and then pass that IR to the codegen, thereby designing the compiler programmatically.

Let's actually see what kind of IR the component above will produce. \
We can check this by inserting logs into our local compiler.

There's a `transform` function around the following area, so let's output the `ir` after the transform.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L76-L89

```json
{
  "type": 0,
  "node": {
    "type": 0,
    "source": "\n  <p>Hello, Vapor!</p>\n",
    "children": [
      {
        "type": 1,
        "tag": "p",
        "ns": 0,
        "tagType": 0,
        "props": [],
        "children": [
          {
            "type": 2,
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
  },
  "source": "\n  <p>Hello, Vapor!</p>\n",
  "template": ["<p>Hello, Vapor!</p>"],
  "component": {},
  "directive": {},
  "block": {
    "type": 1,
    "node": {
      "type": 0,
      "source": "\n  <p>Hello, Vapor!</p>\n",
      "children": [
        {
          "type": 1,
          "tag": "p",
          "ns": 0,
          "tagType": 0,
          "props": [],
          "children": [
            {
              "type": 2,
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
    },
    "dynamic": {
      "flags": 1,
      "children": [
        {
          "flags": 1,
          "children": [
            {
              "flags": 1,
              "children": []
            }
          ],
          "id": 0,
          "template": 0
        }
      ]
    },
    "effect": [],
    "operation": [],
    "returns": [0]
  }
}
```

This is the actual IR. \
Due to the types in the IR being represented as enums, they appear as numbers, making it a bit hard to understand. Let's replace them with the specific IR Node names and remove unnecessary parts. \
Then it becomes something like the following:

```json
{
  "type": "RootIRNode",
  "node": {
    "type": "RootNode",
    "source": "\n  <p>Hello, Vapor!</p>\n",
    "children": [
      {
        "type": "ElementNode",
        "tag": "p",
        "ns": 0,
        "tagType": 0,
        "children": [
          {
            "type": "TextNode",
            "content": "Hello, Vapor!"
          }
        ]
      }
    ],
    "temps": 0
  },
  "source": "\n  <p>Hello, Vapor!</p>\n",
  "template": ["<p>Hello, Vapor!</p>"],
  "block": {
    "type": "BlockIRNode",
    "node": {
      "type": "ElementNode",
      "source": "\n  <p>Hello, Vapor!</p>\n",
      "children": [
        {
          "type": "ElementNode",
          "tag": "p",
          "ns": 0,
          "tagType": "Element",
          "children": [
            {
              "type": "TextNode",
              "content": "Hello, Vapor!"
            }
          ]
        }
      ],
      "temps": 0
    },
    "returns": [0]
  }
}
```

First, there's a `RootIRNode` at the root. This is the root of the IR. \
This `RootIRNode` contains information such as `node`, `template`, and `block`. \
The `node` is the `RootNode` of the AST.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L56-L64

Then, the `block` contains a `BlockIRNode`, which represents a `Block`, the unit of elements handled in Vapor.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L63

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L47-L54

Here, let's explain a bit about `Block`.

## What is a Block?

A `Block` is the unit handled in Vapor Mode. \
It's similar to a `VNode` (virtual DOM node) in non-Vapor Mode.

The definition of `Block` is in `runtime-vapor`, so let's take a look.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L26-L31

Looking at this, you can get an idea of what a `Block` is. \
A `Block` takes a Node (DOM Node), a Fragment, a Component, or an array of Blocks. \
Basically, Vapor constructs the UI using this unit called `Block`.

For example,

```ts
const t0 = template("<p>Hello, Vapor!</p>");
const n0 = t0();
```

Here, `n0` becomes a Block, which is a Node (Element). \
We'll look at this in more detail when we explain the runtime, but let's briefly look at the `template` function.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/template.ts#L2-L11

It simply inserts the template into `innerHTML` and returns its `firstChild`. \
In other words, this is just an `ElementNode`.

Sometimes it's an Element, sometimes a Component, or sometimes composed of arrays of those. The `Block` is the smallest unit used to construct the UI. \
In the future, operations such as registering event listeners or updating text will be performed on this `Block`.

We'll read the definitions of each `IR` as they appear while we read various components from here on, so we'll end the explanation of `IR` here. \
For now, it's sufficient to understand the general idea of what `IR` is and how the small component we're reading at the beginning is represented in `IR`.
