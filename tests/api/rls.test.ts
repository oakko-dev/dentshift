import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"

import { withDentist } from "@/lib/db/with-dentist"
import {
	bypassPrisma,
	cleanupTestUsers,
	createTestUser,
	seedPlace,
} from "../helpers/db"

const integrationSkipReason = process.env.RUN_DENTIST_WALL_INTEGRATION === "1"
	? false
	: "Set RUN_DENTIST_WALL_INTEGRATION=1 after npx prisma migrate deploy"

describe("slice 8: RLS hides other dentist banks on app role", { skip: integrationSkipReason }, () => {
	let userA: { id: string }
	let userB: { id: string }
	let bankAId: bigint
	let bankBId: bigint

	before(async () => {
		await cleanupTestUsers()
		userA = await createTestUser("rls-a")
		userB = await createTestUser("rls-b")

		const bankA = await bypassPrisma.banks.create({
			data: {
				user_id: userA.id,
				account_name: "RLS A",
				account_number: `rls-a-${Date.now()}`,
			},
		})
		bankAId = bankA.id

		const bankB = await bypassPrisma.banks.create({
			data: {
				user_id: userB.id,
				account_name: "RLS B",
				account_number: `rls-b-${Date.now()}`,
			},
		})
		bankBId = bankB.id
	})

	after(async () => {
		await bypassPrisma.banks.deleteMany({
			where: { id: { in: [bankAId, bankBId] } },
		})
		await cleanupTestUsers()
	})

	it("unscoped findMany as dentist B does not return dentist A banks", async () => {
		const banks = await withDentist(userB.id, async (db) => {
			return db.banks.findMany()
		})

		const ids = banks.map(b => b.id)
		assert.ok(ids.includes(bankBId))
		assert.ok(!ids.includes(bankAId))
	})
})

describe("place delete RLS function", { skip: integrationSkipReason }, () => {
	let userA: { id: string }
	let userB: { id: string }
	let placeId: bigint
	let scheduleId: bigint

	before(async () => {
		await cleanupTestUsers()
		userA = await createTestUser("rls-place-a")
		userB = await createTestUser("rls-place-b")
		const place = await seedPlace()
		placeId = place.id

		const schedule = await bypassPrisma.schedules.create({
			data: {
				user_id: userA.id,
				place_id: placeId,
				appointment_date: new Date("2031-01-01"),
				df_guarantee_amount: 1,
				df_percent: 1,
			},
		})
		scheduleId = schedule.id
	})

	after(async () => {
		await bypassPrisma.schedules.deleteMany({ where: { id: scheduleId } })
		await bypassPrisma.places.deleteMany({ where: { id: placeId } })
		await cleanupTestUsers()
	})

	it("dentist B cannot delete place while dentist A has a schedule", async () => {
		await assert.rejects(
			() => withDentist(userB.id, async (db) => {
				return db.places.delete({ where: { id: placeId } })
			}),
		)
	})
})
