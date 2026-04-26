/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deshabilitar la generación estática automática de páginas.
  // La app usa React Context (AppProvider) que solo existe en cliente,
  // por lo que las páginas no pueden pre-renderizarse en build-time.
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
