import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(import.meta.url);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        // Node.js globals
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // Supabase global
        supabase: "readonly",
      },
    },
    rules: {
      // Security rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-unsafe-optional-chaining": "error",
      
      // Prevent XSS vulnerabilities
      "react/no-danger": "error",
      "react/no-dangerously-set-innerhtml": "error",
      
      // Prevent prototype pollution
      "no-proto": "error",
      "no-extend-native": "error",
      
      // Prevent information disclosure
      "no-console": "warn",
      "no-debugger": "error",
      
      // Input validation
      "no-unsafe-regex": "error",
      
      // Secure coding practices
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "warn",
      
      // Prevent common mistakes
      "eqeqeq": "error",
      "curly": "error",
      "no-multiple-empty-lines": "warn",
      "no-trailing-spaces": "warn",
    },
  },
];

export default eslintConfig;
