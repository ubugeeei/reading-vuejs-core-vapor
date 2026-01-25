# Component

Consider the following components:

```vue
<!-- Child.vue -->
<script setup>
defineProps<{ msg: string }>();
</script>

<template>
  <p>{{ msg }}</p>
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
import Child from "./Child.vue";
</script>

<template>
  <Child msg="Hello!" />
</template>
```

## Compilation Result and Overview

### Basic Component

The compilation result of Parent.vue is as follows:

```js
import { createComponent as _createComponent } from "vue/vapor";

function _sfc_render(_ctx) {
  const n0 = _createComponent(_ctx.Child, { msg: () => "Hello!" }, null, true);
  return n0;
}
```

`createComponent` takes the following arguments:

1. **comp**: The component definition
2. **rawProps**: Array of props
3. **slots**: Array of slots
4. **singleRoot**: Whether it's a single root (for fallthrough attributes)

### Resolution from Assets

For globally registered components:

```vue
<template>
  <Foo />
</template>
```

```js
import {
  resolveComponent as _resolveComponent,
  createComponent as _createComponent,
} from "vue/vapor";

function _sfc_render(_ctx) {
  const _component_Foo = _resolveComponent("Foo");
  const n0 = _createComponent(_component_Foo, null, null, true);
  return n0;
}
```

`resolveComponent` resolves globally registered components.

## Reading the Compiler

### IR

Let's look at the `CREATE_COMPONENT_NODE` IR.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L186-L195

```ts
export interface CreateComponentIRNode extends BaseIRNode {
  type: IRNodeTypes.CREATE_COMPONENT_NODE;
  id: number;
  tag: string;
  props: IRProps[];
  slots: IRSlots[];
  asset: boolean;
  root: boolean;
  once: boolean;
}
```

- `tag`: The component tag name
- `props`: Array of props
- `slots`: Array of slots
- `asset`: Whether it's a globally registered component
- `root`: Whether it's the root component
- `once`: When combined with `v-once`

### Transformer

Within `transformElement`, it determines whether the node is a component.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L55-L66

```ts
const { tag, tagType } = node;
const isComponent = tagType === ElementTypes.COMPONENT;
const propsResult = buildProps(
  node,
  context as TransformContext<ElementNode>,
  isComponent
);

(isComponent ? transformComponentElement : transformNativeElement)(
  tag,
  propsResult,
  context as TransformContext<ElementNode>
);
```

In `transformComponentElement`:

```ts
context.registerOperation({
  type: IRNodeTypes.CREATE_COMPONENT_NODE,
  id: context.reference(),
  tag,
  props: propsResult[0] ? propsResult[1] : [propsResult[1]],
  asset,
  root,
  slots: slotsResult,
  once: context.inVOnce,
});
```

### Codegen

The `genCreateComponent` function handles code generation.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/component.ts#L42-L77

```ts
export function genCreateComponent(
  oper: CreateComponentIRNode,
  context: CodegenContext
): CodeFragment[] {
  const { vaporHelper } = context;

  const tag = genTag();
  const { root, props, slots, once } = oper;
  const rawProps = genRawProps(props, context);
  const rawSlots = genRawSlots(slots, context);

  return [
    NEWLINE,
    `const n${oper.id} = `,
    ...genCall(
      vaporHelper("createComponent"),
      tag,
      rawProps,
      rawSlots,
      root ? "true" : false,
      once && "true"
    ),
    ...genDirectivesForElement(oper.id, context),
  ];

  function genTag() {
    if (oper.asset) {
      return toValidAssetId(oper.tag, "component");
    } else {
      return genExpression(
        extend(createSimpleExpression(oper.tag, false), { ast: null }),
        context
      );
    }
  }
}
```

### Props Generation

Props are wrapped as getter functions:

```ts
function genProp(prop: IRProp, context: CodegenContext, isStatic?: boolean) {
  return [
    ...genPropKey(prop, context),
    ": ",
    ...(prop.handler
      ? genEventHandler(context, prop.values[0])
      : isStatic
        ? ["() => (", ...genExpression(prop.values[0], context), ")"]
        : genExpression(prop.values[0], context)),
    // ...
  ];
}
```

This allows props to be lazily evaluated, enabling reactive updates.

## Reading the Runtime

`createComponent` is implemented in `apiCreateComponent.ts` in `runtime-vapor`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateComponent.ts#L12-L32

```ts
export function createComponent(
  comp: Component,
  rawProps: RawProps | null = null,
  slots: RawSlots | null = null,
  singleRoot: boolean = false,
  once: boolean = false
): ComponentInternalInstance {
  const current = currentInstance!;
  const instance = createComponentInstance(
    comp,
    singleRoot ? withAttrs(rawProps) : rawProps,
    slots,
    once
  );
  setupComponent(instance, singleRoot);

  // register sub-component with current component for lifecycle management
  current.comps.add(instance);

  return instance;
}
```

### Processing Flow

1. **createComponentInstance**: Creates the component instance
2. **withAttrs**: For `singleRoot`, processes fallthrough attributes
3. **setupComponent**: Sets up the component (props, slots, render function)
4. **current.comps.add**: Registers the child component with the parent

### singleRoot and Fallthrough Attributes

When `singleRoot: true`, attributes passed from the parent are automatically applied to the child component's root element:

```ts
const instance = createComponentInstance(
  comp,
  singleRoot ? withAttrs(rawProps) : rawProps,
  slots,
  once
);
```

### Lifecycle Management

Child components are registered in the parent's `comps` Set:

```ts
current.comps.add(instance);
```

This ensures that child components are properly destroyed when the parent component unmounts.

---

Components in Vapor Mode support the same API as the Virtual DOM version.\
Props are wrapped as getter functions, enabling reactive updates.\
The details of `createComponentInstance` and `setupComponent` will be covered in a separate chapter.
