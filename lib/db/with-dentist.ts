import type { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type DentistDb = Prisma.TransactionClient

function assertDentistId(userId: string): void {
	if (!UUID_RE.test(userId)) {
		throw new Error("Invalid dentist id")
	}
}

async function applyDentistContext(tx: DentistDb, userId: string): Promise<void> {
	await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`
	try {
		await tx.$executeRawUnsafe("SET LOCAL ROLE dentshift_app")
	}
	catch {
		// Role may not exist until migration runs; app-level filters still apply.
	}
}

export async function withDentist<T>(
	userId: string,
	fn: (db: DentistDb) => Promise<T>,
): Promise<T> {
	assertDentistId(userId)

	return prisma.$transaction(async (tx) => {
		await applyDentistContext(tx, userId)
		return fn(tx)
	})
}

/** Bypass RLS — tests and migrations only. */
export async function withBypassDb<T>(
	fn: (db: typeof prisma) => Promise<T>,
): Promise<T> {
	return fn(prisma)
}
