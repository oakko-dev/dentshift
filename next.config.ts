// next.config.ts
export default {
	allowedDevOrigins: ["dev-next.itsoak.me", "dentshift.vercel.app"],
	images: {
		remotePatterns: [new URL("https://profile.line-scdn.net/**"), new URL("https://dev-next.itsoak.me/**"), new URL("https://dentshift.vercel.app/**")],
	},
}
