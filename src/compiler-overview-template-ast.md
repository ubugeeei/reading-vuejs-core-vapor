# Parsing Templates and AST

Next, we'll look at the parser and AST implemented in `compiler-core`.\
The SFC parser uses this.

![](/compiler-overview-template-ast/compiler-vapor.drawio.png)

## AST

AST stands for Abstract Syntax Tree.

It is probably the most complex intermediate object that the Vue.js compiler has.\
Information such as directives, mustaches, slots, etc., are represented as ASTs here.

The implementation is in `ast.ts` of `compiler-core`.

[packages/compiler-core/src/ast.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts)

Let's read through the overall structure.

Looking at the types of Nodes, we can see that there are several categories.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L29-L61

- Plain
- Containers
- Codegen
- SSR Codegen

To conclude, `codegen` and `ssr codegen` are not related to the Vapor compiler.\
This relates to concepts we'll explain later, such as `IR` and `transform`, but in Vapor Mode, information for codegen is aggregated in `IR`.\
However, in traditional Vue.js (non-Vapor Mode), there is no concept of `IR`, and even the output code was represented as `AST`.\
In Vapor Mode, the transformer converts the AST into IR, but in Vue.js (non-Vapor Mode), the AST (Plain, Containers) is converted into AST (Codegen, SSR Codegen) and passed to the codegen.

This time, to explain the design of the Vapor Mode compiler, we won't touch on `codegen` and `ssr codegen`.\
Let's look at the others!

## Plain

First, the basic AST Node types without any specific category.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L29-L37

### Root

As the name suggests, Root represents the root of the template.\
It has Nodes in its `children`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L111-L128

### Element

Element is a Node representing an element.\
Elements like `<p>` or `<div>` correspond to this.\
Components and slots also correspond to this.

These also have Nodes in their `children`.\
They also have attribute information and directive information.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L136-L175

### Text

Text is, as the name suggests, Text.\
In `<p>hello</p>`, `hello` corresponds to this.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L183-L186

### Comment

Comment is a comment.\
`<!-- comment -->` corresponds to this.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L188-L191

### SimpleExpression

SimpleExpression is a simple expression that appears in the template.
It's a bit difficult to explain what is simple and what is not, but for example, `a` and `o.a` are simple, while `(() => 42)()` is not simple.

<div v-pre>

The `foo` in `{{ foo }}` and the `handlers.onClick` in `<button @click="handlers.onClick">` correspond to this.

</div>

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L232-L254

### Interpolation

<div v-pre>

This is a mustache.\
`{{ foo }}` corresponds to this.

</div>

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L256-L259

### Attribute

This corresponds to attributes (not directives).\
In `<div id="app">`, `id="app"` corresponds to this.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L193-L198

### Directive

This is a directive.

`v-on:click="handler"` and `v-for="item in items"` correspond to this.\
Of course, shorthand notations like `@click="handler"` and `#head` are also included.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L200-L218

## Containers

Containers are Nodes with specific structures.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L39-L43

The order might be a bit out of sequence, but let's look at the easier ones first.

### If, IfBranch

`If` and `IfBranch` are Nodes represented by `v-if`, `v-else-if`, and `v-else`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L286-L298

Structurally, an `IfNode` has multiple `IfBranchNode`s, and an `IfBranchNode` has a `condition` (condition) and `children` (Nodes when that condition is met).\
In the case of `v-else`, `condition` becomes `undefined`.

### For

This is the Node represented by `v-for`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L300-L309

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L311-L317

In `<div v-for="it in list">`, `source` becomes `list`, and `value` becomes `it`.

### CompoundExpression

This is a somewhat hard-to-understand concept.

`compound` means "composite", and this Node is composed of multiple Nodes.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L261-L284

<div v-pre>

Examples like `{{ foo }} + {{ bar }}` correspond to this.

</div>

Intuitively, this might seem like a structure of `Interpolation` + `Text` + `Interpolation`, but\
the Vue.js compiler treats these together as a `CompoundExpression`.

The noteworthy point is that types like `string` and `Symbol` can be seen in `children`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L269-L275

This is a mechanism to treat partial strings not as some AST Node but as literals for simplicity.

<div v-pre>

Between `{{ foo }} + {{ bar }}`, the `+` part of the string is more efficient to treat as a literal `" + "` rather than expressing it as a Text Node.

</div>

It's like an AST as follows:

```json
{
  "type": "CompoundExpression",
  "children": [
    { "type": "Interpolation", "content": "foo" },
    " + ",
    { "type": "Interpolation", "content": "bar" }
  ]
}
```

### TextCall

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L319-L323

This is a Node used when expressing Text as a function call `createText`.\
For now, you don't need to worry too much about it.

---

So far, we've looked at the necessary AST Nodes.\
From here, let's look at the implementation of the parser that generates these ASTs!
