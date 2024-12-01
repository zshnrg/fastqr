/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: "/fastqr",
    output: "export",  // <=== enables static exports
    reactStrictMode: true,
};

export default nextConfig;
