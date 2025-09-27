import bcrypt from 'bcrypt';

export interface ProwlerResource {
  id: string;
  name: string;
  type: string;
  region?: string;
  status: 'compliant' | 'non-compliant' | 'warning' | 'unknown';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  lastChecked?: string;
  rawData?: any;
}

export interface ProwlerApiResponse {
  resources: ProwlerResource[];
  success: boolean;
  error?: string;
}

export class ProwlerService {
  private async makeRequest(url: string, email: string, password: string, endpoint: string): Promise<any> {
    try {
      // First, authenticate with Prowler API
      const authResponse = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!authResponse.ok) {
        throw new Error(`Authentication failed: ${authResponse.statusText}`);
      }

      const authData = await authResponse.json();
      const token = authData.access_token || authData.token;

      if (!token) {
        throw new Error('No access token received from Prowler API');
      }

      // Make the actual API request with the token
      const response = await fetch(`${url}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Prowler API request failed:', error);
      throw error;
    }
  }

  async testConnection(prowlerUrl: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.makeRequest(prowlerUrl, email, password, '/api/health');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async fetchResources(prowlerUrl: string, email: string, password: string): Promise<ProwlerApiResponse> {
    try {
      const data = await this.makeRequest(prowlerUrl, email, password, '/api/v5/resources');
      
      // Transform the response to match our expected format
      const resources: ProwlerResource[] = (data.resources || data.data || []).map((resource: any) => ({
        id: resource.id || resource.resource_id || resource.arn,
        name: resource.name || resource.resource_name || resource.id,
        type: resource.type || resource.resource_type || resource.service,
        region: resource.region || resource.aws_region,
        status: this.mapStatus(resource.status || resource.compliance_status),
        severity: this.mapSeverity(resource.severity || resource.risk_level),
        lastChecked: resource.last_checked || resource.scan_time || new Date().toISOString(),
        rawData: resource,
      }));

      return {
        resources,
        success: true,
      };
    } catch (error) {
      return {
        resources: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch resources',
      };
    }
  }

  private mapStatus(status: string): 'compliant' | 'non-compliant' | 'warning' | 'unknown' {
    if (!status) return 'unknown';
    
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('pass') || lowerStatus.includes('compliant') || lowerStatus === 'pass') {
      return 'compliant';
    }
    if (lowerStatus.includes('fail') || lowerStatus.includes('non-compliant') || lowerStatus === 'fail') {
      return 'non-compliant';
    }
    if (lowerStatus.includes('warn') || lowerStatus.includes('warning')) {
      return 'warning';
    }
    return 'unknown';
  }

  private mapSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    if (!severity) return 'low';
    
    const lowerSeverity = severity.toLowerCase();
    if (lowerSeverity.includes('critical') || lowerSeverity.includes('severe')) {
      return 'critical';
    }
    if (lowerSeverity.includes('high')) {
      return 'high';
    }
    if (lowerSeverity.includes('medium') || lowerSeverity.includes('moderate')) {
      return 'medium';
    }
    return 'low';
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export const prowlerService = new ProwlerService();
