"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { ProseControls } from "@/components/prose-controls"
import MusicPlayer from "@/components/music-player"
import { Separator } from "@/components/ui/separator"

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [navOpen, setNavOpen] = useState(false)
  const [navLevel, setNavLevel] = useState<'primary' | 'secondary'>('primary')
  const [resources, setResources] = useState<string[]>([])
  const [activeResource, setActiveResource] = useState<string | null>(null)
  const [files, setFiles] = useState<string[]>([])
  const [isUIVisible, setIsUIVisible] = useState(true)
  const [hideUITimer, setHideUITimer] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const getActiveResourceFromUrl = () => {
    const match = pathname.match(/^\/prose\/([^/]+)\/([^/]+)$/)
    if (match) {
      return decodeURIComponent(match[1])
    }
    return null
  }

  useEffect(() => {
    if (!isMobile) return
    fetch("/api/resources")
      .then((res) => res.json())
      .then((data) => {
        setResources(data)
        const urlActive = getActiveResourceFromUrl()
        if (urlActive && data.includes(urlActive)) {
          setActiveResource(urlActive)
        } else if (data[0]) {
          setActiveResource(data[0])
        }
      })
  }, [isMobile])

  useEffect(() => {
    if (!isMobile || !activeResource) return
    fetch(`/api/resources/${activeResource}`)
      .then((res) => res.json())
      .then(setFiles)
  }, [isMobile, activeResource])

  // 移动端UI自动隐藏和点击显示逻辑
  useEffect(() => {
    if (!isMobile) return

    const resetHideTimer = () => {
      if (hideUITimer) {
        clearTimeout(hideUITimer)
      }
      const timer = setTimeout(() => {
        setIsUIVisible(false)
      }, 3000) // 3秒后自动隐藏
      setHideUITimer(timer)
    }

    const handleClick = (e: MouseEvent | TouchEvent) => {
      // 检查点击的是否是空白区域（不是按钮、链接等交互元素）
      const target = e.target as HTMLElement
      if (!target.closest('button') && !target.closest('a') && !target.closest('[role="slider"]')) {
        setIsUIVisible(prev => {
          if (!prev) {
            resetHideTimer()
            return true
          }
          return prev
        })
      }
    }

    // 初始设置定时器
    resetHideTimer()

    document.addEventListener('click', handleClick)
    document.addEventListener('touchend', handleClick)

    return () => {
      if (hideUITimer) {
        clearTimeout(hideUITimer)
      }
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchend', handleClick)
    }
  }, [isMobile])

  if (isMobile) {
    return (
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <main className="p-4 pb-32 pt-4 text-xl leading-relaxed">
          {children}
        </main>
        <header className="bg-background flex shrink-0 items-center gap-2 border-t p-4 font-alimama-shuheiti fixed bottom-14 left-0 right-0 z-40">
          <div className="flex-1" />
          <ProseControls />
          <MusicPlayer />
        </header>
        <nav className={`fixed bottom-0 left-0 right-0 bg-background border-t z-50 flex justify-center items-center h-14 ${!isUIVisible ? 'transform translate-y-full opacity-0' : 'transform translate-y-0 opacity-100'} transition-all duration-300`}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="flex flex-col items-center" onClick={() => setNavLevel('primary')}>
              <Menu className="h-5 w-5" />
              <span className="text-xs mt-1">菜单</span>
            </Button>
          </SheetTrigger>
        </nav>
        <SheetContent side="bottom" className="p-0 h-[80vh] overflow-y-auto font-alimama-shuheiti">
          {navLevel === 'primary' ? (
            <div className="flex flex-col gap-2 p-4">
              {resources.map((item) => (
                <Button
                  key={item}
                  variant={activeResource === item ? "secondary" : "ghost"}
                  className="justify-start text-left py-6"
                  onClick={() => {
                    setActiveResource(item)
                    setNavLevel('secondary')
                  }}
                >
                  <Avatar className="mr-4 size-10 flex-shrink-0">
                    <AvatarFallback className="text-xl">{item.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-base truncate">{item}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
                <h2 className="text-xl font-medium truncate">{activeResource}</h2>
                <Button variant="ghost" onClick={() => setNavLevel('primary')}>
                  返回
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {files.map((fileName) => (
                  <a
                    key={fileName}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(`/prose/${encodeURIComponent(activeResource!)}/${encodeURIComponent(fileName)}`)
                      setNavOpen(false)
                    }}
                    className="block hover:bg-accent p-4 border-b last:border-b-0 text-base"
                  >
                    {fileName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  } else {
    return (
      <SidebarProvider
        style={{
          "--sidebar-width": "350px",
        } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background flex shrink-0 items-center gap-2 border-b p-4 font-alimama-shuheiti">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumb />
            <div className="flex-1" />
            <ProseControls />
            <MusicPlayer />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    )
  }
}