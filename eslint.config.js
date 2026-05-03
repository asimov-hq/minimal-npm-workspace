import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".git/**",
      "dist/**",
      "packages/*/dist/**",
      "packages/*/dist-types/**",
      "packages/*/.vite/**",
      "packages/*/.tsbuildinfo",
      "packages/*/.tsbuildinfo.*",
      "node_modules/**",
      "cache/**",
      "public/**",
      "docs/**",
      "scripts/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
  })),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // rules: {
    //   "@typescript-eslint/no-floating-promises": "on",
    // },
  }
);
