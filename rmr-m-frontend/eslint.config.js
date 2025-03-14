module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 12, // Equivalent à ES2021
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-hooks', 'jsx-a11y', 'import'],
  rules: {
    'react/prop-types': 'off', // Si vous n'utilisez pas les PropTypes
    'react/react-in-jsx-scope': 'off', // React n'a plus besoin d'être importé en 17+
    'jsx-a11y/anchor-is-valid': 'off', // Si vous utilisez des liens avec # ou sans href valide
    'import/no-unresolved': 'error', // S'assurer que toutes les importations sont résolues
    'no-console': 'warn', // Avertir sur les console.log
    'no-unused-vars': 'warn', // Avertir sur les variables inutilisées
    'react-hooks/exhaustive-deps': 'warn', // Avertir sur les dépendances manquantes dans useEffect
  },
};