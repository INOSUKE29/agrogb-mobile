import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      "unused-imports": unusedImports,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "error", // Vacina Absoluta contra loops infinitos e vazamentos
      "@typescript-eslint/no-shadow": "error", // Vacina contra sombreamento letal (ex: toast vs toast)
      "@typescript-eslint/no-explicit-any": "error", // Vacina contra tipagem fraca
      "@typescript-eslint/no-unused-vars": "off", // Desligado para dar lugar ao unused-imports
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
      ],
      "prefer-const": "error" // Vacina de imutabilidade
    }
  },
])
