"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, BookOpen, Eye, Edit, Grid, List } from "lucide-react"

const books = [
  {
    id: "B001",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    isbn: "978-0262033848",
    category: "Computer Science",
    totalCopies: 15,
    available: 8,
    location: "Shelf A-12",
    cover: "/algorithms-textbook-cover.jpg",
  },
  {
    id: "B002",
    title: "Physics for Scientists",
    author: "Raymond A. Serway",
    isbn: "978-1133947271",
    category: "Science",
    totalCopies: 20,
    available: 12,
    location: "Shelf B-05",
    cover: "/physics-textbook-cover.jpg",
  },
  {
    id: "B003",
    title: "Calculus: Early Transcendentals",
    author: "James Stewart",
    isbn: "978-1285741550",
    category: "Mathematics",
    totalCopies: 25,
    available: 18,
    location: "Shelf A-08",
    cover: "/images/book-calculo.png",
  },
  {
    id: "B004",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "978-0061120084",
    category: "Literature",
    totalCopies: 30,
    available: 5,
    location: "Shelf C-15",
    cover: "/classic-novel-cover.png",
  },
  {
    id: "B005",
    title: "World History: Patterns of Interaction",
    author: "McDougal Littell",
    isbn: "978-0547491127",
    category: "History",
    totalCopies: 22,
    available: 15,
    location: "Shelf D-03",
    cover: "/history-textbook-cover.jpg",
  },
  {
    id: "B006",
    title: "Chemistry: The Central Science",
    author: "Theodore Brown",
    isbn: "978-0134414232",
    category: "Science",
    totalCopies: 18,
    available: 10,
    location: "Shelf B-08",
    cover: "/chemistry-textbook-cover.png",
  },
]

export function BookCatalog() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="science">Science</SelectItem>
            <SelectItem value="mathematics">Mathematics</SelectItem>
            <SelectItem value="literature">Literature</SelectItem>
            <SelectItem value="history">History</SelectItem>
            <SelectItem value="computer-science">Computer Science</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                <img
                  src={book.cover || "/placeholder.svg"}
                  alt={book.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="flex gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 mb-1">{book.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {book.category}
                  </Badge>
                  <span className={`text-xs font-medium ${book.available > 5 ? "text-emerald-600" : "text-amber-600"}`}>
                    {book.available} left
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-16 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={book.cover || "/placeholder.svg"} alt={book.title} className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{book.title}</h3>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary">{book.category}</Badge>
                    <span className="text-xs text-muted-foreground">ISBN: {book.isbn}</span>
                    <span className="text-xs text-muted-foreground">{book.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {book.available}/{book.totalCopies}
                  </p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Issue
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
