"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"

const recentResults = [
  {
    exam: "Mid-Term Examination",
    date: "Nov 2024",
    subjects: [
      { name: "Mathematics", marks: 92, total: 100, grade: "A+" },
      { name: "Physics", marks: 88, total: 100, grade: "A" },
      { name: "Chemistry", marks: 85, total: 100, grade: "A" },
    ],
    percentage: 88.3,
    rank: 5,
  },
  {
    exam: "Unit Test 3",
    date: "Oct 2024",
    subjects: [
      { name: "English", marks: 45, total: 50, grade: "A" },
      { name: "Computer Science", marks: 48, total: 50, grade: "A+" },
    ],
    percentage: 93,
    rank: 2,
  },
]

export function RecentResults() {
  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Results</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentResults.map((result, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold">{result.exam}</h4>
                <p className="text-sm text-muted-foreground">{result.date}</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-1">
                  Rank #{result.rank}
                </Badge>
                <p className="text-2xl font-bold text-primary">{result.percentage}%</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {result.subjects.slice(0, 3).map((subject) => (
                <div key={subject.name} className="text-center p-2 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground truncate">{subject.name}</p>
                  <p className="font-semibold">
                    {subject.marks}/{subject.total}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      subject.grade.includes("+")
                        ? "border-emerald-500 text-emerald-600"
                        : "border-blue-500 text-blue-600"
                    }
                  >
                    {subject.grade}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
