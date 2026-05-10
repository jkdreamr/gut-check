-- CreateTable
CREATE TABLE "ProposalLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted" BOOLEAN,
    "acceptedAt" TIMESTAMP(3),
    "newnalCircleId" TEXT,
    "newnalResponse" TEXT,

    CONSTRAINT "ProposalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "ScenarioConfig_pkey" PRIMARY KEY ("id")
);
