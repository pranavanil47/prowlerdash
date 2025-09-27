import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Shield, Home, Plug, Database, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const getNavigationItems = (userRole?: string) => [
  { path: "/", icon: Home, label: "Home" },
  { path: "/dashboard", icon: Database, label: "Dashboard" },
  { path: "/prowler-integration", icon: Plug, label: "Prowler Integration" },
  ...(userRole === "admin" ? [{ path: "/settings", icon: Settings, label: "Settings" }] : []),
];

export default function Navigation() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Prowler Dashboard</h1>
            <p className="text-xs text-muted-foreground">Security Monitoring</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {getNavigationItems(user?.role || undefined).map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive && "bg-muted text-foreground"
              )}
              onClick={() => navigate(item.path)}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
