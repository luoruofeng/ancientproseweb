"use client"

import * as React from "react"
import { ArchiveX, Command, File, Inbox, Send, Trash2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"

// This is sample data
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
      isActive: true,
    },
    {
      title: "Drafts",
      url: "#",
      icon: File,
      isActive: false,
    },
    {
      title: "Sent",
      url: "#",
      icon: Send,
      isActive: false,
    },
    {
      title: "Junk",
      url: "#",
      icon: ArchiveX,
      isActive: false,
    },
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
      isActive: false,
    },
  ],
  mails: [
    {
      name: "William Smith",
      email: "williamsmith@example.com",
      subject: "Meeting Tomorrow",
      date: "09:34 AM",
      teaser:
        "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
    },
    {
      name: "Alice Smith",
      email: "alicesmith@example.com",
      subject: "Re: Project Update",
      date: "Yesterday",
      teaser:
        "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
    },
    {
      name: "Bob Johnson",
      email: "bobjohnson@example.com",
      subject: "Weekend Plans",
      date: "2 days ago",
      teaser:
        "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day?",
    },
    {
      name: "Emily Davis",
      email: "emilydavis@example.com",
      subject: "Re: Question about Budget",
      date: "2 days ago",
      teaser:
        "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments?",
    },
    {
      name: "Michael Wilson",
      email: "michaelwilson@example.com",
      subject: "Important Announcement",
      date: "1 week ago",
      teaser:
        "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future.",
    },
    {
      name: "Sarah Brown",
      email: "sarahbrown@example.com",
      subject: "Re: Feedback on Proposal",
      date: "1 week ago",
      teaser:
        "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail?",
    },
    {
      name: "David Lee",
      email: "davidlee@example.com",
      subject: "New Project Idea",
      date: "1 week ago",
      teaser:
        "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility?",
    },
    {
      name: "Olivia Wilson",
      email: "oliviawilson@example.com",
      subject: "Vacation Plans",
      date: "1 week ago",
      teaser:
        "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave.",
    },
    {
      name: "James Martin",
      email: "jamesmartin@example.com",
      subject: "Re: Conference Registration",
      date: "1 week ago",
      teaser:
        "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end.",
    },
    {
      name: "Sophia White",
      email: "sophiawhite@example.com",
      subject: "Team Dinner",
      date: "1 week ago",
      teaser:
        "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
    },
  ],
}

// FileItem组件用于处理文件点击导航
function FileItem({ fileName, dirname }: { fileName: string; dirname: string }) {
  const router = useRouter()
  const pathname = usePathname()
  
  const handleClick = () => {
    // 导航到古文页面，使用dirname作为第一个参数，fileName作为第二个参数
    router.push(`/prose/${encodeURIComponent(dirname)}/${encodeURIComponent(fileName)}`)
  }
  
  // 检查当前路径是否匹配此文件项
  const isActive = pathname === `/prose/${encodeURIComponent(dirname)}/${encodeURIComponent(fileName)}`
  
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault()
        handleClick()
      }}
      className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 cursor-pointer transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' 
          : ''
      }`}
    >
      <div className="flex w-full items-center gap-2">
        <span className={isActive ? 'font-medium' : ''}>{fileName}</span>
      </div>
    </a>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [activeItem, setActiveItem] = React.useState<any>({})
  const [mails, setMails] = React.useState(data.mails)
  const { setOpen } = useSidebar()
  const [resources, setResources] = React.useState<string[]>([])
  const [files, setFiles] = React.useState<string[]>([])
  
  // 从URL中提取dirname和subdirname
  const getActiveResourceFromUrl = React.useCallback(() => {
    const match = pathname.match(/^\/prose\/([^/]+)\/([^/]+)$/)
    if (match) {
      const dirname = decodeURIComponent(match[1])
      const subdirname = decodeURIComponent(match[2])
      return { dirname, subdirname }
    }
    return null
  }, [pathname])
  
  // 设置活动项并加载文件列表
  const setActiveResource = React.useCallback((resourceName: string) => {
    setActiveItem({ title: resourceName, icon: File, isActive: true })
    fetch(`/api/resources/${resourceName}`)
      .then((res) => res.json())
      .then((files) => setFiles(files))
      .catch((error) => {
        console.error('Error fetching files:', error)
        setFiles([])
      })
  }, [])
  
  // 初始化资源列表
  React.useEffect(() => {
    fetch("/api/resources")
      .then((res) => res.json())
      .then((data) => {
        setResources(data)
        
        // 检查当前URL是否匹配某个资源
        const urlInfo = getActiveResourceFromUrl()
        if (urlInfo && data.includes(urlInfo.dirname)) {
          // 如果URL匹配，设置对应的资源为活动状态
          setActiveResource(urlInfo.dirname)
        } else if (data[0]) {
          // 否则设置第一个资源为默认活动状态
          setActiveResource(data[0])
        }
      })
  }, [])
  
  // 监听URL变化，自动设置活动资源
  React.useEffect(() => {
    const urlInfo = getActiveResourceFromUrl()
    if (urlInfo && resources.includes(urlInfo.dirname)) {
      // 只有当前活动项不是目标资源时才更新
      if (activeItem.title !== urlInfo.dirname) {
        setActiveResource(urlInfo.dirname)
      }
    }
  }, [pathname, resources, activeItem.title, getActiveResourceFromUrl, setActiveResource])

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <img src="/icon.png" alt="logo" className="size-8 rounded-lg" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">古文观止</span>
                    <span className="truncate text-xs">Web版</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {resources.map((item) => {
                  const isActive = activeItem.title === item
                  return (
                    <SidebarMenuItem key={item}>
                      <SidebarMenuButton
                        tooltip={{
                          children: item,
                          hidden: false,
                        }}
                        onClick={() => {
                          setActiveResource(item)
                        }}
                        isActive={isActive}
                        className={isActive ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30' : ''}
                      >
                        <Avatar className="flex size-4 items-center justify-center">
                          <AvatarFallback className={`text-xs ${
                            isActive ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-100'
                          }`}>
                            {item.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {/* <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter> */}
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4 font-alimama-shuheiti">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
          </div>
          {/* <SidebarInput placeholder="Type to search..." /> */}
        </SidebarHeader>
        <SidebarContent data-slot="sidebar-content">
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {files.map((fileName) => (
                <FileItem
                  key={fileName}
                  fileName={fileName}
                  dirname={activeItem.title}
                />
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
