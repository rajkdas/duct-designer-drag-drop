// ---------------------------------------------------------------------------
// Table-creation statements generated from prisma/schema.prisma
// (npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script).
// Used by ensureTables() in src/lib/seed.ts so the app can bootstrap its own
// database on first use - e.g. on a fresh Vercel deployment with an empty /tmp.
// ---------------------------------------------------------------------------

export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "diameterMm" INTEGER NOT NULL DEFAULT 200,
    "diameter2Mm" INTEGER,
    "lengthMm" INTEGER,
    "angleDeg" REAL,
    "branchAngleDeg" REAL,
    "price" REAL NOT NULL,
    "stock" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "wooId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
)`,
  `CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT,
    "monthlyFee" REAL NOT NULL DEFAULT 49,
    "brandColor" TEXT NOT NULL DEFAULT '#ea580c',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
)`,
  `CREATE TABLE "Design" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled layout',
    "customer" TEXT,
    "dealerSlug" TEXT,
    "dealerName" TEXT,
    "data" TEXT NOT NULL,
    "totalNet" REAL NOT NULL DEFAULT 0,
    "totalGross" REAL NOT NULL DEFAULT 0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
)`,
  `CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designId" TEXT,
    "dealerSlug" TEXT,
    "dealerName" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "totalGross" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteRequest_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design" ("id") ON DELETE SET NULL ON UPDATE CASCADE
)`,
  `CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "shopName" TEXT NOT NULL DEFAULT 'BIMA Absaugtechnik',
    "tagline" TEXT NOT NULL DEFAULT 'Dust extraction systems for professional workshops',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "vatRate" REAL NOT NULL DEFAULT 19,
    "brandColor" TEXT NOT NULL DEFAULT '#ea580c',
    "contactEmail" TEXT NOT NULL DEFAULT 'sales@example.com',
    "updatedAt" DATETIME NOT NULL
)`,
  `CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku")`,
  `CREATE UNIQUE INDEX "Dealer_slug_key" ON "Dealer"("slug")`,
  `CREATE UNIQUE INDEX "Design_shareId_key" ON "Design"("shareId")`,
]
