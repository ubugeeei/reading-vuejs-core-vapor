# Overview of the Compiler

## What is a Compiler?

An implementation that translates one code into another code is called a **compiler**.\
In the case of Vue.js, it takes a Single File Component as input and outputs JavaScript and CSS.

Vapor Mode is a new compiler implementation for Vue.js.\
(It outputs code that does not use the virtual DOM.)

The implementation of the Vapor Mode compiler is mostly in `/packages/compiler-vapor`.

[https://github.com/vuejs/core-vapor/packages/compiler-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor)

Here, there's a reason why I said "mostly."

A typical compiler is implemented with a "parser" and a "generator (codegen)."\
A **parser** analyzes the source code (string) and converts it into an **AST (Abstract Syntax Tree)** (object).

Since source code is just a string, parsing it and treating it as an object with structure makes future transformation processes easier.\
That object is the AST.

For example, when parsing the code string:

```js
1 + 2 * 3
```

it can be represented as:

```json
{
  "type": "BinaryExpression",
  "operator": "+",
  "left": {
    "type": "Literal",
    "value": 1
  },
  "right": {
    "type": "BinaryExpression",
    "operator": "*",
    "left": {
      "type": "Literal",
      "value": 2
    },
    "right": {
      "type": "Literal",
      "value": 3
    }
  }
}
```

Then, based on the obtained AST, the **generator** produces code (string).\
More precisely, it transforms (translates) the obtained AST into any form and outputs it again as a string.

This sequence of "code (input) parsing -> manipulation -> code (output) generation" is the same in Vue.js.

## Design of the Vapor Mode Compiler

The important point here is that "Vapor Mode will be implemented as a subset of the existing Single File Component, so it can use the existing parser."\
This means that Vapor's SFC does not have any unique syntax.

This existing parser is found in `/packages/compiler-sfc` and `/packages/compiler-core`.\
As explained in the overview, `compiler-core` contains the template compiler, and `compiler-sfc` contains the SFC compiler.\
(Of course, these also implement their parsers.)

The object corresponding to the template's AST is called `AST`, and the one corresponding to the SFC's AST is called `SFCDescriptor`.

If we illustrate the discussion so far, it looks like this:

![compiler](/compiler-overview/compiler.drawio.png)

In other words, we use the `parser`, `AST`, and `SFCDescriptor` from `compiler-core` and `compiler-sfc` as they are.\
The specific source code for each will be introduced later.

Next is the part specific to Vapor. The code output part for Vapor Mode is, of course, implemented in `compiler-vapor`.\
Here, there's a new concept called `IR`.\
`IR` stands for Intermediate Representation.\
Roughly speaking, you can think of it as an "object representing the output code."\
The specific source code for this will also be introduced later.

An important concept in the Vue.js compiler is the `transformer`.\
This is an implementation to manipulate the AST and transform (convert) it. In Vapor Mode, this transformer mainly converts the AST into IR.\
Then, code is generated based on the `IR`.

(The concept of the transformer itself is not unique to Vapor; it's also implemented in `compiler-core`. However, Vapor Mode does not use this and uses the transformer implemented in `compiler-vapor`.)

It's a bit complicated, but if we illustrate the flow so far again, it looks like this:

![compiler-vapor](/compiler-overview/compiler-vapor.drawio.png)
