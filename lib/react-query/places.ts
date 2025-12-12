import type { MasterSelectProps, PaginatedResponse } from "@/types/global"
import type { CreatePlaceInput, PlaceData, PlaceDataList, UpdatePlaceInput } from "@/types/places"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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
				throw new Error("Failed to fetch places")
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

export function usePlaceById(id: number | null) {
	const query = useQuery<PlaceData>({
		queryKey: ["getPlaceById", { id }],
		queryFn: async () => {
			const response = await fetch(`/api/places/${id}`)
			if (!response.ok) {
				throw new Error("Failed to fetch place")
			}
			return response.json()
		},
		enabled: id != null,
		gcTime: 0,
	})

	return query
}

export function useCreatePlace() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: CreatePlaceInput) => {
			const response = await fetch("/api/places", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to create place")
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch place lists
			queryClient.invalidateQueries({ queryKey: ["placeListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["placeMasterListQuery"] })
		},
	})
}

export function useUpdatePlace() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: UpdatePlaceInput) => {
			const { id, ...updateData } = data
			const response = await fetch(`/api/places/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updateData),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to update place")
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch place lists
			queryClient.invalidateQueries({ queryKey: ["placeListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["placeMasterListQuery"] })
		},
	})
}

export function useDeletePlace() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: number) => {
			const response = await fetch(`/api/places/${id}`, {
				method: "DELETE",
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to delete place")
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch place lists
			queryClient.invalidateQueries({ queryKey: ["placeListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["placeMasterListQuery"] })
		},
	})
}
