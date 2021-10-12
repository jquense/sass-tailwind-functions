// @ts-expect-error no types
const colorConvert = require('color-convert');
const colorString = require('color-string');
const toPath = require('lodash/toPath');
const SassUtils = require('node-sass-utils');
const buildMediaQuery =
  require('tailwindcss/lib/util/buildMediaQuery').default;
const escapeClassName =
  require('tailwindcss/lib/util/escapeClassName').default;
const resolveConfig = require('tailwindcss/resolveConfig');

const EMPTY = '@@EMPTY@@';

module.exports = (sass, tailwindConfig) => {
  const sassUtils = SassUtils(sass);
  const { theme } = resolveConfig(require(tailwindConfig));

  const themeTransforms = {
    fontSize(value) {
      return Array.isArray(value) ? value[0] : value;
    },
    outline(value) {
      return Array.isArray(value) ? value[0] : value;
    },
  };

  const convertString = (result) => {
    let color;

    if (result.startsWith('#')) {
      color = colorConvert.hex.rgb(result);
    }
    if (result.startsWith('rgb')) {
      color = colorString.get.rgb(result);
    }
    if (result.startsWith('hsl')) {
      color = colorConvert.hsl.rgb(colorString.get.hsl(result));
    }
    if (result.startsWith('hwb')) {
      color = colorConvert.hwb.rgb(colorString.get.hwb(result));
    }

    if (color) {
      return new sass.types.Color(...color);
    }

    const numeric = result.match(/([0-9.]+)([a-zA-Z]*)/);

    // If the string has a unit
    if (numeric) {
      return sassUtils.castToSass(
        new sassUtils.SassDimension(parseFloat(numeric[1]), numeric[2]),
      );
    }

    return sassUtils.castToSass(result);
  };

  function convertToSass(themeValue, isComma = true) {
    if (typeof themeValue === 'string') {
      return convertString(themeValue);
    }
    if (Array.isArray(themeValue)) {
      const list = sassUtils.castToSass(themeValue.map(convertToSass));
      list.setSeparator(isComma);
      return list;
    }
    if (themeValue == null) {
      return sass.types.Null.NULL;
    }
    if (typeof themeValue === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(themeValue)) {
        result[key] = convertToSass(value);
      }
      return sassUtils.castToSass(result);
    }

    return sassUtils.castToSass(themeValue);
  }

  const themeFn = (keys, dflt, listSep) => {
    sassUtils.assertType(listSep, 'string');

    const isComma = listSep.getValue().trim() === ',';

    const hasDefault = dflt.getValue?.() !== EMPTY;

    let path;
    if (sassUtils.isType(keys, 'list')) {
      path = sassUtils.castToJs(keys);
    } else {
      path = toPath(keys.getValue());
    }

    let current;
    let itemValue = theme;
    const pristinePath = [...path];
    const themeSection = pristinePath[0];

    const transform = themeTransforms[themeSection];

    while (itemValue && path.length) {
      current = path.shift();

      if (typeof itemValue === 'object' && itemValue) {
        itemValue = Array.isArray(itemValue)
          ? itemValue[+current]
          : itemValue[current];

        if (itemValue === undefined) {
          if (hasDefault) return dflt;

          throw new Error(
            `There is no theme value at ${pristinePath
              .slice(0, pristinePath.indexOf(current) + 1)
              .join('.')}`,
          );
        }
      } else {
        if (hasDefault) return dflt;
        throw new Error(
          `The value at ${pristinePath
            .slice(0, pristinePath.indexOf(current))
            .join(
              '.',
            )} is not an object or array, and has no key: ${current}.`,
        );
      }
    }

    if (transform) {
      itemValue = transform(itemValue);
    }

    if (itemValue == null) {
      return dflt;
    }

    return convertToSass(itemValue, isComma);
  };

  function screenFn(breakpoint) {
    sassUtils.assertType(breakpoint, 'string');

    const screen = breakpoint.getValue();
    if (theme.screens[screen] === undefined) {
      throw new Error(`The '${screen}' screen does not exist in your theme.`);
    }
    return new sass.types.String(buildMediaQuery(theme.screens[screen]));
  }

  return {
    [`theme($keys, $defaultValue: "${EMPTY}", $list-separator: ",")`]: themeFn,
    'screen($screen)': screenFn,
    'e($str)': (str) => new sass.types.String(escapeClassName(str.getValue())),
  };
};
