const { fromSass } = require('sass-cast');
const { toSass } = require('sass-cast/legacy');
const escapeClassName =
  require('tailwindcss/lib/util/escapeClassName').default;

const sassThemeFn = require('./index');

const toLegacy = (sassValue) =>
  toSass(fromSass(sassValue), {
    parseUnquotedStrings: true,
    quotes: null,
  });
const toModern = (sassValue) => sassValue.dartValue ?? sassValue;

module.exports = (sass, tailwindConfig) => {
  const functions = sassThemeFn(sass, tailwindConfig);
  const [[themeFnKey, themeFn], [screenFnKey, screenFn], [escapeFnKey]] =
    Object.entries(functions);
  const newFunctions = {
    [themeFnKey]: (args) => toModern(themeFn(...args.map(toLegacy))),
    [screenFnKey]: (args) => toModern(screenFn(...args.map(toLegacy))),
    [escapeFnKey]: ([str]) => new sass.SassString(escapeClassName(str.text)),
  };
  return newFunctions;
};
