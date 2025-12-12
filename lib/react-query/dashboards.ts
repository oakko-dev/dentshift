import { useQuery } from "@tanstack/react-query"

export interface DashboardStats {
	scheduleCount: number
	dfGuaranteeAmount: number
	waitingDepositCount: number
	placeCount: number
}

export interface ChartDataPoint {
	month: string
	income: number
	expense: number
}

export function useDashboardStats(params: { year: number, month: number }) {
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

export function useDashboardChartData() {
	return useQuery<ChartDataPoint[], Error>({
		queryKey: ["dashboardChartData"],
		queryFn: async () => {
			const response = await fetch("/api/dashboards/chart")

			if (!response.ok) {
				throw new Error("Failed to fetch chart data")
			}

			return response.json()
		},
		staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
	})
}
