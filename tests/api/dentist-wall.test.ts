import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import { NextRequest } from "next/server"

import {
	authHeaders,
	installAuthMock,
	setSessionUser,
} from "../helpers/mock-auth"
import {
	bypassPrisma,
	cleanupTestPlaces,
	cleanupTestUsers,
	createTestUser,
	seedPlace,
} from "../helpers/db"

type RouteHandlers = {
	getBanks: typeof import("@/app/api/banks/route").GET
	postBank: typeof import("@/app/api/banks/route").POST
	getBankById: typeof import("@/app/api/banks/[id]/route").GET
	putBank: typeof import("@/app/api/banks/[id]/route").PUT
	deleteBank: typeof import("@/app/api/banks/[id]/route").DELETE
	getWorks: typeof import("@/app/api/works/route").GET
	postWork: typeof import("@/app/api/works/route").POST
	getWorkById: typeof import("@/app/api/works/[id]/route").GET
	putWork: typeof import("@/app/api/works/[id]/route").PUT
	deleteWork: typeof import("@/app/api/works/[id]/route").DELETE
	getSchedules: typeof import("@/app/api/schedules/route").GET
	postSchedule: typeof import("@/app/api/schedules/route").POST
	getScheduleById: typeof import("@/app/api/schedules/[id]/route").GET
	putSchedule: typeof import("@/app/api/schedules/[id]/route").PUT
	deleteSchedule: typeof import("@/app/api/schedules/[id]/route").DELETE
	getDashboard: typeof import("@/app/api/dashboards/route").GET
	getPlaces: typeof import("@/app/api/places/route").GET
	postPlace: typeof import("@/app/api/places/route").POST
	getPlaceById: typeof import("@/app/api/places/[id]/route").GET
	putPlace: typeof import("@/app/api/places/[id]/route").PUT
	deletePlace: typeof import("@/app/api/places/[id]/route").DELETE
}

const integrationSkipReason = process.env.RUN_DENTIST_WALL_INTEGRATION === "1"
	? false
	: "Set RUN_DENTIST_WALL_INTEGRATION=1 after npx prisma migrate deploy"

