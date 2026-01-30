import baseConfig from "../../eslint.config.js";

export default [
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      // Allow apostrophes in French text (common in French content)
      "react/no-unescaped-entities": "off",
    },
  },
];
