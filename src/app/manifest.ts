import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LULUS SPP',
    short_name: 'LULUS SPP',
    description: 'Panduan dan komuniti calon SPP Malaysia.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f5fb',
    theme_color: '#262e5f',
    lang: 'ms',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
