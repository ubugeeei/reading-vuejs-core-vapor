# Let's Dive In!

## Quick Recap (as usual)

Let's start with the usual recap phase.\
It’s a common step in books like this.

### What is Vue.js?

Vue.js is a user-friendly, high-performance, and versatile framework for building web user interfaces.

https://vuejs.org

At this point, no further explanation is probably necessary.

<div align="center">
  <img src="https://raw.githubusercontent.com/vuejs/art/366e8fad63e6210fcbc610f06ca56fcfbf30ed11/logo.svg" alt="Vue.js" width="120px" />
</div>

### What is Vapor Mode?

Vapor Mode is the next-generation implementation of Vue.js.

It offers a mode that doesn't use a virtual DOM, thanks to a compiler implementation.\
We'll go over what the compiler and virtual DOM are in more detail later.\
The primary goal is to **improve performance**.

## Target for Source Code Reading

The official Vue.js team provides several repositories under the [`vuejs`](https://github.com/vuejs) GitHub organization.\
Among them, [`vuejs/core-vapor`](https://github.com/vuejs/core-vapor) is the implementation of Vapor Mode.

This repository, [`vuejs/core-vapor`](https://github.com/vuejs/core-vapor), is actually a fork of [`vuejs/core`](https://github.com/vuejs/core).\
What you're probably using regularly, the so-called "Vue.js," is in this [`vuejs/core`](https://github.com/vuejs/core) repository.\
As of September 2024, Vapor Mode is still in the R&D (research and development) phase, so it hasn't been merged into [`vuejs/core`](https://github.com/vuejs/core) yet.

To add to the complexity, [`vuejs/core`](https://github.com/vuejs/core) is the implementation from Vue.js v3 onwards, while the implementation for v2 and earlier versions is in a separate repository called [`vuejs/vue`](https://github.com/vuejs/vue).\
(It’s often pointed out that `vuejs/core` has fewer stars, but this is because the repository was moved during the transition to v3.)

For this book, we’ll be focusing on the implementation of Vapor Mode, which means reading through [`vuejs/core-vapor`](https://github.com/vuejs/core-vapor)!

Related repositories for the Vue.js implementation:

![related repository](/lets-deep-dive/related-repository.drawio.png)
