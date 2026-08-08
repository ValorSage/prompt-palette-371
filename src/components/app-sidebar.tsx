import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import {
  Images,
  FolderKanban,
  Layers,
  Settings as SettingsIcon,
  Sparkles,
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
] as const;

export function AppSidebar({ onSignOut }: { onSignOut?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const name = useMemo(
    () => (user?.user_metadata?.["full_name"] as string) ?? user?.email ?? "Account",
    [user?.user_metadata?.["full_name"], user?.email]
  );
  const avatar = useMemo(
    () => user?.user_metadata?.["avatar_url"] as string | undefined,
    [user?.user_metadata?.["avatar_url"]]
  );

  const handleSignOut = useCallback(() => {
    setDropdownOpen(false);
    onSignOut?.();
  }, [onSignOut]);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 font-display text-base font-semibold">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-accent text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="truncate group-data-[collapsible=icon]:hidden">Lumina Studio</span>
        </Link>
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
                    isActive={path.startsWith(item.url) && !("search" in item)}
                    tooltip={item.title}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Link to={item.url} search={"search" in item ? item.search : undefined}>
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
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 overflow-hidden rounded-md px-1 py-1.5 hover:bg-secondary transition">
              <Avatar className="h-8 w-8 shrink-0">
                {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                <AvatarFallback className="text-xs font-medium">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium text-foreground group-data-[collapsible=icon]:hidden flex-1">{name}</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link 
                to="/settings" 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setDropdownOpen(false)}
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={handleSignOut} className="text-destructive cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
