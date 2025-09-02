import { TDirectorAddress } from '../director/director.interface';

export type TCompanyAddress = {
  streetAddress: string;
  streetAddress2: string;
  streetAddress3: string;
  streetAddress4: string;
  addressType: string;
  locality: string;
  district: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  officeType: string;
  activeStatus?: string;
  establishmentDate?: string;
};

export type TDirectorRole = {
  userName: string;
  companyId: string;
  middleName: string;
  firstName: string;
  cessationDate: string;
  educationalQualification: string;
  birthPlace: string;
  drivingLicenseNumber: string;
  mobileNumber: string;
  directorDeathDate: string;
  fathersFirstName: string;
  membershipNumber: string;
  roleLICValue: string;
  contributionForm: string;
  bodyCorpOutsideIndiaName: string;
  profitSharingPercentage: string;
  nationality: string;
  gender: string;
  roleEffectiveDate: string;
  occupationType: string;
  bodyCorporateType: string;
  din: string;
  isDisqualified: string;
  ucin: string;
  role: string;
  bodyCorpInsideIndiaName: string;
  kmpFlag: string;
  othersEducationalQualification: string;
  companyName: string;
  cin: string;
  opcFlag: string;
  fathersLastName: string;
  dob: string;
  approverId: string;
  fathersMiddleName: string;
  pan: string;
  monetaryContributionValue: string;
  oidFlag: string;
  authorizationStatus: string;
  passportNumber: string;
  residentOfIndia: string;
  userId: string;
  directorFlag: string;
  emailAddress: string;
  shareholdingPercentage: string;
  personType: string;
  areaOfOccupation: string;
  lastName: string;
  citizenOfIndia: string;
  occupation: string;
  opcType: string;
  otherOccupation: string;
  designation: string;
  signatoryAssociationStatus: string;
  currentDesignationDate: string;
  DIR3KYCFiledFlag?: string;
};

export type TCompanyData = {
  companyType: string;
  companyOrigin: string;
  registrationNumber: string;
  dateOfIncorporation: string;
  emailAddress: string;
  whetherListedOrNot: string;
  companyCategory: string;
  companySubcategory: string;
  classOfCompany: string;
  authorisedCapital: string;
  paidUpCapital: string;
  numberOfMembers: string;
  dateOfLastAGM: string;
  strikeOff_amalgamated_transferredDate: string;
  llpStatus: string;
  statusUnderCIRP: string;
  numberOfPartners: string;
  numberOfDesignatedPartners: string;
  previousFirm_companyDetails: string;
  totalObligationOfContribution: string;
  mainDivision: string;
  mainDivisionDescription: string;
  statementDate: string;
  BSDefaulter2Yrs: string;
  BSDefaulter3Yrs: string;
  ARDefaulter2Yrs: string;
  ARDefaulter3Yrs: string;
  suspendedAtStockExchange: string;
  MCAMDSCompanyAddress: TCompanyAddress[];
  rocName: string;
  shareCapitalFlag: string;
  maximumNumberOfMembers: string;
  subscribedCapital: string;
  rdName: string;
  rdRegion: string;
  balanceSheetDate: string;
  inc22Aflag: string;
  incorporationDateObj: Date;
};

export type TDirectorData = {
  DIN: string;
  PAN: string;
  dateOfAppointment: string;
  DirectorDisqualified: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
  MCAUserRole: TDirectorRole | TDirectorRole[];
  contactAddress: TCompanyAddress[];
  directorAddress: TDirectorAddress[];
};

