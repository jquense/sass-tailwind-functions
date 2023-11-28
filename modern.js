// @ts-expect-error no types
const toPath = require('lodash/toPath');
const buildMediaQuery =
  require('tailwindcss/lib/util/buildMediaQuery').default;
const escapeClassName =
  require('tailwindcss/lib/util/escapeClassName').default;
const { normalizeScreens } = require('tailwindcss/lib/util/normalizeScreens');
const resolveConfig = require('tailwindcss/resolveConfig');

const EMPTY = '@@EMPTY@@';

module.exports = (sass, tailwindConfig) => {
  const { theme } = resolveConfig(require(tailwindConfig));

  const themeTransforms = {
    fontSize(value) {
      return Array.isArray(value) ? value[0] : value;
    },
    outline(value) {
      return Array.isArray(value) ? value[0] : value;
    },
  };

  const themeFn = ([$keys, $dflt, $listSep]) => {
    // the non-legacy sass-cast methods depend on immutable js,
    // included with any sass version that supports the modern api
    // it shouldn't be required unless such a version is installed
    const { toSass, fromSass } = require('sass-cast');

    const keys = fromSass($keys);
    const hasDefault = fromSass($dflt) !== EMPTY;
    const listSep = $listSep.assertString('$list-separator').text;

    let path;
    if (Array.isArray(keys)) {
      path = keys;
    } else {
      $keys.assertString('$keys');
      path = toPath(keys);
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
          if (hasDefault) return $dflt;

          throw new Error(
            `There is no theme value at ${pristinePath
              .slice(0, pristinePath.indexOf(current) + 1)
              .join('.')}`,
          );
        }
      } else {
        if (hasDefault) return $dflt;
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
      return $dflt;
    }

    let result = toSass(itemValue, {
      parseUnquotedStrings: true,
      quotes: false,
    });
    if (result.separator && result.separator !== listSep)
      result = new sass.SassList(result.asList, { separator: listSep });

    return result;
  };

  function screenFn([$screen]) {
    const screen = $screen.assertString('$screen').text;
    const screens = normalizeScreens(theme.screens);
    const screenDefinition = screens.find(({ name }) => name === screen);
    if (!screenDefinition) {
      throw new Error(`The '${screen}' screen does not exist in your theme.`);
    }
    return new sass.SassString(buildMediaQuery(screenDefinition));
  }

  return {
    [`theme($keys, $defaultValue: "${EMPTY}", $list-separator: ",")`]: themeFn,
    'screen($screen)': screenFn,
    'e($str)': ([str]) => new sass.SassString(escapeClassName(str.text)),
  };
};
