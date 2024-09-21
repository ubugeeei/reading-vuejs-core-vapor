# Overview of Codegen

Up to this point, we've looked at the process of parsing code, generating an AST, and converting it into IR via the transformer.\
Finally, let's look at codegen, which generates code from the IR.\
By understanding this, you'll have a substantial grasp of the compiler.

![compiler vapor codegen](/compiler-overview-codegen/compiler-vapor.drawio.png)

## Implementation Locations

The implementation of codegen (generator) can be found in the following areas:

- [packages/compiler-vapor/src/generate.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts)
- [packages/compiler-vapor/src/generators](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators)

The structure is similar to the transformer; `generate.ts` implements the `generate` function and `CodegenContext`, and the `generators` directory contains code generation functions for each node.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L99-L103

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L22

As usual, let's read about `CodegenContext` as needed while following the code generation of the component.

## generate

First, let's enter the `generate` function.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L99-L103

The code is appended sequentially using the `push` function obtained from `buildCodeFragment`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L104

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/utils.ts#L30-L35

First, we push the signature of the render function.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L108

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L113

Then, we generate code from the IR using `genBlockContent`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L116-L118

Since the declarations of templates and import statements are done outside the render function, these are generated as `preamble` and added to the beginning of the code.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L126-L129

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L136-L139

This `code` becomes the final code.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L141-L148

Now, let's read `genBlockContent`.

:::info Tips: About `_sfc_render`

When checking the output code, the name of the render function was `_sfc_render` instead of `render`.\
However, in the `generate` function, it is pushed as `render`.

In fact, the `render` function is later rewritten to `_sfc_render` by the implementation of `vite-plugin-vue`.\
Therefore, the name `_sfc_render` does not actually appear in `compiler-vapor`.

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/template.ts#L71-L76

:::

## genBlockContent

The implementation is located in [packages/compiler-vapor/src/generators/block.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts).

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L36-L41

We take out each child from `block.dynamic.children` and generate code.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L51-L53

`block.dynamic.children` is generated in `transformChildren`, and its content directly includes `childContext.dynamic`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L36

Looking again at what information besides flags is included:

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L246-L252

We can see that it includes information like `id` and template index.\
Using this information, we generate code with `genChildren`.

## genChildren

`genChildren` is implemented in [packages/compiler-vapor/src/generators/template.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts).

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L18-L23

This function generates code like `const n${id} = t${template}()`.\
In this case, it generates code like `const n0 = t0()`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L29-L32

Here, code like `nextSibling` and `firstChild`, which will appear later, is also generated. (You can skip this for now.)

## Continuing genBlockContent

Once the code for children is generated.

Next, we generate operations and effects.\
These haven't appeared yet, but they involve generating code for things like text updates and event handler registrations.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L55-L56

Finally, we generate the `return` statement.

We map over `block.returns`, generate identifiers like `n${idx}`, and generate the `return` statement.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L58-L65

---

Surprisingly, that's it for Codegen.\
Now, we've been able to follow the compiler implementation needed to compile a simple component.\
Let's summarize our objectives, steps, and remaining tasks, and proceed to the next step!
