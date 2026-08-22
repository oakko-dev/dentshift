import type { PaginatedResponse } from "@/types/global"
import type { CreateWorkInput, UpdateWorkInput, WorkData, WorkDataList } from "@/types/works"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useWorkLists(params: {
	page: number
	pageSize: number
	sortBy?: string
	sortOrder?: string
	includeDeposited?: boolean
}) {
	const includeDeposited = params.includeDeposited ?? true

	return useQuery<PaginatedResponse<WorkDataList>, Error>({
		queryKey: ["workListQuery", params.page, params.pageSize, params.sortBy, params.sortOrder, includeDeposited],
		queryFn: async () => {
			const queryParams = new URLSearchParams({
				page: params.page.toString(),
				pageSize: params.pageSize.toString(),
				includeDeposited: includeDeposited.toString(),
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
		},
	})
}
