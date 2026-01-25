# Template Refs

Consider the following component:

```vue
<script setup>
import { ref, onMounted } from "vue";

const divRef = ref(null);

onMounted(() => {
  console.log(divRef.value); // <div>...</div>
});
</script>

<template>
  <div ref="divRef">Hello, Template Refs!</div>
</template>
```

## Compilation Result and Overview

### Static ref

```vue
<template>
  <div ref="foo">content</div>
</template>
```

The compilation result is as follows:

```js
import { setRef as _setRef, template as _template } from "vue/vapor";
const t0 = _template("<div>content</div>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _setRef(n0, "foo");
  return n0;
}
```

`setRef` is a helper function that sets a ref on an element.

### Dynamic ref

```vue
<template>
  <div :ref="foo">content</div>
</template>
```

The compilation result is as follows:

```js
import {
  renderEffect as _renderEffect,
  setRef as _setRef,
  template as _template,
} from "vue/vapor";
const t0 = _template("<div>content</div>");

function _sfc_render(_ctx) {
  const n0 = t0();
  let r0;
  _renderEffect(() => (r0 = _setRef(n0, _ctx.foo, r0)));
  return n0;
}
```

For dynamic refs, `setRef` is called within `renderEffect`, passing the previous ref value (`r0`) to unset the old ref.

### ref + v-for

```vue
<template>
  <div v-for="i in [1, 2, 3]" ref="foo">{{ i }}</div>
</template>
```

The compilation result is as follows:

```js
import {
  setRef as _setRef,
  createFor as _createFor,
  template as _template,
} from "vue/vapor";
const t0 = _template("<div></div>");

function _sfc_render(_ctx) {
  const n0 = _createFor(
    () => [1, 2, 3],
    (_ctx0) => {
      const n2 = t0();
      _setRef(n2, "foo", void 0, true);
      return n2;
    }
  );
  return n0;
}
```

For refs within v-for, the 4th argument `refFor` is set to `true`, managing the ref as an array.

### ref + v-if

```vue
<template>
  <div v-if="true" ref="foo">content</div>
</template>
```

The compilation result is as follows:

```js
import {
  setRef as _setRef,
  createIf as _createIf,
  template as _template,
} from "vue/vapor";
const t0 = _template("<div>content</div>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => true,
    () => {
      const n2 = t0();
      _setRef(n2, "foo");
      return n2;
    }
  );
  return n0;
}
```

For refs within v-if, they are set normally but are automatically cleaned up when the block's scope is destroyed.

## Reading the Compiler

### IR

Let's look at the `SET_TEMPLATE_REF` IR.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L140-L146

```ts
export interface SetTemplateRefIRNode extends BaseIRNode {
  type: IRNodeTypes.SET_TEMPLATE_REF;
  element: number;
  value: SimpleExpressionNode;
  refFor: boolean;
  effect: boolean;
}
```

- `element`: The ID of the element to set the ref on
- `value`: The ref name or expression
- `refFor`: Whether inside v-for
- `effect`: Whether it's a dynamic ref

### Transformer

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformTemplateRef.ts#L12-L43

```ts
export const transformTemplateRef: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT) return;

  const dir = findProp(node, "ref", false, true);
  if (!dir) return;

  let value: SimpleExpressionNode;
  if (dir.type === NodeTypes.DIRECTIVE) {
    // For :ref="foo"
    value = dir.exp || normalizeBindShorthand(dir.arg!, context);
  } else {
    // For ref="foo"
    value = dir.value
      ? createSimpleExpression(dir.value.content, true, dir.value.loc)
      : EMPTY_EXPRESSION;
  }

  return () => {
    const id = context.reference();
    const effect = !isConstantExpression(value);

    // For dynamic refs, declare a variable to track the old ref
    effect &&
      context.registerOperation({
        type: IRNodeTypes.DECLARE_OLD_REF,
        id,
      });

    context.registerEffect([value], {
      type: IRNodeTypes.SET_TEMPLATE_REF,
      element: id,
      value,
      refFor: !!context.inVFor,
      effect,
    });
  };
};
```

Key points:

1. Detect `ref` attribute or `:ref` directive
2. Determine if static or dynamic (`isConstantExpression`)
3. For dynamic, declare a variable to track the old ref with `DECLARE_OLD_REF`
4. Register the ref setting with `SET_TEMPLATE_REF`

## Reading the Runtime

`setRef` is implemented in `dom/templateRef.ts` in `runtime-vapor`.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/templateRef.ts#L30-L138

```ts
export function setRef(
  el: RefEl,
  ref: NodeRef,
  oldRef?: NodeRef,
  refFor = false
): NodeRef | undefined {
  if (!currentInstance) return;
  const { setupState, isUnmounted } = currentInstance;

  if (isUnmounted) {
    return;
  }

  const refValue = isVaporComponent(el) ? el.exposed || el : el;
  const refs =
    currentInstance.refs === EMPTY_OBJ
      ? (currentInstance.refs = {})
      : currentInstance.refs;

  // If dynamic ref changed, unset the old ref
  if (oldRef != null && oldRef !== ref) {
    if (isString(oldRef)) {
      refs[oldRef] = null;
      if (hasOwn(setupState, oldRef)) {
        setupState[oldRef] = null;
      }
    } else if (isRef(oldRef)) {
      oldRef.value = null;
    }
  }

  // ...
}
```

### Types of Refs

`setRef` supports 3 types of refs:

1. **String ref**: `ref="foo"` - Set to `setupState.foo` or `refs.foo`
2. **Ref object**: `:ref="myRef"` - Set to `myRef.value`
3. **Function ref**: `:ref="(el) => ..."` - Calls the function

### Array refs in v-for

When `refFor = true`, refs are managed as an array:

```ts
if (refFor) {
  existing = _isString
    ? hasOwn(setupState, ref)
      ? setupState[ref]
      : refs[ref]
    : ref.value;

  if (!isArray(existing)) {
    existing = [refValue];
    // ...
  } else if (!existing.includes(refValue)) {
    existing.push(refValue);
  }
}
```

### Cleanup

Using `onScopeDispose`, refs are cleaned up when the scope is destroyed:

```ts
onScopeDispose(() => {
  queuePostFlushCb(() => {
    if (isArray(existing)) {
      remove(existing, refValue);
    } else if (_isString) {
      refs[ref] = null;
      if (hasOwn(setupState, ref)) {
        setupState[ref] = null;
      }
    } else if (_isRef) {
      ref.value = null;
    }
  });
});
```

This ensures that refs are automatically cleaned up when blocks are destroyed in v-if or v-for.

### queuePostFlushCb

Ref setting is registered to the Post Flush Queue using `queuePostFlushCb`:

```ts
const doSet: SchedulerJob = () => {
  // ref setting logic
};
doSet.id = -1;
queuePostFlushCb(doSet);
```

`id = -1` ensures execution before other jobs.\
This means refs are set after DOM updates but before other effects.

---

Template Refs in Vapor Mode provide the same behavior as the Options API.\
It supports all use cases including dynamic refs, array refs in v-for, and function refs.\
By utilizing `onScopeDispose`, proper cleanup is also guaranteed.
