import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],    
  },
  allowedDevOrigins:[
    "magnisonant-scoreless-terrance.ngrok-free.dev"
  ]
};

export default nextConfig;
