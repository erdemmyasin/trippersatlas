/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Telefon / başka cihazdan http://<LAN-IP>:3000 ile gelince HMR/font için */
  allowedDevOrigins: ['192.168.1.2'],
};

export default nextConfig;
