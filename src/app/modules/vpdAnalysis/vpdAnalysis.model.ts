/* eslint-disable camelcase */
import mongoose, { Schema, model } from 'mongoose';
import {
  ILlpFinancialAssets,
  ILlpFinancialDocument,
  ILlpFinancialLiabilities,
  ILlpFinancialMetaData,
  ILlpFinancialYearData,
  TAttachment,
  TLlpDocument,
  TVpdForm,
  TVpdV2Document,
  TVpdV2Form,
  TVpdV2PaidDocument,
  TVpdV3Document,
} from './vpdAnalysis.interface';

const VpdAttachmentSchema = new Schema<TAttachment>({
  name: String,
  s3Url: String,
  storage_account: String,
  container: String,
  azureAttachmentFilename: String,
});

const VpdFormSchema = new Schema<TVpdForm>({
  documentCode: Number,
  formId: String,
  fileName: String,
  year: Number,
  dateOfFiling: String,
  documentCategory: String,
  description: String,
  numberOfPages: Number,
  fileSize: Number,
  dscUploadDate: String,
  paymentDate: String,
  fileType: String,
  attachmentLabel: String,
  downloadLink: String,
  fileDownloaded: Boolean,
  s3Url: String,
  attachments: [VpdAttachmentSchema],
  attachment_processed: Boolean,
  form8_category_corrected: Boolean,
  eventDate: String,
  srn: String,
  storage_account: String,
  container: String,
  azureFileName: String,
});

// const VpdDocumentSchema = new Schema<TVpdDocument>({
//   cin: String,
//   company: String,
//   vpd_data_fetch: Boolean,
//   createdAt: Date,
//   vpdDocs: [VpdFormSchema],
//   allLinksGenerated: { type: Boolean, default: false }, // Add this flag
//   panGenerated: { type: Boolean, default: false },
//   is_being_processed: { type: Boolean, default: false },
//   last_updated: { type: Date, default: Date.now },
// });

const VpdV2FormSchema = new Schema<TVpdV2Form>({
  document_category: String,
  year_of_filing: String,
  document_name: String,
  date_of_filing: String,
});

const VpdV2DocumentSchema = new Schema<TVpdV2Document>({
  company_id: String,
  company_name: String,
  documents: [VpdV2FormSchema],
  last_updated: Date,
  time_taken: Number,
  vpd_data: Boolean,
  WIP: Boolean,
});

const LlpAnnualEfilingFormSchema: Schema = new Schema({
  srn: { type: String, required: true },
  formId: { type: String, required: true },
  eventDate: { type: String, required: true },
  status: { type: String, required: true },
  paymentDate: { type: String, default: null },
});

const LlpFinancialDocumentSchema = new Schema<ILlpFinancialDocument>({
  fileName: String,
  s3Url: String,
  isAttachment: Boolean,
});

const LlpFinancialMetaDataSchema = new Schema<ILlpFinancialMetaData>({
  fy_end: String,
  stated_on: String,
  doc_type: String,
  unit: String,
  mca_form_id: String,
  documents: [LlpFinancialDocumentSchema],
  standard_display_name: String,
});

const LlpFinancialLiabilitiesSchema = new Schema<ILlpFinancialLiabilities>({
  contribution_received: Number,
  reserves_and_surplus: Number,
  secured_loan: Number,
  unsecured_loan: Number,
  short_term_borrowing: Number,
  trade_payables: Number,
  other_liabilities: Number,
  other_liabilities_specific: String,
  provisions_for_taxation: Number,
  provisions_for_contingencies: Number,
  provisions_for_insurance: Number,
  other_provisions: Number,
  liabilities_total: Number,
});

const LlpFinancialAssetsSchema = new Schema<ILlpFinancialAssets>({
  gross_fixed_assets: Number,
  depreciation_and_amortization: Number,
  net_fixed_assets: Number,
  investments: Number,
  loans_and_advances: Number,
  inventories: Number,
  trade_receivables: Number,
  cash_and_equivalents: Number,
  other_assets: Number,
  other_assets_specific: String,
  assets_total: Number,
});

