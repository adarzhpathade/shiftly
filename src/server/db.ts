import "server-only";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prismaGlobal: PrismaClient | undefined;
};

export const db: PrismaClient = globalForPrisma.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = db;
}
