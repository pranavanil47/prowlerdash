import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Settings, Database, ArrowRight } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import type { ProwlerConfiguration } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: prowlerConfig } = useQuery<ProwlerConfiguration | null>({
    queryKey: ["/api/prowler/configuration"],
    retry: false,
  });

  const { data: stats } = useQuery<{
    totalResources: number;
    criticalIssues: number;
    compliantResources: number;
    lastScan: Date | null;
  } | null>({
    queryKey: ["/api/assets/stats"],
    retry: false,
    enabled: !!prowlerConfig,
  });

  return (
    <div className="h-full flex">
      <Navigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Welcome Back</h1>
              <p className="text-sm text-muted-foreground">
                {user?.firstName ? `Hello, ${user.firstName}` : 'Manage your security dashboard'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.firstName ? user.firstName.charAt(0) : user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {!prowlerConfig ? (
              <Card className="border-border">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <Settings className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    Configure Prowler Integration
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Connect your Prowler v5 instance to start monitoring your cloud security posture and asset inventory.
                  </p>
                  <Button
                    onClick={() => navigate("/prowler-integration")}
                    size="lg"
                    data-testid="button-configure-prowler"
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Configure Integration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
                          <p className="text-2xl font-bold text-foreground">
                            {stats?.totalResources || 0}
                          </p>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Database className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                          <p className="text-2xl font-bold text-destructive">
                            {stats?.criticalIssues || 0}
                          </p>
                        </div>
                        <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                          <Shield className="h-6 w-6 text-destructive" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                          <p className="text-2xl font-bold text-accent">
                            {stats?.compliantResources || 0}
                          </p>
                        </div>
                        <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                          <Shield className="h-6 w-6 text-accent" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Last Scan</p>
                          <p className="text-2xl font-bold text-foreground">
                            {stats?.lastScan ? new Date(stats.lastScan).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                        <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                          <Shield className="h-6 w-6 text-secondary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="border-border">
                  <CardContent className="p-8">
                    <h2 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="justify-between h-auto p-4"
                        onClick={() => navigate("/dashboard")}
                        data-testid="button-view-assets"
                      >
                        <div className="text-left">
                          <div className="font-medium">View Asset Inventory</div>
                          <div className="text-sm text-muted-foreground">Browse and filter your resources</div>
                        </div>
                        <ArrowRight className="h-5 w-5" />
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-between h-auto p-4"
                        onClick={() => navigate("/prowler-integration")}
                        data-testid="button-manage-integration"
                      >
                        <div className="text-left">
                          <div className="font-medium">Manage Integration</div>
                          <div className="text-sm text-muted-foreground">Update Prowler settings</div>
                        </div>
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
