/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ponto-do-bicho.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: 'pontodobicho.com',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Melhorar cache busting para evitar ChunkLoadError
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    }
    
    // Melhorar tratamento de erros de chunk
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          default: false,
          vendors: false,
          ...config.optimization.splitChunks.cacheGroups,
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig
