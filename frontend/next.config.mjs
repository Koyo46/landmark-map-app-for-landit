/** @type {import('next').NextConfig} */
const nextConfig = {
  // Leaflet + react-leaflet が開発モードの StrictMode 二重マウントで
  // 「Map container is already initialized」エラーを出すため、無効化
  reactStrictMode: false,
};

export default nextConfig;

