import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Database, 
  Shield, 
  Clock, 
  Search, 
  RefreshCw, 
  Eye, 
  MoreVertical,
  Server,
  HardDrive,
  Code,
  Users,
  ChevronUp,
  ChevronDown,
  TriangleAlert,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Navigation from "@/components/ui/navigation";
import type { Asset } from "@shared/schema";

const resourceTypeIcons: Record<string, React.ComponentType<any>> = {
  'ec2': Server,
  's3': HardDrive,
  'lambda': Code,
  'iam': Users,
  'rds': Database,
};

const statusConfig = {
  'compliant': { 
    color: 'bg-accent/10 text-accent', 
    icon: CheckCircle,
    label: 'Compliant'
  },
  'non-compliant': { 
    color: 'bg-destructive/10 text-destructive', 
    icon: TriangleAlert,
    label: 'Non-Compliant'
  },
  'warning': { 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', 
    icon: AlertCircle,
    label: 'Warning'
  },
  'unknown': { 
    color: 'bg-muted text-muted-foreground', 
    icon: AlertCircle,
    label: 'Unknown'
  },
};

const severityConfig = {
  'critical': 'bg-destructive/10 text-destructive',
  'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  'low': 'bg-muted text-muted-foreground',
};

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    search: '',
    resourceType: '',
    status: '',
    severity: '',
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

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

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalResources: number;
    criticalIssues: number;
    compliantResources: number;
    lastScan: Date | null;
  } | null>({
    queryKey: ["/api/assets/stats"],
    retry: false,
  });

  const { data: assets, isLoading: assetsLoading, refetch: refetchAssets } = useQuery<Asset[] | null>({
    queryKey: ["/api/assets", filters],
    retry: false,
  });

  const syncAssetsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/assets/sync", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync Initiated",
        description: "Asset data is being synced from Prowler",
      });
      refetchAssets();
      queryClient.invalidateQueries({ queryKey: ["/api/assets/stats"] });
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
        title: "Sync Failed",
        description: "Failed to sync asset data from Prowler",
        variant: "destructive",
      });
    },
  });

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      resourceType: '',
      status: '',
      severity: '',
    });
  };

  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now.getTime() - target.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getResourceIcon = (type: string) => {
    const IconComponent = resourceTypeIcons[type.toLowerCase()] || Database;
    return IconComponent;
  };

  const getSortedAssets = (assets: Asset[]) => {
    if (!sortConfig) return assets;
    
    return [...assets].sort((a, b) => {
      let aValue = a[sortConfig.key as keyof Asset] as string | number | Date | null;
      let bValue = b[sortConfig.key as keyof Asset] as string | number | Date | null;
      
      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      
      // Convert to comparable format
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <h1 className="text-2xl font-semibold text-foreground">Asset Inventory</h1>
              <p className="text-sm text-muted-foreground">Monitor and manage your cloud security resources</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchAssets()}
                disabled={assetsLoading}
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${assetsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground" data-testid="text-total-resources">
                        {stats?.totalResources || 0}
                      </p>
                    )}
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
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold text-destructive" data-testid="text-critical-issues">
                        {stats?.criticalIssues || 0}
                      </p>
                    )}
                  </div>
                  <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <TriangleAlert className="h-6 w-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold text-accent" data-testid="text-compliant-resources">
                        {stats?.compliantResources || 0}
                      </p>
                    )}
                  </div>
                  <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Scan</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground" data-testid="text-last-scan">
                        {stats?.lastScan ? formatRelativeTime(stats.lastScan) : 'Never'}
                      </p>
                    )}
                  </div>
                  <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Filters and Search */}
          <Card className="border-border mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search resources..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Select 
                    value={filters.resourceType || "all"} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, resourceType: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger className="w-48" data-testid="select-resource-type">
                      <SelectValue placeholder="All Resource Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resource Types</SelectItem>
                      <SelectItem value="ec2">EC2 Instances</SelectItem>
                      <SelectItem value="s3">S3 Buckets</SelectItem>
                      <SelectItem value="rds">RDS Databases</SelectItem>
                      <SelectItem value="lambda">Lambda Functions</SelectItem>
                      <SelectItem value="iam">IAM Roles</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={filters.status || "all"} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger className="w-48" data-testid="select-status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={filters.severity || "all"} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger className="w-48" data-testid="select-severity">
                      <SelectValue placeholder="All Severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Resource Table */}
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Resources</h2>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>Showing</span>
                    <span className="font-medium text-foreground">
                      {assets?.length || 0}
                    </span>
                    <span>resources</span>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort('resourceName')}
                          data-testid="button-sort-resource"
                        >
                          Resource
                          {sortConfig?.key === 'resourceName' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="ml-2 h-4 w-4" /> : 
                            <ChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort('resourceType')}
                          data-testid="button-sort-type"
                        >
                          Type
                          {sortConfig?.key === 'resourceType' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="ml-2 h-4 w-4" /> : 
                            <ChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort('region')}
                          data-testid="button-sort-region"
                        >
                          Region
                          {sortConfig?.key === 'region' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="ml-2 h-4 w-4" /> : 
                            <ChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort('status')}
                          data-testid="button-sort-status"
                        >
                          Status
                          {sortConfig?.key === 'status' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="ml-2 h-4 w-4" /> : 
                            <ChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort('severity')}
                          data-testid="button-sort-severity"
                        >
                          Severity
                          {sortConfig?.key === 'severity' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="ml-2 h-4 w-4" /> : 
                            <ChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort('lastCheckedAt')}
                          data-testid="button-sort-last-checked"
                        >
                          Last Checked
                          {sortConfig?.key === 'lastCheckedAt' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="ml-2 h-4 w-4" /> : 
                            <ChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetsLoading ? (
                      // Loading skeletons
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Skeleton className="h-8 w-8 rounded-lg" />
                              <div>
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : assets && assets.length > 0 ? (
                      getSortedAssets(assets).map((asset) => {
                        const IconComponent = getResourceIcon(asset.resourceType);
                        const statusInfo = statusConfig[asset.status];
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <TableRow 
                            key={asset.id} 
                            className="hover:bg-muted/25 transition-colors"
                            data-testid={`row-asset-${asset.id}`}
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <IconComponent className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-foreground">
                                    {asset.resourceName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {asset.resourceId}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {asset.resourceType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {asset.region || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {asset.severity && (
                                <Badge className={severityConfig[asset.severity]}>
                                  {asset.severity.charAt(0).toUpperCase() + asset.severity.slice(1)}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {asset.lastCheckedAt ? formatRelativeTime(asset.lastCheckedAt) : 'Never'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-view-asset-${asset.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-menu-asset-${asset.id}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Database className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No assets found</p>
                            <p className="text-sm text-muted-foreground">
                              Configure your Prowler integration to start monitoring resources
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
