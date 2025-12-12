export interface PlaceDataList {
	id: number
	name?: string
	branch?: string
	location: string
	tag: string
	start_time?: string
	end_time?: string
	tax_type: TaxType
	remark?: string
}

export interface PlaceData {
	id: number
	name: string
	branch: string
	location: string
	tag: string
	start_time: string
	end_time: string
	tax_type: TaxType
	remark: string
}

export interface CreatePlaceInput {
	name: string
	branch: string
	location?: string
	tag?: string
	start_time: string
	end_time: string
	tax_type: TaxType
	remark?: string
}

export interface UpdatePlaceInput extends CreatePlaceInput {
	id: number
}

export enum TaxType {
	FULL = "F",
	VAT = "V",
}