export type TCommonData = {
  cin: string;
  ucin: string;
  obligatedContribution: number | null;
  unclassifiedAuthShareCap: number; //TODO: check type
  maxNoOfMembersExcludingProposedEmployees: number | null; //TODO: check type
  whetherListedOrNot: string | null;
  maximumNumberOfMembers: number | null;
  numberOfMembers: number | null;
  numberOfPartners: number;
  NoOfMembersExcludingProposedEmployees: number | null;
  registrationNumber: number;
  otherOfficeType: string | null;
  officeType: string | null;
  section8LicenseNumber: number | null;
  inspectionFlag: string | null;
  companiesINC22Flag: string;
  inc22AFlag: string | null;
  amalgamatedDate: { $date: string } | null;
  establishmentDt: { $date: string } | null;
  companyName: string;
  companyIncorporationName: string;
  companyStatus: string;
  status: string;
  ROCName: string;
  dateOfIncorporation: {
    $date: string;
  };
  statusChangeDate: {
    $date: string;
  };
  companyCategory: string;
  companySubcategory: string;
  classOfCompany: string;
  emailAddress: string;
  mobile: number | null;
  phone: number | null;
  paidupCapital: number;
  authorisedCapital: number;
  companyType: string;
  type: string;
  pan: string;
  businessActivity: number;
  smallCompanyFlag: string;
  agmDate: { $date: string } | null;
  dateOfBalanceSheet: { $date: string } | null;
  shareCapitalFlag: string;
  inc20AFlag: string;
  inc24Flag: string | null;
  numberOfDirectors: number;
  companyAddress: Array<{
    country: string;
    pincode: number;
    city: string;
    addressType: string;
    district: string;
    latitude: number | null;
    jurisdictionPoliceStation: string | null;
    addressline2: string;
    addressline1: string;
    arealocality: string;
    state: string;
    longitude: number | null;
  }>;
  numberOfDesignatedPartners: number;
  companyOrigin: string;
  holdingCompanyCIN: string | null;
  vanishFlag: string | null;
  managementDisputeFlag: string;
  fax: string | null;
  ROCCode: string;
  listed: string;
  NICCode1: number;
  NICCode1Desc: string;
  NICCode2: number;
  NICCode2Desc: string;
  NICCode3: number | null;
  NICCode3Desc: string | null;
};

export interface TIndexChargeData {
  SRN: string;
  chargeId: string;
  chargeHolderName: string;
  dateOfCreation: string;
  dateOfModification: string;
  dateOfSatisfaction: string;
  amount: string;
  StreetAddress: string;
  StreetAddress2: string;
  StreetAddress3: string;
  StreetAddress4: string;
  Country: string;
  Locality: string;
  State: string;
  District: string;
  City: string;
  PostalCode: string;
  registeredName: string;
  propertyIntUnRegdFlag: string;
  chName: string;
  chargeStatus: 'Open' | 'Satisfied' | string; // Assuming there are limited options for chargeStatus, adjust as necessary
}

export type TMasterData = {
  companyData: TCompanyData;
  directorData: TDirectorData[];
  commonData: TCommonData;
  indexChargesData: TIndexChargeData[];
};

interface ChargeData {
  totalOpenCharges?: number;
  totalSatisfiedCharges?: number;
  totalLenders?: number;
  lastChargeDate?: string;
  lastChargeAmount?: number;
  messageForNoCharge?: string;
}

export type DirectorResponse = {
  din: string;
  fullName: string;
  dateOfAppointment: string;
  designation: string;
  totalDirectorship: number;
  isPromoter: boolean;
};

export interface PastDirectorResponse {
  din: string;
  fullName: string;
  designation: string;
  appointmentDate: string;
  cessationDate: string;
}

export type AssociatedCompany = {
  cin_LLPIN: string;
  nameOfTheCompany: string;
  companyStatus: string;
};

export type TCompany = {
  _id: {
    $oid: string;
  };
  cin: string;
  company: string;
  masterData: TMasterData;
  md_data: boolean;
  companyType?: string;
  companyOrigin?: string;
  registrationNumber?: string;
  about?: string;
  incorporationDate?: string;
  category?: string;
  state?: string;
  classOfCompany?: string;
  dateOfIncorporation?: string;
  incorporationAge?: number;
  authorizedCapital?: string;
  companySubcategory?: string;
  listingStatus?: string;
  paidUpCapital?: string;
  formattedAuthorizedCapital?: string;
  formattedPaidUpCapital?: string;
  totalObligationOfContribution?: string;
  email?: string;
  indexChargesData?: TIndexChargeData[];
  chargeData?: ChargeData;
  companyAddresses?: TCompanyAddress[] | undefined;
  address?: {
    registeredAddress: string;
    pinCode: string;
    city?: string | undefined;
  };
  status?: string;
  rocCode?: string;
  industry?: string;
  directorData?: TDirectorData[];
  currentDirectors?: DirectorResponse[];
  pastDirectors?: PastDirectorResponse[] | undefined;
  executiveTeam?: DirectorResponse[];
  associatedCompanies?: AssociatedCompany[];
  website: string;
};

export interface TCompanyDetailsResponse extends TCompany {
  cin: string;
  company: string;
  about?: string;
  incorporationDate?: string;
  category?: string;
  state?: string;
  classOfCompany?: string;
  dateOfIncorporation?: string;
  authorizedCapital?: string;
  paidUpCapital?: string;
  formattedAuthorizedCapital?: string;
  formattedPaidUpCapital?: string;
  chargedData: ChargeData;
}

