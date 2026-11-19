"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Package, AlertTriangle } from "lucide-react"

const inventory = [
  {
    id: "INV001",
    name: "Student Chairs",
    category: "Furniture",
    quantity: 450,
    minStock: 100,
    unit: "pcs",
    location: "Warehouse A",
    status: "in-stock",
  },
  {
    id: "INV002",
    name: "Whiteboard Markers",
    category: "Stationery",
    quantity: 85,
    minStock: 100,
    unit: "boxes",
    location: "Store Room",
    status: "low-stock",
  },
  {
    id: "INV003",
    name: "Projectors",
    category: "Electronics",
    quantity: 25,
    minStock: 10,
    unit: "pcs",
    location: "IT Room",
    status: "in-stock",
  },
  {
    id: "INV004",
    name: "Lab Equipment Sets",
    category: "Laboratory",
    quantity: 8,
    minStock: 15,
    unit: "sets",
    location: "Science Lab",
    status: "low-stock",
  },
  {
    id: "INV005",
    name: "Sports Balls",
    category: "Sports",
    quantity: 120,
    minStock: 50,
    unit: "pcs",
    location: "Sports Room",
    status: "in-stock",
  },
  {
    id: "INV006",
    name: "First Aid Kits",
    category: "Medical",
    quantity: 15,
    minStock: 20,
    unit: "kits",
    location: "Medical Room",
    status: "low-stock",
  },
  {
    id: "INV007",
    name: "Computer Systems",
    category: "Electronics",
    quantity: 60,
    minStock: 40,
    unit: "pcs",
    location: "Computer Lab",
    status: "in-stock",
  },
  {
    id: "INV008",
    name: "Cleaning Supplies",
    category: "Maintenance",
    quantity: 200,
    minStock: 100,
    unit: "sets",
    location: "Utility Room",
    status: "in-stock",
  },
]

export function InventoryTable() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Min. Stock</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow key={item.id} className="group hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.category}</Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{item.quantity}</span>
                  <span className="text-muted-foreground text-sm ml-1">{item.unit}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.minStock} {item.unit}
                </TableCell>
                <TableCell className="text-muted-foreground">{item.location}</TableCell>
                <TableCell>
                  {item.status === "low-stock" ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">In Stock</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
