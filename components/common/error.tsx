function ErrorComponent({ statusCode }: any) {
	return (
		<div className="flex min-h-[250px] w-full items-center justify-center">
			<p>{statusCode ? `An error ${statusCode} occurred on server` : "An error occurred on client"}</p>
		</div>
	)
}

export default ErrorComponent
