import { useQuery } from "@tanstack/react-query"

export function useBankMasterLists() {
	return useQuery({
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
