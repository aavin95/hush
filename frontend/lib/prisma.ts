/* eslint-disable no-var */ // Disable the no-var rule for this block
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}
/* eslint-enable no-var */ // Re-enable the rule after the block

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
