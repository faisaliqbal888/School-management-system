import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { SettingsForm } from "@/components/settings/settings-form"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your school system preferences and configuration</p>
          </div>

          <SettingsForm />
        </main>
      </div>
    </div>
  )
}
