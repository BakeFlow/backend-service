import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended", "plugin:prettier/recommended"],
    // Allow both browser and node globals (this repo uses Node + some browser tooling)
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      // Allow unused variables that start with underscore (common pattern)
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      // Disable requiring default export since this is CommonJS/Node project
      "import/no-commonjs": "off",
    },
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
]);
