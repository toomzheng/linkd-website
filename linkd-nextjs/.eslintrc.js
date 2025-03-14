module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // You can relax some rules if they're causing issues
    '@typescript-eslint/no-explicit-any': 'warn', // Changed from error to warning
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'react/no-unescaped-entities': 'warn'
  }
} 