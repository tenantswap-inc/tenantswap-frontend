import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  crossOrigin: "anonymous",
  images: {
    qualities: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10],
  }
};

export default nextConfig;
