export interface PlaceDataList {
	id: number
	name?: string
	branch?: string
	location: string
	tag: string
	start_time?: string
	end_time?: string
	tax_type: TaxType
}

export enum TaxType {
	FULL = "F",
	VAT = "V",
}
