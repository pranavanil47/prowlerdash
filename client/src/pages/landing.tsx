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
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration form state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (registerData.password !== registerData.confirmPassword) {
        toast({
          title: "Registration failed",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest('POST', '/api/register', {
        username: registerData.username,
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        password: registerData.password,
      });

      toast({
        title: "Registration successful",
        description: "Welcome to the dashboard!",
      });

      // Refresh the page to trigger auth state update
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRegisterData = (field: keyof typeof registerData, value: string) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
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
                <div className="text-center mb-6">
                  <div className="flex bg-muted rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isLogin 
                          ? 'bg-background text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      data-testid="button-toggle-login"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        !isLogin 
                          ? 'bg-background text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      data-testid="button-toggle-signup"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>

                {isLogin ? (
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
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="font-medium text-foreground">Create Account</h3>
                      <p className="text-sm text-muted-foreground">Join us to secure your cloud infrastructure</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" data-testid="label-first-name">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={registerData.firstName}
                          onChange={(e) => updateRegisterData('firstName', e.target.value)}
                          placeholder="First name"
                          required
                          data-testid="input-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" data-testid="label-last-name">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={registerData.lastName}
                          onChange={(e) => updateRegisterData('lastName', e.target.value)}
                          placeholder="Last name"
                          required
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username" data-testid="label-register-username">Username</Label>
                      <Input
                        id="register-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => updateRegisterData('username', e.target.value)}
                        placeholder="Choose a username"
                        required
                        data-testid="input-register-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" data-testid="label-email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => updateRegisterData('email', e.target.value)}
                        placeholder="Enter your email"
                        required
                        data-testid="input-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" data-testid="label-register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => updateRegisterData('password', e.target.value)}
                        placeholder="Create a password"
                        required
                        data-testid="input-register-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" data-testid="label-confirm-password">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => updateRegisterData('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        required
                        data-testid="input-confirm-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-register"
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                )}
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
            Get started by signing in and connecting your Prowler v5 instance.
          </p>
        </div>
      </div>
    </div>
  );
}
