import type { PaginatedResponse } from "@/types/global"
import type { CreateScheduleInput, ScheduleData, ScheduleDataList, UpdateScheduleInput } from "@/types/schedules"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useScheduleLists(params: {
	page: number
	pageSize: number
	sortBy?: string
	sortOrder?: string
}) {
	return useQuery<PaginatedResponse<ScheduleDataList>, Error>({
		queryKey: ["scheduleListQuery", params.page, params.pageSize, params.sortBy, params.sortOrder],
		queryFn: async () => {
			const queryParams = new URLSearchParams({
				page: params.page.toString(),
				pageSize: params.pageSize.toString(),
			})

			if (params.sortBy) {
				queryParams.append("sortBy", params.sortBy)
			}
			if (params.sortOrder) {
				queryParams.append("sortOrder", params.sortOrder)
			}

			const response = await fetch(`/api/schedules?${queryParams.toString()}`)

			if (!response.ok) {
				throw new Error("Failed to fetch schedules")
			}

			return response.json()
		},
	})
}

export function useInfiniteScheduleLists(params: {
	pageSize: number
	sortBy?: string
	sortOrder?: string
}) {
	return useInfiniteQuery({
		queryKey: ["scheduleInfiniteListQuery", params.pageSize, params.sortBy, params.sortOrder],
		queryFn: async ({ pageParam }: { pageParam: number }) => {
			const queryParams = new URLSearchParams({
				page: pageParam.toString(),
				pageSize: params.pageSize.toString(),
			})

			if (params.sortBy) {
				queryParams.append("sortBy", params.sortBy)
			}
			if (params.sortOrder) {
				queryParams.append("sortOrder", params.sortOrder)
			}

			const response = await fetch(`/api/schedules?${queryParams.toString()}`)

			if (!response.ok) {
				throw new Error("Failed to fetch schedules")
			}

			return response.json() as Promise<PaginatedResponse<ScheduleDataList>>
		},
		getNextPageParam: (lastPage, allPages) => {
			// If the last page has less items than pageSize, there are no more pages
			if (lastPage.data.length < params.pageSize) {
				return undefined
			}
			// Return the next page number
			return allPages.length
		},
		initialPageParam: 0,
	})
}

export function useScheduleById(id: number | null) {
	const query = useQuery<ScheduleData>({
		queryKey: ["getCenterById", { id }],
		queryFn: async () => {
			const response = await fetch(`/api/schedules/${id}`)
			if (!response.ok) {
				throw new Error("Failed to fetch schedule")
			}
			return response.json()
		},
		enabled: id != null,
		gcTime: 0,
	})

	return query
}

export function useCreateSchedule() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: CreateScheduleInput) => {
			const response = await fetch("/api/schedules", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to create schedule")
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch schedule lists
			queryClient.invalidateQueries({ queryKey: ["scheduleListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["scheduleInfiniteListQuery"] })
		},
	})
}

export function useUpdateSchedule() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: UpdateScheduleInput) => {
			const { id, ...updateData } = data
			const response = await fetch(`/api/schedules/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updateData),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to update schedule")
			}

			return response.json()
		},
		onSuccess: (_, variables) => {
			// Invalidate and refetch schedule lists
			queryClient.invalidateQueries({ queryKey: ["scheduleListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["scheduleInfiniteListQuery"] })
		},
	})
}

export function useDeleteSchedule() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: number) => {
			const response = await fetch(`/api/schedules/${id}`, {
				method: "DELETE",
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to delete schedule")
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch schedule lists
			queryClient.invalidateQueries({ queryKey: ["scheduleListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["scheduleInfiniteListQuery"] })
		},
	})
}

export function useScheduleMasterLists(excludeScheduleId?: number) {
	return useQuery({
		queryKey: ["scheduleMasterListQuery", excludeScheduleId],
		queryFn: async () => {
			const queryParams = new URLSearchParams()
			if (excludeScheduleId) {
				queryParams.append("excludeScheduleId", excludeScheduleId.toString())
			}
			
			const url = `/api/schedules/master${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error("Failed to fetch schedule master list")
			}
			return response.json()
		},
	})
}
