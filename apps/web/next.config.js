const { config } = require('process')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    
    config.module.rules.push({
      test: /\.frag$/,
      // This is the asset module.
      type: 'asset/source',
    });

    config.module.rules.push({
      test: /\.vert$/,
      // This is the asset module.
      type: 'asset/source',
    });

    return config;
  }
}

module.exports = nextConfig
