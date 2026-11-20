"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  BookCheck,
  BookOpen,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Search,
  Users,
} from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import {
  useBookIssues,
  useBooks,
  useLibraryOverview,
  useReturnBook,
} from "@/lib/hooks/use-operations"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const issueTone: Record<string, string> = {
  ISSUED: "bg-blue-100 text-blue-700",
  RETURNED: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-rose-100 text-rose-700",
  LOST: "bg-slate-200 text-slate-700",
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

export default function AdminLibraryPage() {
  const { ready } = useRequireRole("ADMIN")

  const [search, setSearch] = useState("")
  const [applied, setApplied] = useState("")
  const [status, setStatus] = useState<string>("")

  const { overview, isLoading: overviewLoading, refetch: refetchOverview } = useLibraryOverview()
  const { books, isLoading: booksLoading } = useBooks({ search: applied || undefined, limit: 50 })
  const { issues, isLoading: issuesLoading, refetch: refetchIssues } = useBookIssues({
    search: applied || undefined,
    status: status || undefined,
    limit: 50,
  })
  const returnBook = useReturnBook(() => {
    refetchIssues()
    refetchOverview()
  })

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const stats = [
    { label: "Titles", value: overview?.titles ?? 0, icon: BookOpen, tone: "bg-violet-50 text-violet-600" },
    { label: "Copies", value: overview?.copies ?? 0, icon: BookCheck, tone: "bg-blue-50 text-blue-600" },
    { label: "On loan", value: overview?.onLoan ?? 0, icon: Users, tone: "bg-amber-50 text-amber-600" },
    { label: "Overdue", value: overview?.overdue ?? 0, icon: AlertCircle, tone: "bg-rose-50 text-rose-600" },
  ]

  const handleReturn = async (id: string, title: string) => {
    try {
      await returnBook.mutate({ id })
      toast.success("Copy returned", { description: title })
    } catch (error) {
      toast.error("Could not record the return", {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold">Library</h1>
            <p className="text-muted-foreground">Catalogue and lending — live from the library records</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", stat.tone)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{overviewLoading ? "—" : stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <form
            className="relative max-w-md"
            onSubmit={(event) => {
              event.preventDefault()
              setApplied(search)
            }}
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, author or ISBN…"
              className="pl-8"
              aria-label="Search the catalogue"
            />
          </form>

          <Tabs defaultValue="catalogue">
            <TabsList>
              <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
              <TabsTrigger value="loans">Loans</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            {/* ── Catalogue ─────────────────────────────── */}
            <TabsContent value="catalogue" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Books</CardTitle>
                </CardHeader>
                <CardContent>
                  {booksLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : books.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No books match this search.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="py-2">Title</th>
                            <th className="py-2">Author</th>
                            <th className="py-2">Category</th>
                            <th className="py-2">Shelf</th>
                            <th className="py-2 text-right">Available</th>
                          </tr>
                        </thead>
                        <tbody>
                          {books.map((book) => (
                            <tr key={book.id} className="border-b last:border-0">
                              <td className="max-w-[240px] py-2">
                                <p className="truncate font-medium">{book.title}</p>
                                {book.isbn && <p className="truncate text-xs text-muted-foreground">{book.isbn}</p>}
                              </td>
                              <td className="py-2">{book.author}</td>
                              <td className="py-2">
                                <Badge variant="secondary">{book.category}</Badge>
                              </td>
                              <td className="py-2 text-muted-foreground">{book.shelfNo ?? "—"}</td>
                              <td className="py-2 text-right">
                                <span
                                  className={cn(
                                    "font-medium",
                                    book.availableCopies === 0 ? "text-rose-600" : "text-emerald-600",
                                  )}
                                >
                                  {book.availableCopies}
                                </span>
                                <span className="text-muted-foreground"> / {book.totalCopies}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Loans ─────────────────────────────────── */}
            <TabsContent value="loans" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
                  <CardTitle className="text-base">Book loans</CardTitle>
                  <div className="flex rounded-md border p-0.5">
                    {[
                      { label: "All", value: "" },
                      { label: "Issued", value: "ISSUED" },
                      { label: "Overdue", value: "OVERDUE" },
                      { label: "Returned", value: "RETURNED" },
                    ].map((tab) => (
                      <button
                        key={tab.label}
                        type="button"
                        onClick={() => setStatus(tab.value)}
                        className={cn(
                          "rounded px-2.5 py-1 text-xs transition",
                          status === tab.value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {issuesLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : issues.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No loans in this view.</p>
                  ) : (
                    <ul className="divide-y">
                      {issues.map((issue) => (
                        <li key={issue.id} className="flex flex-wrap items-center gap-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{issue.bookTitle}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {issue.studentName} · {issue.admissionNo}
                            </p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <p>due {shortDate(issue.dueDate)}</p>
                            <p>issued {shortDate(issue.issuedAt)}</p>
                          </div>
                          <Badge className={issueTone[issue.status] ?? "bg-muted text-muted-foreground"}>
                            {issue.status.toLowerCase()}
                          </Badge>
                          {issue.status !== "RETURNED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReturn(issue.id, issue.bookTitle)}
                              disabled={returnBook.isPending}
                            >
                              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Return
                            </Button>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> closed
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Categories ────────────────────────────── */}
            <TabsContent value="categories" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Catalogue by category</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {(overview?.categories ?? []).map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">
                        {category.titles} titles · {category.copies} copies
                      </span>
                    </div>
                  ))}
                  {(overview?.categories.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground">No books catalogued yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
