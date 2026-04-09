import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "packages/*/dist/**",
      "packages/*/dist-types/**",
      "packages/*/.vite/**",
      "node_modules/**",
      "cache/**",
      "public/**",
      "docs/**",
      "scripts/**",
      "shell/**",
      "src/core/solver/**",
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
        project: [
          "./packages/cli/tsconfig.eslint.json",
          "./packages/server/tsconfig.eslint.json",
          "./packages/shared/tsconfig.eslint.json",
          "./packages/web/tsconfig.eslint.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // rules: {
    //   "@typescript-eslint/no-floating-promises": "on",
    // },
  }
);
