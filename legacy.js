// @ts-expect-error no types
const toPath = require('lodash/toPath');
const { toSass, fromSass } = require('sass-cast/legacy');
const buildMediaQuery =
  require('tailwindcss/lib/util/buildMediaQuery').default;
const escapeClassName =
  require('tailwindcss/lib/util/escapeClassName').default;
const { normalizeScreens } = require('tailwindcss/lib/util/normalizeScreens');
const resolveConfig = require('tailwindcss/resolveConfig');

const EMPTY = '@@EMPTY@@';

const forceToString = (sassValue) => {
  if (sassValue.getValue && !sassValue.getLength)
    return sassValue.getValue().toString();
  if (sassValue.dartValue) return sassValue.dartValue.toString();
  return sassValue.toString();
};

module.exports = (sass, tailwindConfig) => {
  const { theme } = resolveConfig(require(tailwindConfig));

  const assertString = (value, varName) => {
    if (
      !(value instanceof sass.types.String) &&
      value.constructor.name !== 'sass.types.String'
    )
      throw new Error(
        `Expected ${varName} to be a string, got ${forceToString(value)}`,
      );
    return value;
  };

  const themeTransforms = {
    fontSize(value) {
      return Array.isArray(value) ? value[0] : value;
    },
    outline(value) {
      return Array.isArray(value) ? value[0] : value;
    },
  };

  const themeFn = ($keys, $dflt, $listSep) => {
    const keys = fromSass($keys);
    const hasDefault = fromSass($dflt) !== EMPTY;
    const listSep = assertString($listSep, '$list-separator').getValue();
    const isComma = listSep.trim() === ',';

    let path;
    if (Array.isArray(keys)) {
      path = keys;
    } else {
      assertString($keys, '$keys');
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

    const result = toSass(itemValue, {
      parseUnquotedStrings: true,
      quotes: null,
    });
    if (result.getSeparator && result.getSeparator() !== listSep)
      result.setSeparator(isComma);

    return result;
  };

  function screenFn($screen) {
    const screen = assertString($screen, '$screen').getValue();
    const screens = normalizeScreens(theme.screens);
    const screenDefinition = screens.find(({ name }) => name === screen);
    if (!screenDefinition) {
      throw new Error(`The '${screen}' screen does not exist in your theme.`);
    }
    return new sass.types.String(buildMediaQuery(screenDefinition));
  }

  return {
    [`theme($keys, $defaultValue: "${EMPTY}", $list-separator: ",")`]: themeFn,
    'screen($screen)': screenFn,
    'e($str)': (str) => new sass.types.String(escapeClassName(str.getValue())),
  };
};
