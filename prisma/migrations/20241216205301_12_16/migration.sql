-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Video" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