describe("dentist data wall API", () => {
	const routes = {} as RouteHandlers

	before(async () => {
		installAuthMock()
		const [
			banksRoute,
			bankIdRoute,
			worksRoute,
			workIdRoute,
			schedulesRoute,
			scheduleIdRoute,
			dashboardRoute,
			placesRoute,
			placeIdRoute,
		] = await Promise.all([
			import("@/app/api/banks/route"),
			import("@/app/api/banks/[id]/route"),
			import("@/app/api/works/route"),
			import("@/app/api/works/[id]/route"),
			import("@/app/api/schedules/route"),
			import("@/app/api/schedules/[id]/route"),
			import("@/app/api/dashboards/route"),
			import("@/app/api/places/route"),
			import("@/app/api/places/[id]/route"),
		])

		routes.getBanks = banksRoute.GET
		routes.postBank = banksRoute.POST
		routes.getBankById = bankIdRoute.GET
		routes.putBank = bankIdRoute.PUT
		routes.deleteBank = bankIdRoute.DELETE
		routes.getWorks = worksRoute.GET
		routes.postWork = worksRoute.POST
		routes.getWorkById = workIdRoute.GET
		routes.putWork = workIdRoute.PUT
		routes.deleteWork = workIdRoute.DELETE
		routes.getSchedules = schedulesRoute.GET
		routes.postSchedule = schedulesRoute.POST
		routes.getScheduleById = scheduleIdRoute.GET
		routes.putSchedule = scheduleIdRoute.PUT
		routes.deleteSchedule = scheduleIdRoute.DELETE
		routes.getDashboard = dashboardRoute.GET
		routes.getPlaces = placesRoute.GET
		routes.postPlace = placesRoute.POST
		routes.getPlaceById = placeIdRoute.GET
		routes.putPlace = placeIdRoute.PUT
		routes.deletePlace = placeIdRoute.DELETE
	})

	describe("slice 1: unauthenticated private routes return 401", () => {
		it("GET /api/banks without session returns 401", async () => {
			setSessionUser(null)
			const response = await routes.getBanks(new NextRequest("http://localhost/api/banks"))
			assert.equal(response.status, 401)
		})

		it("GET /api/dashboards without session returns 401", async () => {
			setSessionUser(null)
			const response = await routes.getDashboard(new NextRequest("http://localhost/api/dashboards"))
			assert.equal(response.status, 401)
		})
	})

	describe("integration slices 2-7", { skip: integrationSkipReason }, () => {
		const placeIds: bigint[] = []
		let userA: { id: string }
		let userB: { id: string }
		let bankAId: number
		let scheduleAId: number
		let workAId: number
		let placeAId: number
		const sharedAccountNumber = "9998887770"

		before(async () => {
			await cleanupTestUsers()
			userA = await createTestUser("a")
			userB = await createTestUser("b")

			const place = await seedPlace()
			placeAId = Number(place.id)
			placeIds.push(place.id)

			const bankA = await bypassPrisma.banks.create({
				data: {
					user_id: userA.id,
					account_name: "A Account",
					account_number: sharedAccountNumber,
				},
			})
			bankAId = Number(bankA.id)

			const scheduleA = await bypassPrisma.schedules.create({
				data: {
					user_id: userA.id,
					place_id: place.id,
					appointment_date: new Date("2030-06-15"),
					df_guarantee_amount: 5000,
					df_percent: 10,
				},
			})
			scheduleAId = Number(scheduleA.id)

			const workA = await bypassPrisma.works.create({
				data: {
					user_id: userA.id,
					schedule_id: scheduleA.id,
					bank_id: bankA.id,
					total_amount: 10000,
					df_amount: 1000,
					forecast_payment_date: new Date("2030-07-01"),
				},
			})
			workAId = Number(workA.id)
		})

		after(async () => {
			await cleanupTestPlaces(placeIds)
			await cleanupTestUsers()
		})

		it("slice 2: dentist B lists never include dentist A ids or dashboard sums", async () => {
			setSessionUser({ id: userB.id })
			const headers = authHeaders()

			const banksRes = await routes.getBanks(new NextRequest("http://localhost/api/banks", { headers }))
			const banksBody = await banksRes.json()
			assert.equal(banksRes.status, 200)
			assert.equal(banksBody.total, 0)
			assert.ok(!banksBody.allIds.includes(bankAId))

			const worksRes = await routes.getWorks(new NextRequest("http://localhost/api/works", { headers }))
			const worksBody = await worksRes.json()
			assert.equal(worksRes.status, 200)
			assert.equal(worksBody.total, 0)
			assert.ok(!worksBody.allIds.includes(workAId))

			const schedulesRes = await routes.getSchedules(new NextRequest("http://localhost/api/schedules", { headers }))
			const schedulesBody = await schedulesRes.json()
			assert.equal(schedulesRes.status, 200)
			assert.equal(schedulesBody.total, 0)
			assert.ok(!schedulesBody.allIds.includes(scheduleAId))

			const dashRes = await routes.getDashboard(
				new NextRequest("http://localhost/api/dashboards?year=2030&month=5", { headers }),
			)
			const dashBody = await dashRes.json()
			assert.equal(dashRes.status, 200)
			assert.equal(dashBody.scheduleCount, 0)
			assert.equal(Number(dashBody.dfGuaranteeAmount), 0)
		})

		it("slice 3: cross-owner GET/PATCH/DELETE by id returns 404", async () => {
			setSessionUser({ id: userB.id })
			const headers = authHeaders()

			assert.equal((await routes.getBankById(new NextRequest(`http://localhost/api/banks/${bankAId}`, { headers }), { params: Promise.resolve({ id: String(bankAId) }) })).status, 404)
			assert.equal((await routes.putBank(new NextRequest(`http://localhost/api/banks/${bankAId}`, { method: "PUT", headers, body: JSON.stringify({ account_name: "Hack", account_number: "1" }) }), { params: Promise.resolve({ id: String(bankAId) }) })).status, 404)
			assert.equal((await routes.deleteBank(new NextRequest(`http://localhost/api/banks/${bankAId}`, { method: "DELETE", headers }), { params: Promise.resolve({ id: String(bankAId) }) })).status, 404)

			assert.equal((await routes.getScheduleById(new NextRequest(`http://localhost/api/schedules/${scheduleAId}`, { headers }), { params: Promise.resolve({ id: String(scheduleAId) }) })).status, 404)
			assert.equal((await routes.putSchedule(new NextRequest(`http://localhost/api/schedules/${scheduleAId}`, { method: "PUT", headers, body: JSON.stringify({ appointment_date: "2030-06-16", place_id: placeAId, df_guarantee_amount: 1, df_percent: 1 }) }), { params: Promise.resolve({ id: String(scheduleAId) }) })).status, 404)
			assert.equal((await routes.deleteSchedule(new NextRequest(`http://localhost/api/schedules/${scheduleAId}`, { method: "DELETE", headers }), { params: Promise.resolve({ id: String(scheduleAId) }) })).status, 404)

			assert.equal((await routes.getWorkById(new NextRequest(`http://localhost/api/works/${workAId}`, { headers }), { params: Promise.resolve({ id: String(workAId) }) })).status, 404)
			assert.equal((await routes.putWork(new NextRequest(`http://localhost/api/works/${workAId}`, { method: "PUT", headers, body: JSON.stringify({ schedule_id: scheduleAId, total_amount: 1, df_amount: 1, bank_id: bankAId, forecast_payment_date: "2030-07-02" }) }), { params: Promise.resolve({ id: String(workAId) }) })).status, 404)
			assert.equal((await routes.deleteWork(new NextRequest(`http://localhost/api/works/${workAId}`, { method: "DELETE", headers }), { params: Promise.resolve({ id: String(workAId) }) })).status, 404)
		})

		it("slice 4: dentist B can duplicate A account number; second copy under B fails", async () => {
			setSessionUser({ id: userB.id })
			const headers = authHeaders()

			const first = await routes.postBank(new NextRequest("http://localhost/api/banks", {
				method: "POST",
				headers,
				body: JSON.stringify({ account_name: "B Account", account_number: sharedAccountNumber }),
			}))
			assert.equal(first.status, 201)

			const duplicate = await routes.postBank(new NextRequest("http://localhost/api/banks", {
				method: "POST",
				headers,
				body: JSON.stringify({ account_name: "B Duplicate", account_number: sharedAccountNumber }),
			}))
			assert.equal(duplicate.status, 409)
		})

		it("slice 5: dentist B cannot create work with A schedule_id or bank_id", async () => {
			setSessionUser({ id: userB.id })
			const headers = authHeaders()

			const badSchedule = await routes.postWork(new NextRequest("http://localhost/api/works", {
				method: "POST",
				headers,
				body: JSON.stringify({
					schedule_id: scheduleAId,
					total_amount: 100,
					df_amount: 10,
					bank_id: bankAId,
					forecast_payment_date: "2030-08-01",
				}),
			}))
			assert.equal(badSchedule.status, 404)

			const bankB = await bypassPrisma.banks.create({
				data: {
					user_id: userB.id,
					account_name: "B Only",
					account_number: `b-only-${Date.now()}`,
				},
			})

			const scheduleB = await bypassPrisma.schedules.create({
				data: {
					user_id: userB.id,
					place_id: BigInt(placeAId),
					appointment_date: new Date("2030-06-20"),
					df_guarantee_amount: 100,
					df_percent: 10,
				},
			})

			const badBank = await routes.postWork(new NextRequest("http://localhost/api/works", {
				method: "POST",
				headers,
				body: JSON.stringify({
					schedule_id: Number(scheduleB.id),
					total_amount: 100,
					df_amount: 10,
					bank_id: bankAId,
					forecast_payment_date: "2030-08-01",
				}),
			}))
			assert.equal(badBank.status, 404)

			await bypassPrisma.works.deleteMany({ where: { user_id: userB.id } })
			await bypassPrisma.schedules.deleteMany({ where: { id: scheduleB.id } })
			await bypassPrisma.banks.deleteMany({ where: { id: bankB.id } })
		})

		it("slice 6: shared place — B can GET/PATCH A place; B cannot DELETE while A has schedule", async () => {
			setSessionUser({ id: userB.id })
			const headers = authHeaders()

			const getRes = await routes.getPlaceById(
				new NextRequest(`http://localhost/api/places/${placeAId}`, { headers }),
				{ params: Promise.resolve({ id: String(placeAId) }) },
			)
			assert.equal(getRes.status, 200)

			const patchRes = await routes.putPlace(
				new NextRequest(`http://localhost/api/places/${placeAId}`, {
					method: "PUT",
					headers,
					body: JSON.stringify({
						name: "Edited By B",
						branch: "Main",
						start_time: "1970-01-01T09:00:00.000Z",
						end_time: "1970-01-01T17:00:00.000Z",
					}),
				}),
				{ params: Promise.resolve({ id: String(placeAId) }) },
			)
			assert.equal(patchRes.status, 200)

			setSessionUser({ id: userA.id })
			const aHeaders = authHeaders()
			const aView = await routes.getPlaceById(
				new NextRequest(`http://localhost/api/places/${placeAId}`, { headers: aHeaders }),
				{ params: Promise.resolve({ id: String(placeAId) }) },
			)
			const aBody = await aView.json()
			assert.equal(aBody.name, "Edited By B")

			setSessionUser({ id: userB.id })
			const deleteBlocked = await routes.deletePlace(
				new NextRequest(`http://localhost/api/places/${placeAId}`, { method: "DELETE", headers }),
				{ params: Promise.resolve({ id: String(placeAId) }) },
			)
			assert.equal(deleteBlocked.status, 409)

			const unusedPlaceRes = await routes.postPlace(new NextRequest("http://localhost/api/places", {
				method: "POST",
				headers,
				body: JSON.stringify({
					name: "Unused",
					branch: "Solo",
					start_time: "1970-01-01T09:00:00.000Z",
					end_time: "1970-01-01T17:00:00.000Z",
				}),
			}))
			const unusedBody = await unusedPlaceRes.json()
			placeIds.push(BigInt(unusedBody.id))

			const deleteOk = await routes.deletePlace(
				new NextRequest(`http://localhost/api/places/${unusedBody.id}`, { method: "DELETE", headers }),
				{ params: Promise.resolve({ id: String(unusedBody.id) }) },
			)
			assert.equal(deleteOk.status, 200)
			placeIds.pop()
		})

		it("slice 7: same place+date schedules are private per dentist", async () => {
			const sharedDate = "2030-09-01"
			setSessionUser({ id: userB.id })
			const bHeaders = authHeaders()

			const bScheduleRes = await routes.postSchedule(new NextRequest("http://localhost/api/schedules", {
				method: "POST",
				headers: bHeaders,
				body: JSON.stringify({
					appointment_date: sharedDate,
					place_id: placeAId,
					df_guarantee_amount: 200,
					df_percent: 5,
				}),
			}))
			const bScheduleBody = await bScheduleRes.json()
			assert.equal(bScheduleRes.status, 201)

			const bList = await routes.getSchedules(new NextRequest("http://localhost/api/schedules", { headers: bHeaders }))
			const bListBody = await bList.json()
			assert.ok(bListBody.allIds.includes(bScheduleBody.id))
			assert.ok(!bListBody.allIds.includes(scheduleAId))

			setSessionUser({ id: userA.id })
			const aHeaders = authHeaders()
			const aList = await routes.getSchedules(new NextRequest("http://localhost/api/schedules", { headers: aHeaders }))
			const aListBody = await aList.json()
			assert.ok(aListBody.allIds.includes(scheduleAId))
			assert.ok(!aListBody.allIds.includes(bScheduleBody.id))

			await bypassPrisma.schedules.delete({ where: { id: BigInt(bScheduleBody.id) } })
		})
	})
})
