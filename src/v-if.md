# v-if Directive

Consider the following component:

```vue
<script setup>
import { ref } from "vue";
const ok = ref(true);
</script>

<template>
  <div v-if="ok">Hello, v-if!</div>
</template>
```

## Compilation Result and Overview

The compilation result is as follows:

```js
import {
  createIf as _createIf,
  template as _template,
} from "vue/vapor";

const t0 = _template("<div>Hello, v-if!</div>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => _ctx.ok,
    () => {
      const n2 = t0();
      return n2;
    }
  );
  return n0;
}
```

Unlike `v-show`, `v-if` creates and destroys DOM elements based on the condition.\
Therefore, it uses the `createIf` helper function to implement conditional rendering.

`createIf` takes the condition as the first argument, the block to execute when the condition is true (positive) as the second argument, and the block to execute when the condition is false (negative) as the third argument.

## v-if + v-else

Consider the following component:

```vue
<template>
  <div v-if="ok">YES</div>
  <p v-else>NO</p>
</template>
```

The compilation result is as follows:

```js
import { createIf as _createIf, template as _template } from "vue/vapor";
const t0 = _template("<div>YES</div>");
const t1 = _template("<p>NO</p>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => _ctx.ok,
    () => {
      const n2 = t0();
      return n2;
    },
    () => {
      const n4 = t1();
      return n4;
    }
  );
  return n0;
}
```

The `v-else` block is passed as the third argument.

## v-if + v-else-if + v-else

Consider the following component:

```vue
<template>
  <div v-if="ok">OK</div>
  <p v-else-if="orNot">OR NOT</p>
  <span v-else>ELSE</span>
</template>
```

The compilation result is as follows:

```js
import { createIf as _createIf, template as _template } from "vue/vapor";
const t0 = _template("<div>OK</div>");
const t1 = _template("<p>OR NOT</p>");
const t2 = _template("<span>ELSE</span>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => _ctx.ok,
    () => {
      const n2 = t0();
      return n2;
    },
    () =>
      _createIf(
        () => _ctx.orNot,
        () => {
          const n4 = t1();
          return n4;
        },
        () => {
          const n7 = t2();
          return n7;
        }
      )
  );
  return n0;
}
```

`v-else-if` is expressed through nested `createIf` calls.\
You can see that the third argument contains a function that calls another `createIf`.

## Reading the Compiler

### IR

First, let's look at the IR for `v-if`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L66-L73

```ts
export interface IfIRNode extends BaseIRNode {
  type: IRNodeTypes.IF;
  id: number;
  condition: SimpleExpressionNode;
  positive: BlockIRNode;
  negative?: BlockIRNode | IfIRNode;
  once?: boolean;
}
```

- `condition`: The condition expression
- `positive`: The block when the condition is true
- `negative`: The block when the condition is false (`v-else`) or `IfIRNode` (`v-else-if`)
- `once`: When combined with `v-once`

The key point is that `negative` can be either a `BlockIRNode` or an `IfIRNode`.\
For `v-else`, it's a `BlockIRNode`, and for `v-else-if`, it's an `IfIRNode`.

### Transformer

`transformVIf` is defined using `createStructuralDirectiveTransform`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L22-L25

```ts
export const transformVIf: NodeTransform = createStructuralDirectiveTransform(
  ["if", "else", "else-if"],
  processIf
);
```

The `processIf` function handles each case of `v-if`, `v-else`, and `v-else-if`.

#### For v-if

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L41-L55

```ts
if (dir.name === "if") {
  const id = context.reference();
  context.dynamic.flags |= DynamicFlag.INSERT;
  const [branch, onExit] = createIfBranch(node, context);

  return () => {
    onExit();
    context.registerOperation({
      type: IRNodeTypes.IF,
      id,
      condition: dir.exp!,
      positive: branch,
      once: context.inVOnce,
    });
  };
}
```

It creates a block with `createIfBranch` and registers the `IfIRNode` with `registerOperation`.

#### For v-else / v-else-if

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L56-L111

For `v-else` and `v-else-if`, it finds the adjacent `v-if` and adds a block to its `negative` property.

```ts
// Find the adjacent v-if
const siblingIf = getSiblingIf(context, true);

// Get the last IfNode
let lastIfNode = operation[operation.length - 1];

// For v-else-if, find the nested IfIRNode
while (lastIfNode.negative && lastIfNode.negative.type === IRNodeTypes.IF) {
  lastIfNode = lastIfNode.negative;
}

const [branch, onExit] = createIfBranch(node, context);

if (dir.name === "else") {
  // For v-else, set BlockIRNode
  lastIfNode.negative = branch;
} else {
  // For v-else-if, set a new IfIRNode
  lastIfNode.negative = {
    type: IRNodeTypes.IF,
    id: -1,
    condition: dir.exp!,
    positive: branch,
    once: context.inVOnce,
  };
}
```