export interface TLlpDocument {
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
  fileDownloaded?: boolean;
  s3Url?: string;
  downloadLink: string;
  additionalFees?: number;
  fy_year?: string;
  normalFees?: number;
  srn?: string;
  eventDate?: string; // from TLlpAnnualEfilingForm
  status?: string; // from TLlpAnnualEfilingForm
}

export interface TLlpAnnualEfilingForm {
  srn: string;
  formId: string;
  eventDate: string;
  status: string;
  paymentDate: string;
  dateOfFiling?: string; // from TLlpDocument
  normalFees?: number; // from TLlpDocument
  additionalFees?: number; // from TLlpDocument
  s3Url?: string; // from TLlpDocument
}

export interface TLlpData {
  _id: {
    $oid: string;
  };
  effectiveFromDate: string;
  companyStatus: string;
  effectiveToDate: string;
  companyOldName: string;
  cin: string;
  company: string;
  createdAt: {
    $date: string;
  };
  vpdDocs: TLlpDocument[];
  vpd_data_fetch: boolean;
  is_being_processed: boolean;
  allLinksGenerated: boolean;
  last_updated: {
    $date: string;
  };
  fetch_status: boolean;
  isFirstTimeFetch: boolean;
  srnLastUpdated: {
    $date: string;
  };
  annualEfilingForms: TLlpAnnualEfilingForm[];
}

// ---------------->> Compliance Related Interface <<----------------
export interface TAOC4CalculationResult {
  financialYearStart: Date;
  financialYearEnd: Date;
  financialYearString: string;
  agmDate: Date;
  dueDate: Date;
}

type TPaymentStatus = {
  status: string;
  paidOn?: string; // Optional because "EXPIRED" status does not have a "paidOn" date
  normalFee: number;
  additionalFee?: number;
  financialYearEnding: string;
};

export type TAnnualEFilingForm = {
  SRN: string;
  eformName: string;
  eventDate: string;
  ServerError: boolean;
  paymentStatus: TPaymentStatus;
};

export type TSrnDocument = {
  _id: string;
  cin: string;
  annual_e_filing_forms: TAnnualEFilingForm[];
  // fetch_status: boolean;
  // lastUpdated: Date;
  isFirstTimeFetch: boolean;
  is_being_processed: boolean;
};

export type TAnnualEFilingFormResponse = {
  formCode: string;
  formName?: string;
  formDescription?: string;
  isSmallLiabilityPartnership?: boolean;
  incorpDate?: string;
  financialYear: string;
  dueDate: string;
  isLateAgmHeld?: boolean;
  agmDate?: string;
  periodOfDelay?: number;
  filingStatus?: string;
  filingDate: string;
  normalFee: number;
  additionalFee: number;
  message?: string;
  isAdditionalFeeManuallyAdded?: boolean;
};
export type TOneTimeComplianceResponse = {
  formCode: string;
  formName?: string;
  formDescription?: string;
  dueDate: string;
  filingStatus?: string;
  filingDate: string;
  normalFee: string;
  additionalFee: string;
  isApplicable: boolean;
  isFirstTimeUpdate?: boolean;
};

// ---------------->> Update company Data Related Interface <<----------------

export type TUpdateLog = {
  cin: string;
  isCompanyDataUpdated: string;
  isDirectorDataUpdated: string;
  isSrnDataUpdated?: string;
  isVpdV3Updated: string;
  isGstUpdated: string;
  isLLPVpdUpdated: string;
  lastUpdatedOn: Date;
  createdOn: Date;
};

export type TLamdaScrapperResponse = {
  cin: string;
  isCompanyDataUpdated: string;
  isDirectorDataUpdated: string;
  isSrnDataUpdated?: string;
  lastUpdatedOn: Date;
  createdOn: Date;
};

//============================================= GST & PAN Related Interfaces =============================================
export interface TFilingInfo {
  fy: string;
  taxp: string;
  mof: string;
  dof: string;
  rtntype: string;
  arn: string;
  status: string;
}

export interface TFilingFrequency {
  fy: string;
  quarter: string;
  preference: string;
}

export interface TTurnoverDetails {
  fy: string;
  startDate: string;
  endDate: string;
  finalDisplayDate: string;
  aggTurnoverInfoList: {
    pan: string;
    panAggTurnOver: number;
    panSysTo: number;
    panEstTo: number;
    panFinalTo: number;
    panUserTo: number;
    gstinUserTo: number;
    gstinEstTo: number;
    gstinSysTo: number;
    gstinFinalTo: number;
    filingDate: string;
    panOfficerTo: number;
    gstinOfficerTo: number;
  }[];
  eligible: boolean;
  filingFlag: boolean;
}

export interface TContacted {
  name: string;
  mobNum: number;
  email: string;
}

