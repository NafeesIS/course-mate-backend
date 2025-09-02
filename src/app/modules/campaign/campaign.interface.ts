export interface ICampaign extends Document {
  companyCIN: string;
  companyName: string;
  dateOfIncorporation: Date;
  directorDIN: string;
  directorFirstName: string;
  directorLastName: string;
  directorEmail: string;
  funnelStatus: 'active' | 'inactive';
  campaigns: {
    index: number;
    scheduledDate: Date;
    status: 'pending' | 'sent';
    sentDate?: Date | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignSearchQuery {
  funnelStatus?: string;
  companyName?: string;
  directorName?: string;
  directorEmail?: string;
  companyCIN?: string;
  directorDIN?: string;
  dateOfIncorporation?: string; // Single date
  startDate?: string; // Start of range
  endDate?: string; // End of range
  sort?: 'asc' | 'desc';
}

export interface CampaignFilters {
  incorporationStartDate?: string;
  incorporationEndDate?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  sentStartDate?: string;
  sentEndDate?: string;
  directorEmail?: string;
  companyName?: string;
  directorDIN?: string;
  companyCIN?: string;
  directorName?: string;
}

export interface CampaignStatus {
  name: string;
  value: number;
}

export interface ChartDataItem {
  period: string;
  pending: number;
  sent: number;
  total: number;
}

export interface CampaignOverviewStats {
  totalCompanies: number;
  totalDirectors: number;
  activeFunnelCompanies: number;
  activeFunnelDirectors: number;
  pendingCampaignCount: number;
  sentCampaignCount: number;
  campaignStatusData: CampaignStatus[];
  chartData: ChartDataItem[];
}
