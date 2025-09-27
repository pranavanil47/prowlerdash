import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plug, Eye, EyeOff, CheckCircle, XCircle, Info } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import type { ProwlerConfiguration } from "@shared/schema";

const prowlerConfigSchema = z.object({
  prowlerUrl: z.string().url("Please enter a valid URL"),
  prowlerEmail: z.string().email("Please enter a valid email address"),
  prowlerPassword: z.string().min(1, "Password is required"),
});

type ProwlerConfigForm = z.infer<typeof prowlerConfigSchema>;

export default function ProwlerIntegration() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: configuration, isLoading: configLoading } = useQuery<ProwlerConfiguration | null>({
    queryKey: ["/api/prowler/configuration"],
    retry: false,
  });

  const form = useForm<ProwlerConfigForm>({
    resolver: zodResolver(prowlerConfigSchema),
    defaultValues: {
      prowlerUrl: "",
      prowlerEmail: "",
      prowlerPassword: "",
    },
  });

  // Update form when configuration loads
  useEffect(() => {
    if (configuration) {
      form.setValue("prowlerUrl", configuration.prowlerUrl || "");
      form.setValue("prowlerEmail", configuration.prowlerEmail || "");
    }
  }, [configuration, form]);

  const testConnectionMutation = useMutation({
    mutationFn: async (data: ProwlerConfigForm) => {
      const response = await apiRequest("POST", "/api/prowler/test-connection", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to your Prowler instance",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect to Prowler instance",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Connection Test Failed",
        description: "Failed to test connection to Prowler instance",
        variant: "destructive",
      });
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: ProwlerConfigForm) => {
      const response = await apiRequest("POST", "/api/prowler/configuration", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Prowler configuration has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prowler/configuration"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Save Failed",
        description: "Failed to save Prowler configuration",
        variant: "destructive",
      });
    },
  });

  const onTestConnection = () => {
    const values = form.getValues();
    testConnectionMutation.mutate(values);
  };

  const onSubmit = (data: ProwlerConfigForm) => {
    saveConfigMutation.mutate(data);
  };

  if (isLoading || configLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <Navigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Prowler Integration</h1>
              <p className="text-sm text-muted-foreground">Configure your Prowler v5 API connection</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {configuration?.connectionStatus === 'connected' ? (
                  <>
                    <div className="h-3 w-3 bg-accent rounded-full"></div>
                    <span className="text-sm text-accent">Connected</span>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-3 bg-destructive rounded-full"></div>
                    <span className="text-sm text-destructive">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Connection Status */}
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Connection Status</h2>
                  <div className="flex items-center space-x-2">
                    {configuration?.connectionStatus === 'connected' ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-accent" />
                        <span className="text-sm text-accent">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-destructive" />
                        <span className="text-sm text-destructive">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure your Prowler v5 instance to start monitoring your cloud security posture.
                </p>
              </CardContent>
            </Card>
            
            {/* Configuration Form */}
            <Card className="border-border">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Prowler Configuration</h2>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="prowlerUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Prowler Instance URL
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://your-prowler-instance.com"
                              {...field}
                              data-testid="input-prowler-url"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            The base URL of your Prowler v5 hosted instance
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="prowlerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Email
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your-email@company.com"
                              {...field}
                              data-testid="input-prowler-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="prowlerPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Password
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your Prowler password"
                                {...field}
                                data-testid="input-prowler-password"
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Card className="bg-muted border-0">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Security Note</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Your credentials are encrypted and stored securely. They are only used to authenticate with your Prowler instance.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={onTestConnection}
                        disabled={testConnectionMutation.isPending || !form.formState.isValid}
                        data-testid="button-test-connection"
                      >
                        {testConnectionMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plug className="mr-2 h-4 w-4" />
                        )}
                        Test Connection
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={saveConfigMutation.isPending || !form.formState.isValid}
                        data-testid="button-save-configuration"
                      >
                        {saveConfigMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Save Configuration
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* API Information */}
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">API Requirements</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Prowler v5 instance with API access enabled</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Valid user credentials with read permissions</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Network connectivity to your Prowler instance</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
