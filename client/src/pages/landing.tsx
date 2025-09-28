import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Database, Filter, Lock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/login/local', { 
        username: loginUsername, 
        password: loginPassword 
      });

      toast({
        title: "Login successful",
        description: "Welcome to the dashboard!",
      });

      // Refresh the page to trigger auth state update
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="mx-auto h-20 w-20 bg-primary rounded-xl flex items-center justify-center mb-8">
            <Shield className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Prowler Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Comprehensive security asset inventory management and monitoring for your cloud infrastructure
          </p>
          <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
            <Card className="w-full">
              <CardContent className="p-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="font-medium text-foreground">Welcome Back</h3>
                    <p className="text-sm text-muted-foreground">Sign in to access the dashboard</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-username" data-testid="label-login-username">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Enter username"
                      required
                      data-testid="input-login-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" data-testid="label-login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      data-testid="input-login-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Asset Inventory</h3>
              <p className="text-muted-foreground">
                Comprehensive view of all your cloud resources with real-time status monitoring and compliance tracking.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Filter className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Advanced Filtering</h3>
              <p className="text-muted-foreground">
                Powerful filtering and search capabilities to quickly find and analyze specific resources and security issues.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Secure Integration</h3>
              <p className="text-muted-foreground">
                Secure connection to your Prowler v5 instance with encrypted credential storage and session management.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Ready to secure your cloud infrastructure?
          </h2>
          <p className="text-muted-foreground mb-8">
            Sign in to connect your Prowler v5 instance and start monitoring your cloud infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}
