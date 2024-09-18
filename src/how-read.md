# How to Proceed?

<div align="center" style="font-size: 50px">

:man_shrugging:

</div>

## Where to Start Reading

Up to the previous page, you should have understood the overview of the packages in vuejs/core-vapor. \
From here, we'll start reading the actual source code, but where should we begin?

The answer is simple.

**"Know your enemy first."**

To put it another way, "start by looking at the concrete output." \
As explained earlier, Vapor Mode provides a mode that does not use the virtual DOM through the implementation of a compiler.

In other words, let's actually write a Vue.js SFC, run it through the Vapor Mode compiler, and look at the output. \
If we can do that, then by repeatedly going through the two processes of **"looking at the implementation that produces the output"** and **"reading the contents of the generated code"**, we can understand the implementation of Vapor Mode.

Breaking down the steps a bit more:

1. Write a Vue.js SFC
1. Run it through the Vapor Mode compiler
1. Look at the output (understand the overview)
1. Look at the compiler's implementation
1. Read the contents of the output code
1. Go back to step 1

By endlessly repeating this.

## Detailed Steps for 1~3

Let me explain in detail where to write the SFC and how to run it through the Vapor Mode compiler.

Whether you use it or not, let's clone vuejs/core-vapor locally for now. \
Then, check out `30583b9ee1c696d3cb836f0bfd969793e57e849d`.

[vuejs/core-vapor (30583b9ee1c696d3cb836f0bfd969793e57e849d)](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d)

```bash
git clone https://github.com/vuejs/core-vapor.git

cd core-vapor

git checkout 30583b9ee1c696d3cb836f0bfd969793e57e849d

pnpm install
```

When we read the [README](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/README.md?plain=1#L3-L6):

```markdown
This repository is a fork of [vuejs/core](https://github.com/vuejs/core) and is used for research and development of no virtual dom mode.

- [Vapor Playground](https://vapor-repl.netlify.app/)
- [Vapor Template Explorer](https://vapor-template-explorer.netlify.app/)
```

we see this description.

We notice there are tools called [Vapor Playground](https://vapor-repl.netlify.app/) and [Vapor Template Explorer](https://vapor-template-explorer.netlify.app/).

The Playground is essentially the Vapor version of the [Vue SFC Playground](https://play.vuejs.org). \
In other words, you can check the compilation results here.

The Template Explorer is a tool to see what kind of code is generated in Vapor Mode. \
Actually, there's an original version in vuejs/core, and this is the vuejs/core-vapor version. \
Many people might not be familiar with it.

It's a tool to check the compilation results of Vue.js templates (not limited to SFCs). \
So, you can't see what the styles or scripts in an SFC are transformed into.

This time, since we want to see how the entire SFC is converted into code, we'll use the [Vapor Playground](https://vapor-repl.netlify.app/)!

When you open the Playground, `App.vue` is already written. \
On the upper part of the right half of the screen, there's a `JS` tab. If you open it, you can see the output JavaScript code.

<img src="/how-read/playground.png" alt="Vapor Playground" width="800" />

It might look confusing now, but don't worry. \
We'll start by writing smaller SFCs and gradually read through them.

By using this Playground, we can follow steps 1~3. \
For steps 4~6, you can follow along as you read this book!

Well, the introduction has gotten quite long since the previous page, but now that we're ready to read the source code, let's start looking at the outputs and the compiler implementation from the next page!
