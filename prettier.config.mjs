/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  overrides: [
    {
      files: '.changeset/*.md',
      options: {
        singleQuote: false,
      },
    },
  ],
};

export default config;
