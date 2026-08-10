/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  experimental:{
    instrumentationHook: true,
  },
  
};

module.exports = nextConfig;