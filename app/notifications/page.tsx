import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { NotificationList } from "@/components/notifications/notification-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, Settings, CheckCheck, Mail } from "lucide-react"

const stats = [
  { title: "Total", value: "24", icon: Bell, color: "text-primary", bgColor: "bg-primary/10" },
  { title: "Unread", value: "6", icon: Mail, color: "text-amber-600", bgColor: "bg-amber-500/10" },
]

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">Stay updated with important alerts and messages</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 bg-transparent">
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title} Notifications</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <NotificationList />
        </main>
      </div>
    </div>
  )
}
