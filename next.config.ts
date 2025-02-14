import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    outputFileTracingIncludes: {
        "/api/stockfish": ["./stockfish.js"],
    },
};

export default nextConfig;
