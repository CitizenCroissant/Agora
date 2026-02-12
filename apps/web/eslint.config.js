import baseConfig from "../../eslint.config.js";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // Allow apostrophes in French text (common in French content)
      "react/no-unescaped-entities": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
