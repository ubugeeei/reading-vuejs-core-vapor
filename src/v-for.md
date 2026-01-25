# v-for Directive

Consider the following component:

```vue
<script setup>
import { ref } from "vue";
const items = ref([
  { id: 1, name: "a" },
  { id: 2, name: "b" },
  { id: 3, name: "c" },
]);
</script>

<template>
  <div v-for="item in items" :key="item.id">{{ item.name }}</div>
</template>
```

## Compilation Result and Overview

The compilation result is as follows:

```js
import {
  renderEffect as _renderEffect,
  setText as _setText,
  createFor as _createFor,
  template as _template,
} from "vue/vapor";

const t0 = _template("<div></div>");

function _sfc_render(_ctx) {
  const n0 = _createFor(
    () => _ctx.items,
    (_ctx0) => {
      const n2 = t0();
      _renderEffect(() => _setText(n2, _ctx0[0].name));
      return n2;
    },
    (item) => item.id
  );
  return n0;
}
```

`createFor` takes the following arguments:

1. **source**: The source to loop over (`() => _ctx.items`)
2. **renderItem**: The function to render each item
3. **getKey**: The function to get the key (optional)

`_ctx0` is an array of `[item, key, index]`, where `_ctx0[0]` is `item`, `_ctx0[1]` is `key`, and `_ctx0[2]` is `index`.

## Various Patterns

### Nested v-for

```vue
<template>
  <div v-for="item in list">
    <span v-for="child in item">{{ child + item }}</span>
  </div>
</template>
```

```js
const n0 = _createFor(
  () => _ctx.list,
  (_ctx0) => {
    const n5 = t1();
    const n2 = _createFor(
      () => _ctx0[0],
      (_ctx1) => {
        const n4 = t0();
        _renderEffect(() => _setText(n4, _ctx1[0] + _ctx0[0]));
        return n4;
      }
    );
    _insert(n2, n5);
    return n5;
  }
);
```

When nested, `_ctx0` refers to the outer v-for's context, and `_ctx1` refers to the inner v-for's context.

### Destructuring

```vue
<template>
  <div v-for="{ id, ...other } in list" :key="id">
    {{ id + other }}
  </div>
</template>
```

```js
const n0 = _createFor(
  () => _ctx.list,
  _withDestructure(
    ([{ id, ...other }, index]) => [id, other, index],
    (_ctx0) => {
      const n2 = t0();
      _renderEffect(() => _setText(n2, _ctx0[0] + _ctx0[1] + _ctx0[2]));
      return n2;
    }
  ),
  ({ id, ...other }, index) => id
);
```

For destructuring, the `withDestructure` helper is used to convert the destructured values into an array.

## Reading the Compiler

### IR

First, let's look at the IR for `v-for`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L75-L88

```ts
export interface IRFor {
  source: SimpleExpressionNode;
  value?: SimpleExpressionNode;
  key?: SimpleExpressionNode;
  index?: SimpleExpressionNode;
}

export interface ForIRNode extends BaseIRNode, IRFor {
  type: IRNodeTypes.FOR;
  id: number;
  keyProp?: SimpleExpressionNode;
  render: BlockIRNode;
  once: boolean;
}
```

- `source`: The source expression to loop over
- `value`: The loop variable (`item`)
- `key`: The key variable (for object loops)
- `index`: The index variable
- `keyProp`: The `:key` prop expression
- `render`: The rendering block for each item
- `once`: When combined with `v-once`

### Transformer

`transformVFor` is defined using `createStructuralDirectiveTransform`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vFor.ts#L21-L70

```ts
export const transformVFor: NodeTransform = createStructuralDirectiveTransform(
  "for",
  processFor
);

export function processFor(
  node: ElementNode,
  dir: VaporDirectiveNode,
  context: TransformContext<ElementNode>
) {
  // ...
  const parseResult = dir.forParseResult;
  const { source, value, key, index } = parseResult;

  const keyProp = findProp(node, "key");
  const keyProperty = keyProp && propToExpression(keyProp);
  // ...

  const render: BlockIRNode = newBlock(node);
  const exitBlock = context.enterBlock(render, true);

  return (): void => {
    exitBlock();
    context.registerOperation({
      type: IRNodeTypes.FOR,
      id,
      source: source as SimpleExpressionNode,
      value: value as SimpleExpressionNode | undefined,
      key: key as SimpleExpressionNode | undefined,
      index: index as SimpleExpressionNode | undefined,
      keyProp: keyProperty,
      render,
      once: context.inVOnce,
    });
  };
}
```

