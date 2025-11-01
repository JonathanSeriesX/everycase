/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  ignorePatterns: ["content/**/*"],
  rules: {
    "@next/next/no-img-element": "off",
  },
};
