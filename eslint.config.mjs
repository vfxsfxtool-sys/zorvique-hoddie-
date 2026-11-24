import js from "@eslint/js";
import tseslint from "typescript-eslint";
import firebaseRulesPlugin from "@firebase/eslint-plugin-security-rules";

export default [
  {
    ignores: [
      "dist/**/*",
      "apps/*/dist/**/*",
      ".next/**/*",
      "node_modules/**/*",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  firebaseRulesPlugin.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
