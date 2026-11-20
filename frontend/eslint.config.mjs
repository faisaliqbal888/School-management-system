import js from "@eslint/js"
import nextPlugin from "@next/eslint-plugin-next"
import reactHooks from "eslint-plugin-react-hooks"
import tseslint from "typescript-eslint"

/**
 * Flat config for ESLint 9. Next 16 removed `next lint`, so the CLI runs
 * directly: `npm run lint`.
 *
 * Plugins are wired explicitly rather than through `eslint-config-next`, whose
 * CommonJS entry requires `next/dist/compiled/babel/eslint-parser` — a path
 * that does not resolve in this hoisted npm-workspaces layout.
 */
export default [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "public/**"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Config files run in Node, not the browser bundle.
  {
    files: ["*.mjs", "*.cjs", "*.js"],
    languageOptions: {
      globals: { process: "readonly", console: "readonly", module: "writable", require: "readonly", __dirname: "readonly" },
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        Blob: "readonly",
        File: "readonly",
        FormData: "readonly",
        AbortController: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        localStorage: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        React: "readonly",
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      // Payloads are typed at the hook boundary; a few third-party shims still
      // need `any`.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react/no-unescaped-entities": "off",
      // eslint-plugin-react-hooks 7 introduced two React-19 purity rules that
      // flag the pervasive "hydrate local state from fetched data" pattern.
      // Those effects are correct, just not compiler-optimal; tracked as
      // warnings so the codebase can migrate incrementally without the rule
      // being lost.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
]
