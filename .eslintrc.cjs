module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'android', 'node_modules'],
  rules: {
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'warn',
  },
}