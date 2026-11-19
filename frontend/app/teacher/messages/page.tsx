"use client"

import { useRequireRole } from "@/lib/auth-context"

import { useState } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Users, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const conversations = [
  {
    id: 1,
    name: "Mr. Rajesh Verma",
    role: "Parent of Rahul V.",
    avatar: "/parent-man.jpg",
    lastMessage: "Thank you for the update on Rahul's progress.",
    time: "10:30 AM",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Mrs. Priya Sharma",
    role: "Parent of Ananya S.",
    avatar: "/parent-woman.jpg",
    lastMessage: "Can we schedule a meeting?",
    time: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: "Class 10-A Group",
    role: "45 members",
    avatar: "",
    lastMessage: "Reminder: Submit assignments by Friday",
    time: "Yesterday",
    unread: 0,
    online: false,
    isGroup: true,
  },
  {
    id: 4,
    name: "Dr. Singh",
    role: "Chemistry Department",
    avatar: "/diverse-professor-lecturing.png",
    lastMessage: "The syllabus meeting is confirmed for tomorrow.",
    time: "Dec 5",
    unread: 0,
    online: true,
  },
  {
    id: 5,
    name: "Mrs. Gupta",
    role: "Physics Department",
    avatar: "/female-teacher.png",
    lastMessage: "Thanks for sharing the notes!",
    time: "Dec 4",
    unread: 0,
    online: false,
  },
]

const messages = [
  {
    id: 1,
    sender: "Mr. Rajesh Verma",
    content: "Good morning, Sir. I wanted to check on Rahul's performance in the recent test.",
    time: "10:15 AM",
    isMe: false,
  },
  {
    id: 2,
    sender: "Me",
    content:
      "Good morning, Mr. Verma. Rahul performed well in the test. He scored 85/100, which is above the class average.",
    time: "10:20 AM",
    isMe: true,
  },
  {
    id: 3,
    sender: "Mr. Rajesh Verma",
    content: "That's great to hear! Are there any areas where he needs improvement?",
    time: "10:25 AM",
    isMe: false,
  },
  {
    id: 4,
    sender: "Me",
    content: "He could work on word problems and geometry. I'll share some practice worksheets that might help.",
    time: "10:28 AM",
    isMe: true,
  },
  {
    id: 5,
    sender: "Mr. Rajesh Verma",
    content: "Thank you for the update on Rahul's progress. We'll make sure he practices more at home.",
    time: "10:30 AM",
    isMe: false,
  },
]

export default function TeacherMessagesPage() {
  const { ready } = useRequireRole("TEACHER")

  if (!ready) return <FullPageLoader />

  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <TeacherSidebar />
      <div className="pl-64">
        <TeacherHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <p className="text-muted-foreground">Communicate with parents, students, and staff</p>
          </div>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-3 h-[calc(100vh-220px)]">
              {/* Conversation List */}
              <div className="border-r">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Tabs defaultValue="all" className="w-full">
                  <div className="px-4 pt-2">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="parents">Parents</TabsTrigger>
                      <TabsTrigger value="staff">Staff</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="all" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-360px)]">
                      <div className="p-2">
                        {filteredConversations.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv)}
                            className={cn(
                              "w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left",
                              selectedConversation.id === conv.id ? "bg-emerald-50" : "hover:bg-slate-50",
                            )}
                          >
                            <div className="relative">
                              {conv.isGroup ? (
                                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <Users className="h-6 w-6 text-emerald-600" />
                                </div>
                              ) : (
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={conv.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              {conv.online && (
                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium truncate">{conv.name}</h4>
                                <span className="text-xs text-muted-foreground">{conv.time}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{conv.role}</p>
                              <p className="text-sm text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                            </div>
                            {conv.unread > 0 && <Badge className="bg-emerald-600 text-white">{conv.unread}</Badge>}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Chat Area */}
              <div className="md:col-span-2 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedConversation.isGroup ? (
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-emerald-600" />
                      </div>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <h3 className="font-semibold">{selectedConversation.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.online ? "Online" : selectedConversation.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={cn("flex", message.isMe ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            message.isMe
                              ? "bg-emerald-600 text-white rounded-br-sm"
                              : "bg-slate-100 text-foreground rounded-bl-sm",
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={cn("text-xs mt-1", message.isMe ? "text-white/70" : "text-muted-foreground")}>
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
