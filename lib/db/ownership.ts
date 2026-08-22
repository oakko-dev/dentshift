import type { DentistDb } from "@/lib/db/with-dentist"
import prisma from "@/lib/prisma"

export async function assertOwnedBank(
	db: DentistDb,
	bankId: bigint,
	userId: string,
): Promise<boolean> {
	const bank = await db.banks.findFirst({
		where: { id: bankId, user_id: userId },
		select: { id: true },
	})
	return bank !== null
}

export async function assertOwnedSchedule(
	db: DentistDb,
	scheduleId: bigint,
	userId: string,
): Promise<boolean> {
	const schedule = await db.schedules.findFirst({
		where: { id: scheduleId, user_id: userId },
		select: { id: true },
	})
	return schedule !== null
}

/** Any owner — bypass RLS so shared place delete stays safe. */
export async function placeHasSchedules(placeId: bigint): Promise<boolean> {
	const count = await prisma.schedules.count({
		where: { place_id: placeId },
	})
	return count > 0
}
