ALTER TABLE "Team"
ADD COLUMN "slug" TEXT,
ADD COLUMN "shortId" TEXT;

UPDATE "Team"
SET
  "slug" = COALESCE(
    NULLIF(
      LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g'),
          '(^-|-$)',
          '',
          'g'
        )
      ),
      ''
    ),
    'team'
  ),
  "shortId" = LOWER(SUBSTRING(MD5("id") FROM 1 FOR 8))
WHERE "slug" IS NULL
   OR "shortId" IS NULL;

ALTER TABLE "Team"
ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "shortId" SET NOT NULL;

CREATE UNIQUE INDEX "Team_shortId_key" ON "Team"("shortId");
CREATE INDEX "Team_slug_idx" ON "Team"("slug");
