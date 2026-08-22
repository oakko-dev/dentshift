import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

export type DentistSession = {
	user: {
		id: string
	}
}

type SessionResolver = (
	request: NextRequest,
) => Promise<DentistSession | null>

let testSessionResolver: SessionResolver | null = null

/** HTTP test seam — overrides Better Auth session lookup. */
export function setTestSessionResolver(resolver: SessionResolver | null): void {
	testSessionResolver = resolver
}

export async function requireDentist(
	request: NextRequest,
): Promise<
	| { session: DentistSession, error?: never }
	| { session?: never, error: NextResponse }
> {
	const session = testSessionResolver
		? await testSessionResolver(request)
		: await auth.api.getSession({
				headers: request.headers,
			})

	if (!session?.user?.id) {
		return {
			error: NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			),
		}
	}

	return { session: session as DentistSession }
}
