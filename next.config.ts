import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Without this, Turbopack's root auto-detection walks up to
  // /Users/wainaing (an unrelated npm scratch dir with its own
  // package-lock.json) and warns on every build.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
