import type { PaginatedResponse } from "@/types/global"
import type { CreateWorkInput, UpdateWorkInput, WorkData, WorkDataList } from "@/types/works"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useWorkLists(params: {
	page: number
	pageSize: number
	sortBy?: string
	sortOrder?: string
}) {
	return useQuery<PaginatedResponse<WorkDataList>, Error>({
		queryKey: ["workListQuery", params.page, params.pageSize, params.sortBy, params.sortOrder],
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

			const response = await fetch(`/api/works?${queryParams.toString()}`)

			if (!response.ok) {
				throw new Error("Failed to fetch works")
			}

			return response.json()
		},
	})
}

export function useInfiniteWorkLists(params: {
	pageSize: number
	sortBy?: string
	sortOrder?: string
}) {
	return useInfiniteQuery({
		queryKey: ["workInfiniteListQuery", params.pageSize, params.sortBy, params.sortOrder],
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

			const response = await fetch(`/api/works?${queryParams.toString()}`)

			if (!response.ok) {
				throw new Error("Failed to fetch works")
			}

			return response.json() as Promise<PaginatedResponse<WorkDataList>>
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

export function useWorkById(id: number | null) {
	const query = useQuery<WorkData>({
		queryKey: ["getWorkById", { id }],
		queryFn: async () => {
			const response = await fetch(`/api/works/${id}`)
			if (!response.ok) {
				throw new Error("Failed to fetch work")
			}
			return response.json()
		},
		enabled: id != null,
		gcTime: 0,
	})

	return query
}

export function useCreateWork() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: CreateWorkInput) => {
			const response = await fetch("/api/works", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to create work")
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch work lists
			queryClient.invalidateQueries({ queryKey: ["workListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["workInfiniteListQuery"] })
		},
	})
}

export function useUpdateWork() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: UpdateWorkInput) => {
			const { id, ...updateData } = data
			const response = await fetch(`/api/works/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updateData),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to update work")
			}

			return response.json()
		},
		onSuccess: (_, variables) => {
			// Invalidate and refetch work lists
			queryClient.invalidateQueries({ queryKey: ["workListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["workInfiniteListQuery"] })
		},
	})
}

export function useDeleteWork() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: number) => {
			const response = await fetch(`/api/works/${id}`, {
				method: "DELETE",
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to delete work")
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch work lists
			queryClient.invalidateQueries({ queryKey: ["workListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["workInfiniteListQuery"] })
		},
	})
}
