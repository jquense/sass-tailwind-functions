const alias = process.env.SASS_ALIAS || 'sass';
module.exports = jest.requireActual(alias);
