import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { BookCatalog } from "@/components/library/book-catalog"
import { IssuedBooks } from "@/components/library/issued-books"
import { LibraryStats } from "@/components/library/library-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, BookPlus } from "lucide-react"

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Library Management</h1>
              <p className="text-muted-foreground">Manage books, issues, and returns</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 bg-transparent">
                <BookPlus className="h-4 w-4" />
                Issue Book
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Book
              </Button>
            </div>
          </div>

          <LibraryStats />

          <Tabs defaultValue="catalog" className="mt-6">
            <TabsList>
              <TabsTrigger value="catalog">Book Catalog</TabsTrigger>
              <TabsTrigger value="issued">Issued Books</TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="mt-6">
              <BookCatalog />
            </TabsContent>

            <TabsContent value="issued" className="mt-6">
              <IssuedBooks />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
