const sass = require('sass');

const sassThemeFn = require('../index');

const css = String.raw;

const renderMethods = {
  legacy: (data) =>
    sass.renderSync({
      data,
      functions: {
        ...sassThemeFn(
          sass,
          require.resolve('../__fixtures__/tailwind.config'),
        ),
      },
    }),
  modern: (data) =>
    sass.compileString(data, {
      functions: {
        ...sassThemeFn(
          sass,
          require.resolve('../__fixtures__/tailwind.config'),
        ),
      },
    }),
};

Object.entries(renderMethods).forEach(([api, render]) => {
  try {
    render('');
  } catch (e) {
    if (
      api === 'modern' &&
      e.message === 'sass.compileString is not a function'
    )
      return;
    throw e;
  }
  describe(api, () => {
    describe('theme', () => {
      it('works', () => {
        const result = render(css`
          .a {
            border: theme('array', $list-separator: ' ');

            color: transparentize(theme('colors.gray.100'), 0.5);
            padding: theme('padding.3') + 3;
            height: theme('padding.missing', 1px) + 3;

            // should be removed in output
            height: #{theme('padding.fasf', null)};
          }
        `);

        expect(result.css.toString()).toMatchInlineSnapshot(`
".a {
  border: 1px solid red;
  color: rgba(243, 244, 246, 0.5);
  padding: 3.75rem;
  height: 4px;
}"
`);
      });

      it('transforms', () => {
        const result = render(css`
          .a {
            font-size: theme('fontSize.base');
            font-size: theme('fontSize.base[1].lineHeight');
            outline: 2px dotted theme('colors.white');
          }
        `);

        expect(result.css.toString()).toMatchInlineSnapshot(`
".a {
  font-size: 1rem;
  font-size: 1.5rem;
  outline: 2px dotted #fff;
}"
`);
      });
      it('allows a number of paths', () => {
        const result = render(css`
          .a {
            font-size: theme((fontSize, 'base'));
          }
        `);

        expect(result.css.toString()).toMatchInlineSnapshot(`
".a {
  font-size: 1rem;
}"
`);
      });

      it('escapes', () => {
        const result = render(css`
          .square-#{e('0.5')} {
            a: a;
          }
        `);

        expect(result.css.toString()).toMatchInlineSnapshot(`
".square-0\\\\.5 {
  a: a;
}"
`);
      });

      it('should throw on path into non object', () => {
        expect(() =>
          render(css`
            .a {
              padding: theme('colors.gray.100.nope');
            }
          `),
        ).toThrow(
          'The value at colors.gray.100 is not an object or array, and has no key: nope.',
        );
      });

      it('should throw on invalid path', () => {
        expect(() =>
          render(css`
            .a {
              padding: theme('colors.gray.nope.more');
            }
          `),
        ).toThrow('There is no theme value at colors.gray.nope');
      });
    });

    describe('screen', () => {
      it('works', () => {
        const result = render(css`
          @media #{screen(md)} {
            .btn {
              a: a;
            }
          }
          @media #{screen('md')} {
            .btn {
              a: a;
            }
          }
        `);

        expect(result.css.toString()).toMatchInlineSnapshot(`
"@media (min-width: 768px) {
  .btn {
    a: a;
  }
}
@media (min-width: 768px) {
  .btn {
    a: a;
  }
}"
`);
      });

      it('should throw on invalid screen', () => {
        expect(() =>
          render(css`
            @media #{screen(fff)} {
              .btn {
                a: a;
              }
            }
          `),
        ).toThrow("The 'fff' screen does not exist in your theme.");
      });
    });
  });
});
