import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [{
        key: 'Cross-Origin-Embedder-Policy',
        value: 'require-corp',
      }, {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
      }],
    }]
  },
  webpack(config, context) {
    config.module.rules.push({
      test: /\.(vs|fs)$/i,
      type: 'asset/source',
    })
    return config
  }
}

export default nextConfig
