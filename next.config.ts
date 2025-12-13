// next.config.ts
import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
	swSrc: "app/sw.ts", // Where we will write our service worker
	swDest: "public/sw.js", // Where Next.js will output it
	// disable: process.env.NODE_ENV === "development",
})

export default withSerwist({
	// Your existing Next.js config
	allowedDevOrigins: ["dev-next.itsoak.me", "dentshift.vercel.app"],
	images: {
		remotePatterns: [new URL("https://profile.line-scdn.net/**"), new URL("https://dev-next.itsoak.me/**"), new URL("https://dentshift.vercel.app/**")],
	},
})