`forParseResult` is the result parsed by the `@vue/compiler-dom` parser, containing `source`, `value`, `key`, and `index`.

### Codegen

The `genFor` function handles code generation.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/for.ts#L14-L122

Key processes:

1. **Source expression generation**: In the form `() => (_ctx.items)`
2. **Render function generation**: A function that takes `_ctx0` as argument
3. **Key function generation**: When `:key` prop exists
4. **Destructuring handling**: Using `withDestructure`

```ts
if (isDestructureAssignment) {
  blockFn = genCall(
    vaporHelper("withDestructure"),
    destructureAssignmentFn,
    blockFn
  );
}

return [
  NEWLINE,
  `const n${id} = `,
  ...genCall(
    vaporHelper("createFor"),
    sourceExpr,
    blockFn,
    getKeyFn,
    false, // getMemo
    false, // hydrationNode
    once && "true"
  ),
];
```

## Reading the Runtime

`createFor` is implemented in `apiCreateFor.ts` in `runtime-vapor`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateFor.ts#L44-L355

### Overview

```ts
export const createFor = (
  src: () => Source,
  renderItem: (block: any) => Block,
  getKey?: (item: any, key: any, index?: number) => any,
  getMemo?: (item: any, key: any, index?: number) => any[],
  hydrationNode?: Node,
  once?: boolean
): Fragment => {
  let oldBlocks: ForBlock[] = [];
  // ...
};
```

### ForBlock Structure

```ts
interface ForBlock extends Fragment {
  scope: BlockEffectScope;
  state: [
    item: ShallowRef<any>,
    key: ShallowRef<any>,
    index: ShallowRef<number | undefined>
  ];
  key: any;
  memo: any[] | undefined;
}
```

Each item is managed as a `ForBlock`:

- `scope`: Effect scope
- `state`: Array of `[item, key, index]` as `ShallowRef`
- `key`: The key property value
- `memo`: Cache for v-memo

### Diff Algorithm

`createFor` uses the same Diff algorithm as Vue 3's Virtual DOM:

1. **Sync from start**: Process items with the same key from the beginning
2. **Sync from end**: Process items with the same key from the end
3. **Common sequence + mount**: Add new items
4. **Common sequence + unmount**: Remove old items
5. **Unknown sequence**: Minimal DOM movement using LIS (Longest Increasing Subsequence)

```ts
// 5.3 move and mount
// generate longest stable subsequence only when nodes have moved
const increasingNewIndexSequence = moved
  ? getSequence(newIndexToOldIndexMap)
  : [];
```

### mount/unmount

```ts
function mount(source: any, idx: number, anchor: Node = parentAnchor): ForBlock {
  const scope = new BlockEffectScope(instance, parentScope);
  const [item, key, index] = getItem(source, idx);
  const state = [shallowRef(item), shallowRef(key), shallowRef(index)];
  const block: ForBlock = {
    nodes: null!,
    scope,
    state,
    key: getKey && getKey(item, key, index),
    // ...
  };
  block.nodes = scope.run(() => renderItem(proxyRefs(state)))!;
  // ...
  return block;
}

function unmount({ nodes, scope }: ForBlock) {
  invokeWithUnmount(scope, () => {
    removeBlock(nodes, parent!);
  });
}
```

### State Proxying with proxyRefs

The `state` passed to `renderItem` is wrapped with `proxyRefs`.\
This allows accessing `item`, `key`, and `index` without using `.value` in the template.

```ts
block.nodes = scope.run(() => renderItem(proxyRefs(state)))!;
```

In the compilation result, they are accessed as `_ctx0[0]`, `_ctx0[1]`, `_ctx0[2]`,\
but `proxyRefs` automatically resolves `.value`.

---

`v-for` in Vapor Mode also adopts the same Diff algorithm as Virtual DOM,\
enabling efficient updates using keys.\
By combining `BlockEffectScope` and `ShallowRef`,\
reactive updates and proper lifecycle management are achieved.
