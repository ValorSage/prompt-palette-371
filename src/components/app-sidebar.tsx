import { Link, useRouterState } from "@tanstack/react-router";
import {
  Images,
  FolderKanban,
  Layers,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Gallery", url: "/gallery", icon: Images },
  { title: "References", url: "/references", icon: Layers },
] as const;

export function AppSidebar({ onSignOut }: { onSignOut?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5 font-display text-base font-semibold cursor-default">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-accent text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="truncate group-data-[collapsible=icon]:hidden">Lumina Studio</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-4">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={path.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
