import { useQuery } from "@tanstack/react-query"

export interface DashboardStats {
	scheduleCount: number
	dfGuaranteeAmount: number
	waitingDepositCount: number
	placeCount: number
}

export function useDashboardStats(params: { year: number; month: number }) {
	return useQuery<DashboardStats, Error>({
		queryKey: ["dashboardStats", params.year, params.month],
		queryFn: async () => {
			const queryParams = new URLSearchParams({
				year: params.year.toString(),
				month: params.month.toString(),
			})

			const response = await fetch(`/api/dashboards?${queryParams.toString()}`)

			if (!response.ok) {
				throw new Error("Failed to fetch dashboard stats")
			}

			return response.json()
		},
	})
}

