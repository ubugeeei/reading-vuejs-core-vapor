# Template Parser

In the previous section, we looked in detail at the AST, which is the result of parsing.

Now, let's explore the parser that actually generates that AST.

The parser is divided into two steps: `parse` and `tokenize`.

We start with `tokenize`.

## Tokenize

<div v-pre>

`tokenize` is the lexical analysis step.

Lexical analysis is the process of analyzing code, which is just a string, into units called tokens (lexemes).

Tokens are meaningful chunks of strings. Let's look at the actual source code to see what they are.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L87-L138

:::info Tips

Actually, this tokenizer is a forked implementation of a library called [htmlparser2](https://github.com/fb55/htmlparser2/tree/master).

This parser is known as one of the fastest HTML parsers, and Vue.js [significantly improved performance from v3.4 onward](https://blog.vuejs.org/posts/vue-3-4#_2x-faster-parser-and-improved-sfc-build-performance) by using this parser.

This is also mentioned in the source code:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L1-L3

:::

Tokens are represented as `State` in the source code.

The tokenizer has a single internal state called `state`, which is one of the states defined in the `State` enum.

Looking specifically, we have the default state `Text`, `{{` representing the start of an interpolation, `}}` representing the end of an interpolation, the state in between, `<` representing the start of a tag, `>` representing the end of a tag, and so on.

As you can see around:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L47-L84

the strings to be parsed are encoded as `Uint8Array` or numbers to improve performance. (I'm not very familiar with it, but numerical comparisons are probably faster.)

Since it's a forked implementation of `htmlparser2`, it's debatable whether this counts as reading Vue.js source code, but let's actually read a bit of the Tokenizer's implementation.

Below is where the Tokenizer's implementation starts:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L236

As you can see from the constructor, callbacks for each token are defined to achieve "tokenize -> parse".

(In the upcoming `parser.ts`, the parsing of templates is realized by defining these callbacks.)

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L265-L268

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L180-L208

Then, the `parse` method is the initial function:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L923-L928

It reads (stores) the source into the buffer and processes it one character at a time.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L929-L930

It executes callbacks in specific states.

The initial value is `State.Text`, so it starts there.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L935-L943

For example, if the `state` is `Text` and the current character is `<`, it executes the `ontext` callback while updating `state` to `State.BeforeTagName`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L318-L324

In this way, it reads characters in specific states and transitions states based on the character type, proceeding step by step.

Basically, it's a repetition of this process.

Due to the large amount of implementation for other states and characters, we'll omit them.

(There's a lot, but they're doing the same thing.)

## Parse

Now that we have a general understanding of the tokenizer's implementation, let's move on to `parse`.

This is implemented in `parser.ts`.

[packages/compiler-core/src/parser.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts)

Here, the `Tokenizer` we just discussed is used:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L97

Callbacks are registered for each token to build the template's AST.

Let's look at one example.

Please focus on the `oninterpolation` callback.

As the name suggests, this is processing related to the `Interpolation` Node.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L108-L108

Using the length of the delimiters (default is `{{` and `}}`) and the passed indices, it calculates the indices of the inner content of the `Interpolation`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L112-L113

Based on those indices, it retrieves the inner content:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L120

Finally, it generates a Node:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L129-L133

`addNode` is a function that pushes the Node into the existing stack if there is one, or into the root's children if not.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L916-L918

The `stack` is a stack where elements are pushed as they nest.

Since we're here, let's look at that process as well.

When an open tag is finished—for example, if it's `<p>`, at the timing of the `>`—the current tag is `unshift`ed into the stack:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L567-L586

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L580

Then, in `onclosetag`, it shifts the stack:

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L154-L166

In this way, by making full use of the `Tokenizer` callbacks, the AST is constructed.

Although the amount of implementation is large, we're essentially just steadily doing these processes.

</div>
