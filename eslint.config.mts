import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import pluginJest from "eslint-plugin-jest";

export default [
    {
        files: ["**/*.ts"],

        languageOptions: {
            parser: tsparser,
            sourceType: "module",
        },

        plugins: {
            "@typescript-eslint": tseslint,
            prettier: prettierPlugin,
        },

        rules: {
            ...tseslint.configs.recommended.rules,
            ...prettierConfig.rules,
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "off",
            "no-console": "warn",
            semi: ["error", "always"],
            quotes: ["error", "double"],
            "prettier/prettier": "error",
        },
    },
    {
        // update this to match your test files
        files: ["**/*.spec.js", "**/*.test.js"],
        plugins: { jest: pluginJest },
        languageOptions: {
            globals: pluginJest.environments.globals.globals,
        },
        rules: {
            "jest/no-disabled-tests": "warn",
            "jest/no-focused-tests": "error",
            "jest/no-identical-title": "error",
            "jest/prefer-to-have-length": "warn",
            "jest/valid-expect": "error",
        },
    },
];
