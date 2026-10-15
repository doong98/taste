import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_EXPORT === 'true' ? 'export' : undefined,
  /* config options here */
  env: {
    NEXT_PUBLIC_KAKAO_MAP_KEY:
      process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || 'f0b96440318fcb915daa3423308056a6',
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpsbqbmtmkgnldllagol.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ISLAolioW_2bkJrKbxjPZg_fW4GSyII',
    DATA_GO_KR_API_KEY:
      process.env.DATA_GO_KR_API_KEY ||
      '4TYXidfGqaNFclYJrtyhxzzsg942aLp55BqSR8qJ2PfbmhNQjTXok6ph0h2zcmdawslE8xWNRxIWN6Biki3F1g%3D%3D',
  },
  cacheComponents: process.env.NEXT_EXPORT === 'true' ? false : true,
  partialPrefetching: process.env.NEXT_EXPORT === 'true' ? false : true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
