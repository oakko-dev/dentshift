import type { MasterSelectProps, PaginatedResponse } from "@/types/global"
import type { PlaceDataList } from "@/types/places"

import { useQuery } from "@tanstack/react-query"

export function usePlaceLists(params: {
	page: number
	pageSize: number
}) {
	return useQuery<PaginatedResponse<PlaceDataList>, Error>({
		queryKey: ["placeListQuery", params.page, params.pageSize],
		queryFn: async () => {
			const response = await fetch(
				`/api/places?page=${params.page}&pageSize=${params.pageSize}`,
			)

			if (!response.ok) {
				throw new Error("Failed cto fetch places")
			}

			return response.json()
		},
	})
}

export function usePlaceMasterLists() {
	return useQuery<MasterSelectProps[], Error>({
		queryKey: ["placeMasterListQuery"],
		queryFn: async () => {
			const response = await fetch("/api/places/master")
			if (!response.ok) {
				throw new Error("Failed to fetch places")
			}
			const data = await response.json()
			return data
		},
	})
}
