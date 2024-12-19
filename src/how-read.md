# How to Proceed?

<div align="center" style="font-size: 50px">

:man_shrugging:

</div>

## Where to Start Reading

Up to the previous page, you should have understood the overview of the packages in vuejs/core-vapor. \
From here, we'll be reading the actual source code, but where should we start?

The answer is simple.

**"Know your enemy first."**

In other words, "start by looking at the concrete output." \
As explained earlier, Vapor Mode provides a mode that does not use the virtual DOM through the implementation of a compiler.

So, let's actually write a Vue.js SFC, run it through the Vapor Mode compiler, and look at the output. \
If we can do that, we can understand the implementation of Vapor Mode by repeatedly going through two processes: **"looking at the implementation that produces the output"** and **"reading the contents of the generated code."**

Breaking down the steps a bit more:

1. Write a Vue.js SFC
1. Run it through the Vapor Mode compiler
1. Look at the output (understand the overview)
1. Look at the compiler's implementation
1. Read the contents of the output code
1. Return to step 1

We just need to repeat this endlessly.

## Detailed Steps for 1~3

Let me explain in detail where to write the SFC and how to run it through the Vapor Mode compiler.

For now, let's clone vuejs/core-vapor to your local machine. \
Then, check out `30583b9ee1c696d3cb836f0bfd969793e57e849d`.

[vuejs/core-vapor (30583b9ee1c696d3cb836f0bfd969793e57e849d)](https://github.com/vuejs/vue-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d)

```bash
git clone https://github.com/vuejs/vue-vapor.git

cd core-vapor

git checkout 30583b9ee1c696d3cb836f0bfd969793e57e849d

pnpm install
```

When we read the [README](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/README.md?plain=1#L3-L6):

```md
This repository is a fork of [vuejs/core](https://github.com/vuejs/core) and is used for research and development of no virtual dom mode.

- [Vapor Playground](https://vapor-repl.netlify.app/)
- [Vapor Template Explorer](https://vapor-template-explorer.netlify.app/)
```

we find this description.

We notice that there are tools called [Vapor Playground](https://vapor-repl.netlify.app/) and [Vapor Template Explorer](https://vapor-template-explorer.netlify.app/).

The Playground is the Vapor version of the [Vue SFC Playground](https://play.vuejs.org). \
In other words, you can check the compilation results here.

![Vapor Playground](/how-read/playground.png)

The Template Explorer is a tool to see what kind of code is generated in Vapor Mode. \
Actually, there's an original version in vuejs/core, and this is the vuejs/core-vapor version. \
Many people might not be familiar with it.

It's a tool to check the compilation results of Vue.js templates (not limited to SFCs). \
So, you can't see what the styles or scripts in an SFC are transformed into.

So, let's use the Playground! Or so I'd like to say, but there's a slight problem. \
This time, we'll be reading the code at [30583b9ee1c696d3cb836f0bfd969793e57e849d](https://github.com/vuejs/vue-vapor/commit/30583b9ee1c696d3cb836f0bfd969793e57e849d), but the Playground hosted at this link cannot fix the commit. \
Since Vapor Mode is currently in R&D, the source code changes frequently. \
It would be quite inconvenient if it changes while we're reading it, so let's find a way to use the vuejs/core-vapor we just checked out locally to confirm things.

In vuejs/core-vapor, there is a directory called `/playground`. \
You can start this playground by running `pnpm dev` in `vuejs/core-vapor`. \
There are some components placed in `/playground/src`. When you access the started playground, you'll find that `/playground/src/App.vue` is running in your browser.

In this playground, `/playground/src` corresponds to routing. For example, if you access `http://localhost:5173/components.vue`, `/playground/src/components.vue` will be executed. \
Let's make use of this playground this time. \
For now, let's rewrite `App.vue` and see. \
You can check the compilation results in the source tab of your browser's developer tools.

![dev-tool](/how-read/dev-tool.png)

It might look confusing now, but don't worry. \
We'll start by writing smaller SFCs and gradually read through them.

Also, since this playground runs the implementation of this repository, you can modify the source code as you go and confirm the changes.

By using this playground, we can follow steps 1~3. \
For steps 4~6, you can follow along as you read this book!

Well, the introduction has become quite long since the previous page, but now that we're ready to read the source code, let's start looking at the outputs and the compiler implementation from the next page!
