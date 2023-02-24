# Sass Tailwind functions

A Sass plugin that provides the TailwindCSS `theme` and `screen` functions
to Sass files. Makes using tailwind with Sass a bit easier.

## Setup

```sh
npm i sass-tailwind-functions
```

Configuring sass plugins requires using the API directly (sorry no CLI support).

If using Sass directly:

```js
const createFunctions = require('sass-tailwind-functions')

const tailwindFunctions = createFunctions(sass, 'path/to/tailwind.config.js')

const result = sass.renderSync({
  ...,
  functions: {
    ...tailwindFunctions
  }
})

```

bundlers like webpack, et all also allow passing options
to sass, follow specific instuctions for each tool (e.g. sass-loader)

You can also create functions for the [modern sass API](https://sass-lang.com/documentation/js-api/)
by importing `sass-tailwind-functions/modern`.

## Usage

If configured correctly both the `theme`, `screen` and `e` functions will
be globally available in your sass files.

```scss
@media #{screen(md)} {
  .btn {
    width: theme('padding.2');
  }
}
```

Just like with Tailwind, the theme accepts an optional default value
if the key is missing:

```scss
.btn {
  width: theme('padding.nope', 3px);
}
```

Because the functions are Sass plugins, values returned from `theme`
can be used in calculations, or mixed with other sass functions:

```scss
$hover-color: adjust-color(theme('colors.blue.400'), $alpha: 0.5);

$height: theme('padding.3') * 2;
```

### Escaping

Since tailwind classes tend to require escaping (e.g. `.p-0\.5`) it
can be a bit of a pain using some of the tailwind keys like the loop above.
To make that easier, a `e()` function is also included (since Sass doesn't have an escape built in).

```scss
@each $name, $value in theme('spacing') {
  .square-#{e($name)} {
    width: $value;
    height: $height;
  }
}
```
