import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { MasterSelectProps } from "@/types/global"

export async function GET() {
	try {
		const banks = await prisma.banks.findMany({
			orderBy: {
				account_name: "asc",
			},
		})
		return NextResponse.json(banks.map((bank: any) => ({
			value: Number(bank.id),
			label: `${bank.account_name} - ${bank.account_number}`,
		})) as MasterSelectProps[])
	}
	catch (error) {
		console.error("Error fetching banks:", error)
		return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 })
	}
}
