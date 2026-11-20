"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

/**
 * Small shared store for the mobile drawer.
 *
 * The sidebar owns the panel (so it can keep its own styling and role links);
 * the header only needs to know how to open it. Using a tiny event bus keeps
 * both components decoupled without adding a state library.
 */
const OPEN_EVENT = "sms:mobile-nav-open"

export function openMobileNav() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

/** Listens for `openMobileNav()` calls. Returns the open state + a closer. */
export function useMobileNav(closeOnRouteChange = true) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, handler)
    return () => window.removeEventListener(OPEN_EVENT, handler)
  }, [])

  useEffect(() => {
    if (closeOnRouteChange) setOpen(false)
  }, [pathname, closeOnRouteChange])

  // lock body scroll while the drawer is up
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return { open, close: () => setOpen(false), setOpen }
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** Tailwind background classes so each role keeps its colour. */
  className?: string
  title: string
  subtitle: string
}

export function MobileNavDrawer({ open, onClose, children, className, title, subtitle }: DrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />
      <div
        className={cn(
          "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col text-white shadow-2xl animate-in slide-in-from-left duration-200",
          className,
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/20 px-4">
          <div className="min-w-0">
            <p className="truncate font-bold">{title}</p>
            <p className="truncate text-xs text-white/70">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

interface MobileNavLinksProps {
  items: NavItem[]
  onNavigate: () => void
  label?: string
}

export function MobileNavLinks({ items, onNavigate, label }: MobileNavLinksProps) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1 px-3 py-4">
      {label && (
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/50">{label}</p>
      )}
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-white text-slate-900 shadow" : "text-white/80 hover:bg-white/20",
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

/** Hamburger button for the headers. */
export function MobileNavTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openMobileNav}
      aria-label="Open navigation"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden",
        className,
      )}
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
