import { Link, useRouterState } from "@tanstack/react-router";
import {
  Images,
  FolderKanban,
  Layers,
  Heart,
  Settings as SettingsIcon,
  BarChart3,
  Sparkles,
  User as UserIcon,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Gallery", url: "/gallery", icon: Images },
  { title: "References", url: "/references", icon: Layers },
  { title: "Favorites", url: "/gallery", search: { favorites: true }, icon: Heart },
] as const;


export function AppSidebar({ onSignOut }: { onSignOut?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const name = (user?.user_metadata?.["full_name"] as string) ?? user?.email ?? "Account";
  const avatar = user?.user_metadata?.["avatar_url"] as string | undefined;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-display text-base font-semibold">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-accent text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="truncate group-data-[collapsible=icon]:hidden">Lumina Studio</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={path === "/dashboard"} tooltip="New Project">
                  <Link to="/dashboard" className="font-medium">
                    <Sparkles className="h-4 w-4" />
                    <span>New Project</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={path.startsWith(item.url) && !("search" in item)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} {...("search" in item ? { search: item.search } : {})}>
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

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 overflow-hidden">
              <Avatar className="h-7 w-7">
                {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                <AvatarFallback className="text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden text-left">{name}</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top">
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2 w-full">
                <SettingsIcon className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/settings/usage" className="flex items-center gap-2 w-full">
                <BarChart3 className="h-4 w-4" />
                <span>Usage</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/settings/account" className="flex items-center gap-2 w-full">
                <UserIcon className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={() => onSignOut && onSignOut()} className="text-destructive flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
