import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: [
      '#e8eaf6', // 0 - lightest
      '#c5cae9', // 1
      '#9fa8da', // 2
      '#7986cb', // 3
      '#5c6bc0', // 4
      '#3f51b5', // 5
      '#3949ab', // 6
      '#303f9f', // 7
      '#262e5f', // 8 - PRIMARY
      '#1a237e', // 9 - darkest
    ],
  },
  primaryShade: 8,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
});
