"use client"

import * as React from "react"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Minimal shadcn-style form primitives over react-hook-form.
 *
 * Kept small on purpose: the project has no Radix `Form` primitive, so this
 * wraps `FormProvider` + `Controller` and renders labels and error text.
 */

const Form = FormProvider

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const { getFieldState, formState } = useFormContext()

  if (!fieldContext) throw new Error("useFormField must be used inside <FormField>")

  const state = getFieldState(fieldContext.name as FieldPath<FieldValues>, formState)
  return { name: fieldContext.name as string, ...state }
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="form-item" className={cn("space-y-1.5", className)} {...props} />
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, name } = useFormField()
  return (
    <Label
      data-slot="form-label"
      htmlFor={name}
      className={cn(error && "text-destructive", className)}
      {...props}
    />
  )
}

function FormControl({ className, ...props }: React.ComponentProps<"div">) {
  const { error } = useFormField()
  return (
    <div
      data-slot="form-control"
      aria-invalid={error ? true : undefined}
      className={cn("aria-invalid:[&_input]:border-destructive", className)}
      {...props}
    />
  )
}

function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const { error } = useFormField()
  const body = error ? String(error.message ?? "") : children

  if (!body) return null

  return (
    <p data-slot="form-message" className={cn("text-xs text-destructive", className)} {...props}>
      {body}
    </p>
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  useFormField,
  Form,
  FormProvider,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
}