export interface TTaxpayerInfo {
  ntcrbs: string;
  contacted: TContacted;
  adhrVFlag: string;
  lgnm: string;
  gstin: string;
  gtiFY: string;
  ekycVFlag: string;
  cmpRt: string;
  ctb: string;
  tradeNam: string;
  isFieldVisitConducted: string;
  adhrVdt: string;
  ctj: string;
  percentTaxInCash: string;
  compDetl: boolean;
  gti: string;
  mandatedeInvoice: string;
  aggreTurnOverFY: string;
  stj: string;
  dty: string;
  aggreTurnOver: string;
  cxdt: string;
  nba: string[];
  rgdt: string;
  sts: string;
  percentTaxInCashFY: string;
  einvoiceStatus: string;
  mbr: string[];
}

export interface TGeocodeField {
  addrId: number;
  addrType: string;
  gstinRefId: string;
  checksum: string;
  stateCd: string;
  entityType: string;
  floorNum: string;
  doorNum: string;
  bldgNam: string;
  streetNam: string;
  areaNam: string;
  cityNam: string;
  latitude: string;
  longitude: string;
  districtNam: string;
  addrStCd: string;
  pinCd: string;
  locality: string;
  landmark: string;
  eloc: string;
  geocodeLevel: string;
  regType: string;
  insertTmstmp: string;
  updateTmstmp: string;
  version: number;
}

interface AddressDetails {
  adr: string;
  ntr: string;
}

export interface TGeoCodePlace {
  gcppbzdtls: {
    adr: string;
    ntr: string;
    geocodefeildwise: TGeocodeField;
  };
  gcadbzdtls: AddressDetails[];
}

export interface TLiabilityDetail {
  taxperiod: string;
  liab_pct: number;
  fy: string;
}

export interface TLiabilityRatio {
  curfy: string;
  prevfy: string;
  curtotal: string;
  prevtotal: string;
  curdtls: TLiabilityDetail[];
  prevdtls: TLiabilityDetail[];
}

export interface TGstFilings {
  gstin: string;
  filingInfo: TFilingInfo[];
  filingFrequency: TFilingFrequency[];
  turnoverDetails: TTurnoverDetails[];
  liabilityRatio: TLiabilityRatio;
  taxpayerInfo: TTaxpayerInfo;
  geoCodePlace: TGeoCodePlace;
}

export interface TGstinList {
  gstin: string;
  authStatus: string;
}

export interface TPanDetails {
  cin: string;
  company: string;
  pan: string;
  GstinFound: boolean;
  gstin_list: TGstinList[];
  gstinverified: boolean;
  filings: TGstFilings[];
  isFirstTimeFetch?: boolean;
  isProcessing?: boolean;
}

export interface TGSTComplianceResponse {
  gstin: string;
  filings: {
    rtntype: string;
    fy: string;
    taxPeriod: string;
    filingFreq: 'Monthly' | 'Quarterly' | null;
    dueDate: string;
    filingDate: string;
    status: string;
    lateFee: number;
    periodOfDelay: number;
  }[];
}

// ============================>>> type for single company details response <<<=============================
export type TCompanyBasicInfo = {
  cin: string;
  company: string;
  companyType: string;
  companyOrigin: string;
  category: string;
  registrationNumber: string;
  classOfCompany: string;
  status: string;
  state: string;
  incorporationAge: string;
  rocCode: string;
  dateOfIncorporation: string;
  companySubcategory: string;
  listingStatus: string;
  industry: string;
  authorizedCapital: string;
  paidUpCapital: string;
  address: string;
  currentDirectors: string[];
  about: string;
};

type TCompanySubscribedInfo = {
  email: string;
  chargeData: ChargeData; // Adjust this type based on the structure of chargeData
  pastDirectors: string[];
  executiveTeam: string[];
  associatedCompanies: string[];
};

export type TCompanyInfoResponse = {
  basicInfo: TCompanyBasicInfo;
  subscribedInfo?: TCompanySubscribedInfo; // Optional if not always present
};

// interfaces for public document response
export type TPublicDocumentCategory = 'financial' | 'charge' | 'incorporation' | 'scanned';

export interface IPublicDocumentAttachment {
  name: string;
  downloadUrl: string | null;
}
export interface IPublicDocumentResponse {
  formId: string;
  fileName: string;
  documentCategory: string;
  filingDate: string;
  financialYear: string;
  sizeKB: number;
  numberOfPages: number;
  downloadUrl: string | null;
  attachments?: IPublicDocumentAttachment[];
  attachmentLabel: string;
}
