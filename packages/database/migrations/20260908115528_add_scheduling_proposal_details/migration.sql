-- AlterTable
ALTER TABLE "SchedulingProposal" ADD COLUMN     "score" DOUBLE PRECISION,
ADD COLUMN     "scoreBreakdown" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "scoredAt" TIMESTAMP(3),
ADD COLUMN     "selectionReasons" JSONB NOT NULL DEFAULT '[]';
