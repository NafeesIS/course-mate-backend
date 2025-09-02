export type TAttachment = {
  name: string;
  s3Url: string;
  storage_account: string;
  container: string;
  azureAttachmentFilename: string;
};
export type TVpdForm = {
  documentCode: number;
  formId: string;
  fileName: string;
  year: number;
  dateOfFiling: string;
  documentCategory: string;
  description: string;
  numberOfPages: number;
  fileSize?: number;
  dscUploadDate: string;
  paymentDate: string;
  fileType: string;
  attachmentLabel: string;
  downloadLink: string;
  fileDownloaded?: boolean;
  s3Url?: string;
  attachments?: TAttachment[];
  attachment_processed?: boolean;
  form8_category_corrected?: boolean;
  eventDate?: string;
  srn?: string;
  storage_account?: string;
  container?: string;
  azureFileName?: string;
};

// export type TVpdDocument = {
//   cin: string;
//   company: string;
//   vpd_data_fetch: boolean;
//   createdAt: Date;
//   vpdDocs: TVpdForm[];
//   allLinksGenerated: boolean; // Add this flag
//   panGenerated: boolean;
//   is_being_processed: boolean;
//   last_updated: Date;
// };

export type TVpdV2Form = {
  document_category: string;
  year_of_filing: string;
  document_name: string;
  date_of_filing: string;
};

export type TVpdV2Document = {
  company_id: string;
  company_name: string;
  documents: TVpdV2Form[];
  last_updated: Date;
  time_taken: number;
  vpd_data: boolean;
  WIP: boolean;
};

export type TVpdV2PaidDocument = {
  cin: string;
  companyName: string;
  categoryCode: string;
  originalDocName: string;
  filingDate: Date;
  docID: string;
  uniqueDocName: string;
  storage_account: null | string;
  container: null | string;
  downloaded: boolean;
  createdAt: Date;
};

interface ILlpAnnualEfilingForm {
  srn: string;
  formId: string;
  eventDate: string;
  status: string;
  paymentDate?: string;
}

export type TLlpDocument = {
  _id: {
    $oid: string;
  };
  effectiveFromDate: string;
  companyStatus: string;
  effectiveToDate: string;
  companyOldName: string;
  cin: string;
  company: string;
  createdAt: Date;
  vpdDocs: TVpdForm[];
  vpd_data_fetch: boolean;
  allLinksGenerated: boolean; // Add this flag
  is_being_processed: boolean;
  last_updated: Date;
  annualEfilingForms: ILlpAnnualEfilingForm[];
  financial_data: ILlpFinancialData;
  srnLastUpdated: Date;
  mca_data_unavailable: boolean;
};

export interface ILlpFinancialDocument {
  fileName: string;
  s3Url: string;
  isAttachment: boolean;
}

export interface ILlpFinancialMetaData {
  fy_end: string;
  stated_on: string;
  doc_type: string;
  unit: string;
  mca_form_id: string;
  documents: ILlpFinancialDocument[];
  standard_display_name: string;
}

export interface ILlpFinancialLiabilities {
  contribution_received: number;
  reserves_and_surplus: number;
  secured_loan: number;
  unsecured_loan: number;
  short_term_borrowing: number;
  trade_payables: number;
  other_liabilities: number;
  other_liabilities_specific: string;
  provisions_for_taxation: number;
  provisions_for_contingencies: number;
  provisions_for_insurance: number;
  other_provisions: number;
  liabilities_total: number;
}

export interface ILlpFinancialAssets {
  gross_fixed_assets: number;
  depreciation_and_amortization: number;
  net_fixed_assets: number;
  investments: number;
  loans_and_advances: number;
  inventories: number;
  trade_receivables: number;
  cash_and_equivalents: number;
  other_assets: number;
  other_assets_specific: string;
  assets_total: number;
}

export interface ILlpFinancialYearData {
  metaData: ILlpFinancialMetaData;
  liabilities: ILlpFinancialLiabilities;
  assets: ILlpFinancialAssets;
  // income_statement: null | any; // You can define a proper type if needed
}

export interface ILlpFinancialData {
  [year: string]: ILlpFinancialYearData;
}

export interface TVpdV3Document {
  // Base document fields (always present)
  documentCode: number;
  formId: string;
  fileName: string;
  year: number;
  dateOfFiling: string;
  documentCategory: string;
  description: string;
  numberOfPages: number;
  fileSize: number;
  dscUploadDate: string;
  paymentDate: string;
  fileType: string;
  attachmentLabel: string;
  company_id: {
    $oid: string;
  };
  cin: string;
  company: string;
  downloadLink: string;
  createdAt: Date;
  updatedAt: Date;

  // Fields added during download/processing (optional)
  azureFileName?: string;
  container?: string;
  errorDoc?: boolean;
  fileDownloaded?: boolean;
  storage_account?: string;
  attachments?: {
    name: string;
    azureAttachmentFilename: string;
    storage_account: string;
    container: string;
    url: string;
  }[];
  attachments_processed?: boolean;

  // Error handling fields (optional)
  processingError?: string;
  lastErrorAt?: Date;
}
