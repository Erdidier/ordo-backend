import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "node_modules/",
      "dist",
      ".cache/",
      "build/",
      ".strapi/",
      ".tmp/",
      "types/generated/"
    ],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectName: true,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { "argsIgnorePattern": "^_" }
      ],
    },
  },
  eslintConfigPrettier
)