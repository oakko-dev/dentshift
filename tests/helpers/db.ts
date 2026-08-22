import prisma from "@/lib/prisma"

const TEST_EMAIL_PREFIX = "dentist-wall-test-"

export function hasDatabase(): boolean {
	return Boolean(process.env.DATABASE_URL || process.env.TEST_DATABASE_URL)
}

let schemaMigrated: boolean | null = null

export async function isSchemaMigrated(): Promise<boolean> {
	if (schemaMigrated !== null) {
		return schemaMigrated
	}
	try {
		await prisma.$queryRaw`SELECT user_id FROM banks LIMIT 0`
		await prisma.$queryRaw`SELECT user_id FROM works LIMIT 0`
		await prisma.$queryRaw`SELECT 1 FROM pg_roles WHERE rolname = 'dentshift_app'`
		schemaMigrated = true
	}
	catch {
		schemaMigrated = false
	}
	return schemaMigrated
}

export function testDatabaseUrl(): string | undefined {
	return process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
}

export async function createTestUser(suffix: string) {
	const email = `${TEST_EMAIL_PREFIX}${suffix}-${Date.now()}@example.com`
	return prisma.users.create({
		data: {
			email,
			emailVerified: true,
		},
	})
}

export async function cleanupTestUsers(): Promise<void> {
	if (!await isSchemaMigrated()) {
		await prisma.users.deleteMany({
			where: { email: { startsWith: TEST_EMAIL_PREFIX } },
		})
		return
	}

	const users = await prisma.users.findMany({
		where: { email: { startsWith: TEST_EMAIL_PREFIX } },
		select: { id: true },
	})

	for (const user of users) {
		await prisma.works.deleteMany({ where: { user_id: user.id } })
		await prisma.schedules.deleteMany({ where: { user_id: user.id } })
		await prisma.banks.deleteMany({ where: { user_id: user.id } })
	}

	await prisma.users.deleteMany({
		where: { email: { startsWith: TEST_EMAIL_PREFIX } },
	})
}

export async function seedPlace() {
	return prisma.places.create({
		data: {
			name: `Test Clinic ${Date.now()}`,
			branch: "Main",
			start_time: new Date("1970-01-01T09:00:00.000Z"),
			end_time: new Date("1970-01-01T17:00:00.000Z"),
		},
	})
}

export async function cleanupTestPlaces(placeIds: bigint[]): Promise<void> {
	if (placeIds.length === 0) {
		return
	}
	await prisma.places.deleteMany({
		where: { id: { in: placeIds } },
	})
}

export { prisma as bypassPrisma }