const LlpFinancialYearDataSchema = new Schema<ILlpFinancialYearData>({
  metaData: LlpFinancialMetaDataSchema,
  liabilities: LlpFinancialLiabilitiesSchema,
  assets: LlpFinancialAssetsSchema,
  // income_statement: Schema.Types.Mixed, // Since it's currently null, using Mixed type
});

const LlpVpdDocumentSchema = new Schema<TLlpDocument>({
  _id: mongoose.SchemaTypes.ObjectId,
  effectiveFromDate: String,
  companyStatus: String,
  effectiveToDate: String,
  companyOldName: String,
  cin: String,
  company: String,
  createdAt: {
    type: Date,
  },
  vpdDocs: [VpdFormSchema],
  vpd_data_fetch: Boolean,
  allLinksGenerated: { type: Boolean, default: false }, // Add this flag
  is_being_processed: { type: Boolean },
  annualEfilingForms: [LlpAnnualEfilingFormSchema],
  srnLastUpdated: Date,
  mca_data_unavailable: { type: Boolean },
  financial_data: {
    type: Map,
    of: LlpFinancialYearDataSchema,
  },
});

const McaAuthTokenSchema = new Schema({
  // token: String,
  tokenMD5: String,
  csrfToken: String,
  sessionID: String,
  // expirySessionToken: Date,
  expirySessionMD5: Date,
  expirySessionID: Date,
  savedAt: { type: Date, default: Date.now },
});

const GSTAuthTokenSchema = new Schema({
  token: String,
  // expires: Date,
  updatedAt: { type: Date, default: Date.now },
});

const VpdV2PaidDocumentSchema = new Schema<TVpdV2PaidDocument>({
  cin: String,
  companyName: String,
  categoryCode: String,
  originalDocName: String,
  filingDate: Date,
  docID: String,
  uniqueDocName: String,
  storage_account: String,
  container: String,
  downloaded: Boolean,
  createdAt: Date,
});

const VpdV3attachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    azureAttachmentFilename: { type: String, required: true },
    storage_account: { type: String, required: true },
    container: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const vpdV3DocumentSchema = new Schema<TVpdV3Document>(
  {
    // Base document fields
    documentCode: { type: Number, required: true },
    formId: { type: String, required: true },
    fileName: { type: String, required: true },
    year: { type: Number, required: true },
    dateOfFiling: { type: String, required: true },
    documentCategory: { type: String, required: true },
    description: { type: String, required: true },
    numberOfPages: { type: Number, required: true },
    fileSize: { type: Number, required: true },
    dscUploadDate: { type: String, required: true },
    paymentDate: { type: String, required: true },
    fileType: { type: String, required: true },
    attachmentLabel: { type: String, required: true },
    company_id: { type: Schema.Types.ObjectId, required: true },
    cin: { type: String, required: true },
    company: { type: String, required: true },
    downloadLink: { type: String, required: true },
    // Download/processing fields
    azureFileName: { type: String },
    container: { type: String },
    errorDoc: { type: Boolean },
    fileDownloaded: { type: Boolean },
    storage_account: { type: String },
    attachments: [VpdV3attachmentSchema],
    attachments_processed: { type: Boolean },
    // Error handling fields
    processingError: { type: String },
    lastErrorAt: { type: Date },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
    versionKey: false, // Removes the __v field
  }
);

export const VpdV3DocumentModel = model<TVpdV3Document>(
  'vpd_docs_flat_v3_2025',
  vpdV3DocumentSchema,
  'vpd_docs_flat_v3_2025'
);

export const VpdDocumentV2 = model<TVpdV2Document>('vpdDataNEW', VpdV2DocumentSchema, 'vpdDataNEW');

export const VpdV2PaidDocumentModel = model<TVpdV2PaidDocument>(
  'vpd_data_v2_paid',
  VpdV2PaidDocumentSchema,
  'vpd_data_v2_paid'
);

export const LlpVpdDocument = model<TLlpDocument>(
  'llp_data_2024',
  LlpVpdDocumentSchema,
  'llp_data_2024'
);

export const McaAuthToken = model('mca_auth_token', McaAuthTokenSchema, 'mca_auth_token');
export const GSTAuthToken = model('gst_auth_token', GSTAuthTokenSchema, 'gst_auth_token');
