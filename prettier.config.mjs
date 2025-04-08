/** @type {import('prettier').Config} */
const prettierConfig = {
  singleQuote: false,
  semi: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  trailingComma: "all",
  plugins: ["prettier-plugin-embed", "prettier-plugin-sql", "prettier-plugin-tailwindcss"],
};

/** @type {import('prettier-plugin-embed').PrettierPluginEmbedOptions} */
const prettierPluginEmbedConfig = {
  embeddedSqlTags: ["sql"],
};

/** @type {import('prettier-plugin-sql').SqlBaseOptions} */
const prettierPluginSqlConfig = {
  language: "postgresql",
  keywordCase: "upper",
};

export default {
  ...prettierConfig,
  ...prettierPluginEmbedConfig,
  ...prettierPluginSqlConfig,
};
