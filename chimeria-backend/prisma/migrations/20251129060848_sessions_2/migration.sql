/*
  Warnings:

  - Added the required column `exp` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "exp" INTEGER NOT NULL,
ADD COLUMN     "remember" BOOLEAN NOT NULL DEFAULT false;
