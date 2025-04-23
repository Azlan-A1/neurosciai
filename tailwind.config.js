module.exports = {
  // ... other config
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'rgb(229, 231, 235)', // gray-200
            '--tw-prose-headings': 'rgb(209, 213, 219)', // gray-300
            maxWidth: '100%',
            p: {
              marginTop: '1.5em',
              marginBottom: '1.5em',
            },
            'ul > li': {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            h2: {
              marginTop: '2em',
              marginBottom: '1em',
            },
            h3: {
              marginTop: '1.5em',
              marginBottom: '0.75em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 