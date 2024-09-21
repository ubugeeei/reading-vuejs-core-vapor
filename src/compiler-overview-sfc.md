# Parsing SFC and SFCDescriptor

From here, let's look at the details of each part explained earlier.

Since the parser for SFC is part of the SFC compiler, it is implemented in `compiler-sfc`.

[https://github.com/vuejs/core-vapor/packages/compiler-sfc](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc)

## SFCDescriptor

First, the object called `SFCDescriptor`, which is the result of parsing, is an object that holds information about the SFC. \
It includes the filename, template information, script information, style information, etc.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L76-L102

The template, script, and style each inherit from an object called `SFCBlock`, and this `SFCBlock` contains information such as `content`, which represents its content, `attrs`, which represents attributes like lang, setup, scoped, etc., and `loc`, which indicates where in the whole SFC it is located.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L39-L47

The `template` is represented by an object called `SFCTemplateBlock`, which contains the AST explained earlier.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L49-L52

Similarly, the script is represented by an object called `SFCScriptBlock`. \
This includes a flag indicating whether it is setup or not, information about the modules being imported, and the AST of the script (JS, TS) that is the content of the block.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L54-L68

Similarly, the style is represented by an object called `SFCStyleBlock`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L70-L74

That's roughly the outline of `SFCDescriptor`.

If you actually parse an SFC like the following:

```vue
<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <button type="button" @click="count++">{{ count }}</button>
</template>
```

Then you get an `SFCDescriptor` like the following. \
You don't need to read the `ast` in detail now. We will explain it later. \
*Note: Some parts are omitted.*

```json
{
  "filename": "path/to/core-vapor/playground/src/App.vue",
  "source": "<script setup lang=\"ts\">\nimport { ref } from 'vue'\n\nconst count = ref(0)\n</script>\n\n<template>\n  <button type=\"button\" @click=\"count++\">{{ count }}</button>\n</template>\n",
  "template": {
    "type": "template",
    "content": "\n  <button type=\"button\" @click=\"count++\">{{ count }}</button>\n",
    "attrs": {},
    "ast": {
      "type": 0,
      "source": "<script setup lang=\"ts\">\nimport { ref } from 'vue'\n\nconst count = ref(0)\n</script>\n\n<template>\n  <button type=\"button\" @click=\"count++\">{{ count }}</button>\n</template>\n",
      "children": [
        {
          "type": 1,
          "tag": "button",
          "tagType": 0,
          "props": [
            {
              "type": 6,
              "name": "type",
              "value": {
                "type": 2,
                "content": "button",
                "source": "\"button\""
              }
            },
            {
              "type": 7,
              "name": "on",
              "rawName": "@click",
              "exp": {
                "type": 4,
                "content": "count++",
                "isStatic": false,
                "constType": 0,
                "ast": {
                  "type": "UpdateExpression",
                  "start": 1,
                  "end": 8,
                  "operator": "++",
                  "prefix": false,
                  "argument": {
                    "type": "Identifier",
                    "identifierName": "count"
                  },
                  "name": "count"
                },
                "extra": {
                  "parenthesized": true,
                  "parenStart": 0
                },
                "comments": [],
                "errors": []
              }
            },
            "arg": {
              "type": 4,
              "content": "click",
              "isStatic": true,
              "constType": 3
            },
            "modifiers": []
          ],
          "children": [
            {
              "type": 5,
              "content": {
                "type": 4,
                "content": "count",
                "isStatic": false,
                "constType": 0,
                "ast": null
              }
            }
          ]
        }
      ]
    }
  },
  "script": null,
  "scriptSetup": {
    "type": "script",
    "content": "\nimport { ref } from 'vue'\n\nconst count = ref(0)\n",
    "attrs": {
      "setup": true,
      "lang": "ts"
    },
    "setup": true,
    "lang": "ts"
  },
  "styles": []
}
```

We get an `SFCDescriptor` like this.

## Implementation of the Parser

The implementation of the parser is the `parse` function below.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L126-L129

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L104-L107

The `source` contains the string of the SFC. \
It parses that string and returns an `SFCDescriptor`.

First, it parses the entire SFC using the template parser.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L162-L169

The `compiler.parse` in `compiler` comes from options, and this is actually the template parser in `compiler-core`.

"Why use the template parser even though it's an SFC...?"

It's understandable to think so. That's correct. \
However, if you think about it carefully, this is sufficient.

Both template and SFC are almost HTML in terms of syntax. \
When parsing something HTML-like in Vue.js, we basically use the parser in `compiler-core`. \
There are slight differences, so you can see that we're passing `'sfc'` as the `parseMode` argument.

In other words, `compiler-core` is in a more general position rather than implementing a parser exclusively for templates, and the parser in `compiler-sfc` is a wrapper around it.

Through this parsing process, we can get the rough structure of `template`, `script`, `style`, etc., so we then branch and perform detailed parsing for each.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L184-L185

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L215

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L229

In the detailed parts, we process to generate each Block that inherits from the earlier `SFCBlock`. \
(Basically, we're just calling a formatting function called `createBlock` and doing error handling, so we'll omit the code.)

After that, we generate source maps, etc.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L285-L302

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L377-L384

Surprisingly, this completes the parsing process of the SFC.
