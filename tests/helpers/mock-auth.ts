import type { DentistSession } from "@/lib/api/require-dentist"
import { setTestSessionResolver } from "@/lib/api/require-dentist"

let currentUser: DentistSession | null = null

export function installAuthMock(): void {
	setTestSessionResolver(async () => currentUser)
}

export function setSessionUser(user: { id: string } | null): void {
	currentUser = user ? { user } : null
}

export function authHeaders(): Headers {
	return new Headers({ cookie: "session=test" })
}
