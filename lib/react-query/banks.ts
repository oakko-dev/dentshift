import type { MasterSelectProps, PaginatedResponse } from "@/types/global"
import type { BankData, BankDataList, CreateBankInput, UpdateBankInput } from "@/types/banks"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useBankLists(params: {
	page: number
	pageSize: number
}) {
	return useQuery<PaginatedResponse<BankDataList>, Error>({
		queryKey: ["bankListQuery", params.page, params.pageSize],
		queryFn: async () => {
			const response = await fetch(
				`/api/banks?page=${params.page}&pageSize=${params.pageSize}`,
			)

			if (!response.ok) {
				throw new Error("Failed to fetch banks")
			}

			return response.json()
		},
	})
}

export function useBankMasterLists() {
	return useQuery<MasterSelectProps[], Error>({
		queryKey: ["bankMasterListQuery"],
		queryFn: async () => {
			const response = await fetch("/api/banks/master")
			if (!response.ok) {
				throw new Error("Failed to fetch bank master list")
			}
			return response.json()
		},
	})
}

export function useBankById(id: number | null) {
	const query = useQuery<BankData>({
		queryKey: ["getBankById", { id }],
		queryFn: async () => {
			const response = await fetch(`/api/banks/${id}`)
			if (!response.ok) {
				throw new Error("Failed to fetch bank")
			}
			return response.json()
		},
		enabled: id != null,
		gcTime: 0,
	})

	return query
}

export function useCreateBank() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: CreateBankInput) => {
			const response = await fetch("/api/banks", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to create bank")
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch bank lists
			queryClient.invalidateQueries({ queryKey: ["bankListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["bankMasterListQuery"] })
		},
	})
}

export function useUpdateBank() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: UpdateBankInput) => {
			const { id, ...updateData } = data
			const response = await fetch(`/api/banks/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updateData),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to update bank")
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch bank lists
			queryClient.invalidateQueries({ queryKey: ["bankListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["bankMasterListQuery"] })
		},
	})
}

export function useDeleteBank() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: number) => {
			const response = await fetch(`/api/banks/${id}`, {
				method: "DELETE",
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to delete bank")
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch bank lists
			queryClient.invalidateQueries({ queryKey: ["bankListQuery"] })
			queryClient.invalidateQueries({ queryKey: ["bankMasterListQuery"] })
		},
	})
}
