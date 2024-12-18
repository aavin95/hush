import { PrismaClient } from "@prisma/client";

declare global {
  namespace NodeJS {
    interface Global {
      prisma: PrismaClient | undefined;
    }
    interface Session {
      user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        token?: string;
      };
    }
  }
}

export {};
