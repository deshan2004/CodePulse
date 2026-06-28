import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    position: "top-right",
  },
  // Next.js v15 වල allowedDevOrigins කෙලින්ම මෙතනටයි එන්නේ
  experimental: {
    // මෙතන හිස්ව තියන්න හෝ experimental options අවශ්‍ය නැත්නම් අයින් කරන්න පුළුවන්
  }
};

// Next.js 15 වල network එකෙන් access කරන්න කෙලින්ම npm run dev එකට `--experimental-https` හෝ host එක දීම තමයි කරන්නේ. 
// දැනට මේ config එක clean කරලා සේව් කරමු.
export default nextConfig;