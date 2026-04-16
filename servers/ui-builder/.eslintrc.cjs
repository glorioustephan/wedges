/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@wedges/eslint-config/eslint-library.cjs"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};
