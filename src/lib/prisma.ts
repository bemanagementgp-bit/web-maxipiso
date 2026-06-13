import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const authToken   = process.env.DATABASE_AUTH_TOKEN?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma");
  }

  const libsqlClient = createClient({ url: databaseUrl, authToken });
  const adapter = new PrismaLibSQL(libsqlClient);

  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
}) as PrismaClient;
