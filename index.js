const legacy = require('./legacy');
const modern = require('./modern');

module.exports = (sass, tailwindConfig) => {
  const legacyFn = legacy(sass, tailwindConfig);
  const modernFn = modern(sass, tailwindConfig);

  return Object.keys(modernFn).reduce(
    (fnObj, fnKey) => ({
      ...fnObj,
      [fnKey]: (...args) =>
        Array.isArray(args[0])
          ? modernFn[fnKey](...args)
          : legacyFn[fnKey](...args),
    }),
    {},
  );
};
