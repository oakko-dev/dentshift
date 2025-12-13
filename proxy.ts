import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "./auth"

// List of paths that don't require authentication
const publicPaths = ["/login", "/api/auth"]

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Check if the path is public
	const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

	// Get the session cookie
	const sessionCookie = await auth.api.getSession({ headers: request.headers })

	// If trying to access a protected route without a session
	if (!isPublicPath && !sessionCookie) {
		const loginUrl = new URL("/login", request.url)
		return NextResponse.redirect(loginUrl)
	}

	// If logged in and trying to access login page, redirect to home
	if (pathname === "/login" && sessionCookie) {
		const homeUrl = new URL("/", request.url)
		return NextResponse.redirect(homeUrl)
	}

	return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
	],
}
