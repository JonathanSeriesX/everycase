import next from 'eslint-config-next'

export default [
  next(), // Loads the Next.js core ESLint configuration
  {
    rules: {
      // Add any custom rules here if necessary
      // "no-console": "warn"
    },
  },
]
