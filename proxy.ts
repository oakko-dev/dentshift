import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { NextResponse } from "next/server"

const publicPaths = ["/login", "/api/auth"]

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl
	const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
	const sessionCookie = getSessionCookie(request)

	if (!isPublicPath && !sessionCookie) {
		const loginUrl = new URL("/login", request.url)
		return NextResponse.redirect(loginUrl)
	}

	if (pathname === "/login" && sessionCookie) {
		const homeUrl = new URL("/", request.url)
		return NextResponse.redirect(homeUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
	],
}
