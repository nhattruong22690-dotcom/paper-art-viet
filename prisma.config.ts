import { defineConfig } from "prisma/config";
import "dotenv/config"; // Đảm bảo nạp biến môi trường từ .env

/**
 * Prisma 7 Configuration (Supabase optimization)
 * Bản backup ổn định nhất khi dùng npx prisma db push
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Dùng process.env của Node.js sau khi đã import dotenv
    url: process.env.DIRECT_URL,
  },
});
