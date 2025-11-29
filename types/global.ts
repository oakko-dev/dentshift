export interface PaginatedResponse<T> {
	data: T[]
	total: number
	allIds: number[]
}

export interface MasterSelectProps {
	value: string | number
	label: string
}

export function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
	return {
		data: [],
		total: 0,
		allIds: [],
	}
}

export interface ModalStateProps {
	state: boolean
	id: number | null
}

export interface UploadResponse {
	name: string
	src: string
}
