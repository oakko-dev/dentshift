import { create } from "zustand"

interface ILoading {
	isLoading: boolean
	updateLoading: (newState: boolean) => void
}

export const useLoadingStore = create<ILoading>(set => ({
	isLoading: false,
	updateLoading: (newState: boolean) => {
		set({ isLoading: newState })
	},
}))
