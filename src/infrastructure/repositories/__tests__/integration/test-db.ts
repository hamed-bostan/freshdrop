import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

/**
 * A `freshdrop_test` sibling of the dev database, on the same Postgres instance
 * `docker-compose.dev.yml` starts. Created and migrated on first use, then
 * reused — `CREATE DATABASE IF NOT EXISTS` and `prisma migrate deploy` are both
 * idempotent, so every test file importing {@link getTestPrisma} pays the setup
 * cost once per run.
 *
 * Never points at the `freshdrop` database itself: swapping only the path
 * segment of `DATABASE_URL` is what keeps this suite from ever running a
 * migration or a truncate against the database the developer is looking at.
 */

const TEST_DB_NAME = "freshdrop_test";

function baseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL must point at the dev Postgres instance to run integration tests.");
  return url;
}

function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

let ready: Promise<string> | undefined;

/** The test database's connection string, created and migrated on first call. */
export function ensureTestDatabase(): Promise<string> {
  if (!ready) ready = setUp();
  return ready;
}

async function setUp(): Promise<string> {
  const testUrl = withDatabase(baseUrl(), TEST_DB_NAME);
  const maintenance = new PrismaClient({ datasources: { db: { url: withDatabase(baseUrl(), "postgres") } } });
  try {
    const rows = await maintenance.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${TEST_DB_NAME}') AS exists`,
    );
    if (!rows[0]?.exists) {
      await maintenance.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}"`);
    }
  } finally {
    await maintenance.$disconnect();
  }

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "pipe",
  });

  return testUrl;
}

let client: PrismaClient | undefined;

/** A `PrismaClient` connected to the migrated test database, memoized per process. */
export async function getTestPrisma(): Promise<PrismaClient> {
  const url = await ensureTestDatabase();
  if (!client) client = new PrismaClient({ datasources: { db: { url } } });
  return client;
}

/** Delete every row this suite could plausibly have written, in FK-safe order. */
export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.customerSegmentSnapshot.deleteMany(),
    prisma.returnItem.deleteMany(),
    prisma.returnRequest.deleteMany(),
    prisma.orderStatusEvent.deleteMany(),
    prisma.refundLine.deleteMany(),
    prisma.refund.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.driver.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
