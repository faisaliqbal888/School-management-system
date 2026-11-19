"use client"

import { Toaster as SonnerToaster, type ToasterProps } from "sonner"

export function Toaster(props: ToasterProps) {
  return <SonnerToaster theme="light" toastOptions={{ classNames: { toast: "font-sans" } }} {...props} />
}

export { toast } from "sonner"