### Codegen

The `genIf` function handles code generation.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/if.ts#L1-L45

```ts
export function genIf(
  oper: IfIRNode,
  context: CodegenContext,
  isNested = false
): CodeFragment[] {
  const { vaporHelper } = context;
  const { condition, positive, negative, once } = oper;

  const conditionExpr: CodeFragment[] = [
    "() => (",
    ...genExpression(condition, context),
    ")",
  ];

  let positiveArg = genBlock(positive, context);
  let negativeArg: false | CodeFragment[] = false;

  if (negative) {
    if (negative.type === IRNodeTypes.BLOCK) {
      // For v-else
      negativeArg = genBlock(negative, context);
    } else {
      // For v-else-if, recursively call genIf
      negativeArg = ["() => ", ...genIf(negative!, context, true)];
    }
  }

  if (!isNested) push(NEWLINE, `const n${oper.id} = `);
  push(
    ...genCall(
      vaporHelper("createIf"),
      conditionExpr,
      positiveArg,
      negativeArg,
      once && "true"
    )
  );

  return frag;
}
```

When `negative` is an `IfIRNode`, it recursively calls `genIf` to generate nested `createIf` calls.

## Reading the Runtime

`createIf` is implemented in `apiCreateIf.ts` in `runtime-vapor`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateIf.ts#L1-L91

```ts
export const createIf = (
  condition: () => any,
  b1: BlockFn,
  b2?: BlockFn,
  once?: boolean
): Fragment => {
  let newValue: any;
  let oldValue: any;
  let branch: BlockFn | undefined;
  let parent: ParentNode | undefined | null;
  let block: Block | undefined;
  let scope: BlockEffectScope | undefined;
  const parentScope = getCurrentScope()!;
  const anchor = __DEV__ ? createComment("if") : createTextNode();
  const fragment: Fragment = {
    nodes: [],
    anchor,
    [fragmentKey]: true,
  };

  // ...

  createChildFragmentDirectives(
    anchor,
    () => (scope ? [scope] : []),
    condition,
    // init cb
    (getValue) => {
      newValue = !!getValue();
      doIf();
    },
    // effect cb
    (getValue) => {
      if ((newValue = !!getValue()) !== oldValue) {
        doIf();
      } else if (scope) {
        invokeWithUpdate(scope);
      }
    },
    once
  );

  return fragment;

  function doIf() {
    parent ||= anchor.parentNode;
    if (block) {
      invokeWithUnmount(scope!, () => remove(block!, parent!));
    }
    if ((branch = (oldValue = newValue) ? b1 : b2)) {
      scope = new BlockEffectScope(instance, parentScope);
      fragment.nodes = block = scope.run(branch)!;
      invokeWithMount(scope, () => parent && insert(block!, parent, anchor));
    } else {
      scope = block = undefined;
      fragment.nodes = [];
    }
  }
};
```

### How It Works

1. **Anchor Creation**: In development, it creates a comment node with `createComment('if')`, and in production, an empty text node with `createTextNode()`. This serves as a marker for the DOM insertion position.

2. **Fragment Creation**: The result of `v-if` is returned as a `Fragment`. This is an object that has `nodes` (the actual DOM nodes) and `anchor` (the insertion position marker).

3. **Reactive Updates**: It uses `createChildFragmentDirectives` to watch for changes in the condition. When the condition changes, the `doIf` function is called.

4. **doIf Function**: Based on the condition's truth value, it executes the appropriate branch (`b1` or `b2`).
   - If there's an existing block, it removes it with `remove`
   - If there's a new branch, it executes it within a `BlockEffectScope` and inserts it into the DOM with `insert`

### BlockEffectScope

Each branch is executed within its own `BlockEffectScope`.\
This ensures:

- Effects within the branch are properly cleaned up
- When switching branches, the old branch's effects are automatically stopped
- Lifecycle hooks (mount/unmount) are called appropriately

---

Unlike `v-show`, `v-if` actually creates and destroys the DOM based on the condition, making the implementation more complex.\
However, through the IR design and the runtime's `Fragment` pattern, even nested conditional branches like `v-else-if` can be handled elegantly.
