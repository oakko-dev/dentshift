"use client"

import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import * as React from "react"
import {
	Controller,

	FormProvider,
	useFormContext,
} from "react-hook-form"

import { cn } from "@/utils/helpers"
import { Label } from "./label"

const Form = FormProvider

interface FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)
const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

function FormField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) {
	return (
		<FormFieldContext value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext>
	)
}

function useFormField() {
	const fieldContext = React.use(FormFieldContext)
	const itemContext = React.use(FormItemContext)
	const { getFieldState, formState } = useFormContext()

	const fieldState = getFieldState(fieldContext.name, formState)

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>")
	}

	const { id } = itemContext

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	}
}

interface FormItemContextValue {
	id: string
}

function FormItem({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
	const id = React.useId()

	return (
		<FormItemContext value={{ id }}>
			<div ref={ref} className={cn("flex flex-col space-y-3", className)} {...props} />
		</FormItemContext>
	)
}
FormItem.displayName = "FormItem"

function FormLabel({ ref, className, isRequired, children, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { isRequired?: boolean } & { ref?: React.RefObject<React.ComponentRef<typeof LabelPrimitive.Root> | null> }) {
	const { error, formItemId } = useFormField()

	return (
		<Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props}>
			{children}
			{isRequired && <span className="text-destructive ml-1">*</span>}
		</Label>
	)
}
FormLabel.displayName = "FormLabel"

function FormControl({ ref, ...props }: React.ComponentPropsWithoutRef<typeof Slot> & { ref?: React.RefObject<React.ComponentRef<typeof Slot> | null> }) {
	const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

	return (
		<Slot
			ref={ref}
			id={formItemId}
			aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
			aria-invalid={!!error}
			{...props}
		/>
	)
}
FormControl.displayName = "FormControl"

function FormDescription({ ref, className, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.RefObject<HTMLParagraphElement | null> }) {
	const { formDescriptionId } = useFormField()

	return (
		<p
			ref={ref}
			id={formDescriptionId}
			className={cn("text-base text-muted-foreground", className)}
			{...props}
		/>
	)
}
FormDescription.displayName = "FormDescription"

function FormMessage({ ref, className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.RefObject<HTMLParagraphElement | null> }) {
	const { error, formMessageId } = useFormField()
	const body = error ? String(error?.message ?? "") : children

	if (!body) {
		return null
	}

	return (
		<p
			ref={ref}
			id={formMessageId}
			className={cn("text-sm font-medium text-destructive", className)}
			{...props}
		>
			{body}
		</p>
	)
}
FormMessage.displayName = "FormMessage"

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField }
