/* eslint-disable camelcase */
import { Schema, model } from 'mongoose';
import {
  TCommonData,
  TFilingFrequency,
  TFilingInfo,
  TGeoCodePlace,
  TGeocodeField,
  TGstFilings,
  TLiabilityDetail,
  TLiabilityRatio,
  TPanDetails,
  TTaxpayerInfo,
  TTurnoverDetails,
} from '../company/company.interface';
import {
  TCompany,
  TCompanyAddress,
  TCompanyData,
  TDirectorData,
  TDirectorRole,
  TIndexChargeData,
  TMasterData,
  TSrnDocument,
  TUpdateLog,
} from './company.interface';

const companyAddressSchema = new Schema<TCompanyAddress>({
  streetAddress: { type: String, required: true },
  streetAddress2: { type: String, required: true },
  streetAddress3: String,
  streetAddress4: String,
  addressType: { type: String, required: true },
  locality: String,
  district: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true },
  officeType: String,
  activeStatus: String,
  establishmentDate: String,
});

const directorRoleSchema = new Schema<TDirectorRole>({
  userName: { type: String, required: true },
  companyId: { type: String, required: true },
  middleName: String,
  firstName: { type: String, required: true },
  cessationDate: String,
  educationalQualification: String,
  birthPlace: String,
  drivingLicenseNumber: String,
  mobileNumber: String,
  directorDeathDate: String,
  fathersFirstName: String,
  membershipNumber: String,
  roleLICValue: String,
  contributionForm: String,
  bodyCorpOutsideIndiaName: String,
  profitSharingPercentage: String,
  nationality: String,
  gender: String,
  roleEffectiveDate: String,
  occupationType: String,
  bodyCorporateType: String,
  din: String,
  isDisqualified: String,
  ucin: String,
  role: String,
  bodyCorpInsideIndiaName: String,
  kmpFlag: String,
  othersEducationalQualification: String,
  companyName: String,
  cin: String,
  opcFlag: String,
  fathersLastName: String,
  dob: String,
  approverId: String,
  fathersMiddleName: String,
  pan: String,
  monetaryContributionValue: String,
  oidFlag: String,
  authorizationStatus: String,
  passportNumber: String,
  residentOfIndia: String,
  userId: String,
  directorFlag: String,
  emailAddress: String,
  shareholdingPercentage: String,
  personType: String,
  areaOfOccupation: String,
  lastName: String,
  citizenOfIndia: String,
  occupation: String,
  opcType: String,
  otherOccupation: String,
  designation: String,
  signatoryAssociationStatus: String,
  currentDesignationDate: String,
});

const companyDataSchema = new Schema<TCompanyData>({
  companyType: { type: String },
  companyOrigin: { type: String },
  registrationNumber: { type: String },
  dateOfIncorporation: { type: String },
  emailAddress: { type: String },
  whetherListedOrNot: { type: String },
  companyCategory: { type: String },
  companySubcategory: { type: String },
  classOfCompany: { type: String },
  authorisedCapital: { type: String },
  paidUpCapital: { type: String },
  numberOfMembers: { type: String },
  dateOfLastAGM: { type: String },
  strikeOff_amalgamated_transferredDate: { type: String },
  llpStatus: { type: String },
  statusUnderCIRP: { type: String },
  numberOfPartners: { type: String },
  numberOfDesignatedPartners: { type: String },
  previousFirm_companyDetails: { type: String },
  totalObligationOfContribution: { type: String },
  mainDivision: { type: String },
  mainDivisionDescription: { type: String },
  statementDate: { type: String },
  BSDefaulter2Yrs: { type: String },
  BSDefaulter3Yrs: { type: String },
  ARDefaulter2Yrs: { type: String },
  ARDefaulter3Yrs: { type: String },
  suspendedAtStockExchange: { type: String },
  MCAMDSCompanyAddress: [companyAddressSchema],
  rocName: { type: String },
  shareCapitalFlag: { type: String },
  maximumNumberOfMembers: { type: String },
  subscribedCapital: { type: String },
  rdName: { type: String },
  rdRegion: { type: String },
  balanceSheetDate: { type: String },
  inc22Aflag: { type: String },
  incorporationDateObj: { type: Date },
});

const directorDataSchema = new Schema<TDirectorData>({
  DIN: {
    type: String,
    required: true,
  },
  PAN: {
    type: String,
    required: true,
  },
  dateOfAppointment: {
    type: String,
    required: true,
  },
  DirectorDisqualified: {
    type: String,
    required: true,
  },
  FirstName: {
    type: String,
    required: true,
  },
  MiddleName: {
    type: String,
    required: true,
  },
  LastName: {
    type: String,
    required: true,
  },
  MCAUserRole: [directorRoleSchema],
  contactAddress: [companyAddressSchema],
});

const commonDataSchema = new Schema<TCommonData>({
  cin: { type: String },
  ucin: { type: String },
  obligatedContribution: { type: String },
  unclassifiedAuthShareCap: { type: Number },
  maxNoOfMembersExcludingProposedEmployees: { type: Number, required: false },
  whetherListedOrNot: { type: String, required: false },
  maximumNumberOfMembers: { type: Number, required: false },
  numberOfMembers: { type: Number, required: false },
  numberOfPartners: { type: Number },
  NoOfMembersExcludingProposedEmployees: { type: Number },
  registrationNumber: { type: Number },
  otherOfficeType: { type: String },
  officeType: { type: String },
  section8LicenseNumber: { type: Number },
  inspectionFlag: { type: String },
  companiesINC22Flag: { type: String },
  inc20AFlag: { type: String },
  inc22AFlag: { type: String },
  amalgamatedDate: { type: Date },
  establishmentDt: { type: Date },
  companyName: { type: String },
  companyIncorporationName: { type: String },
  companyStatus: { type: String },
  status: { type: String },
  ROCName: { type: String },
  dateOfIncorporation: { type: Date },
  statusChangeDate: { type: Date },
  companyCategory: { type: String },
  companySubcategory: { type: String },
  classOfCompany: { type: String },
  emailAddress: { type: String },
  mobile: { type: Number },
  phone: { type: Number },
  paidupCapital: { type: Number },
  authorisedCapital: { type: Number },
  companyType: { type: String },
  type: { type: String },
  pan: { type: String },
  businessActivity: { type: Number },
  smallCompanyFlag: { type: String },
  agmDate: { type: Date },
  dateOfBalanceSheet: { type: Date },
  shareCapitalFlag: { type: String },
  inc24Flag: { type: String },
  numberOfDirectors: { type: Number },
  companyAddress: [
    {
      country: { type: String },
      pincode: { type: Number },
      city: { type: String },
      addressType: { type: String },
      district: { type: String },
      latitude: { type: Number, default: null },
      jurisdictionPoliceStation: { type: String, default: null },
      addressline2: { type: String },
      addressline1: { type: String },
      arealocality: { type: String },
      state: { type: String },
      longitude: { type: Number, default: null },
    },
  ],
  numberOfDesignatedPartners: { type: Number },
  companyOrigin: { type: String },
  holdingCompanyCIN: { type: String },
  vanishFlag: { type: String },
  managementDisputeFlag: { type: String },
  fax: { type: String },
  ROCCode: { type: String },
  listed: { type: String },
  NICCode1: { type: Number },
  NICCode1Desc: { type: String },
  NICCode2: { type: Number },
  NICCode2Desc: { type: String },
  NICCode3: { type: Number },
  NICCode3Desc: { type: String },
});

const indexChargeDataSchema = new Schema<TIndexChargeData>({
  SRN: { type: String },
  chargeId: { type: String },
  chargeHolderName: { type: String },
  dateOfCreation: { type: String },
  dateOfModification: { type: String },
  dateOfSatisfaction: { type: String },
  amount: { type: String },
  StreetAddress: { type: String },
  StreetAddress2: { type: String },
  StreetAddress3: { type: String },
  StreetAddress4: { type: String },
  Country: { type: String },
  Locality: { type: String },
  State: { type: String },
  District: { type: String },
  City: { type: String },
  PostalCode: { type: String },
  registeredName: { type: String },
  propertyIntUnRegdFlag: { type: String },
  chName: { type: String },
  chargeStatus: { type: String },
});

const masterDataSchema = new Schema<TMasterData>({
  companyData: companyDataSchema,
  directorData: [directorDataSchema],
  commonData: commonDataSchema,
  indexChargesData: [indexChargeDataSchema],
});

const companySchema = new Schema<TCompany>({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  cin: { type: String },
  company: { type: String },
  masterData: masterDataSchema,
  md_data: {
    type: Boolean,
    required: true,
  },
});

// SRN Document schema
const PaymentStatusSchema = new Schema({
  status: { type: String, required: true },
  paidOn: String, // Optional
});

const AnnualEFilingFormSchema = new Schema({
  SRN: { type: String, required: true },
  eformName: { type: String, required: true },
  eventDate: { type: String, required: true },
  ServerError: { type: Boolean, required: true },
  paymentStatus: { type: PaymentStatusSchema, required: true },
});

const SrnDocumentSchema = new Schema({
  _id: Schema.Types.ObjectId,
  cin: { type: String, required: true },
  annual_e_filing_forms: [AnnualEFilingFormSchema], // Array of AnnualEFilingForm
});

// ====================== GST & Pan Details Schema ======================

const filingInfoSchema = new Schema<TFilingInfo>(
  {
    fy: String,
    taxp: String,
    mof: String,
    dof: String,
    rtntype: String,
    arn: String,
    status: String,
  },
  { _id: false }
);

const filingFrequencySchema = new Schema<TFilingFrequency>(
  {
    fy: String,
    quarter: String,
    preference: String,
  },
  { _id: false }
);

const turnoverDetailsSchema = new Schema<TTurnoverDetails>(
  {
    fy: String,
    startDate: String,
    endDate: String,
    finalDisplayDate: String,
    aggTurnoverInfoList: [
      {
        pan: String,
        panAggTurnOver: Number,
        panSysTo: Number,
        panEstTo: Number,
        panFinalTo: Number,
        panUserTo: Number,
        gstinUserTo: Number,
        gstinEstTo: Number,
        gstinSysTo: Number,
        gstinFinalTo: Number,
        filingDate: String,
        panOfficerTo: Number,
        gstinOfficerTo: Number,
      },
    ],
    eligible: Boolean,
    filingFlag: Boolean,
  },
  { _id: false }
);

const taxpayerInfoSchema = new Schema<TTaxpayerInfo>(
  {
    ntcrbs: String,
    contacted: {
      name: String,
      mobNum: Number,
      email: String,
    },
    adhrVFlag: String,
    lgnm: String,
    gstin: String,
    gtiFY: String,
    ekycVFlag: String,
    cmpRt: String,
    ctb: String,
    tradeNam: String,
    isFieldVisitConducted: String,
    adhrVdt: String,
    ctj: String,
    percentTaxInCash: String,
    compDetl: Boolean,
    gti: String,
    mandatedeInvoice: String,
    aggreTurnOverFY: String,
    stj: String,
    dty: String,
    aggreTurnOver: String,
    cxdt: String,
    nba: [String],
    rgdt: String,
    sts: String,
    percentTaxInCashFY: String,
    einvoiceStatus: String,
    mbr: [String],
  },
  { _id: false }
);

const geocodeFieldSchema = new Schema<TGeocodeField>(
  {
    addrId: Number,
    addrType: String,
    gstinRefId: String,
    checksum: String,
    stateCd: String,
    entityType: String,
    floorNum: String,
    doorNum: String,
    bldgNam: String,
    streetNam: String,
    areaNam: String,
    cityNam: String,
    latitude: String,
    longitude: String,
    districtNam: String,
    addrStCd: String,
    pinCd: String,
    locality: String,
    landmark: String,
    eloc: String,
    geocodeLevel: String,
    regType: String,
    insertTmstmp: String,
    updateTmstmp: String,
    version: Number,
  },
  { _id: false }
);

// Define the address details schema
const addressDetailsSchema = new Schema(
  {
    adr: String,
    ntr: String,
  },
  { _id: false }
);

// Define the main schema
const geoCodePlaceSchema = new Schema<TGeoCodePlace>(
  {
    gcppbzdtls: {
      adr: String,
      ntr: String,
      geocodefeildwise: geocodeFieldSchema,
    },
    gcadbzdtls: [addressDetailsSchema],
  },
  { _id: false }
);

const liabilityDetailSchema = new Schema<TLiabilityDetail>(
  {
    taxperiod: String,
    liab_pct: Number,
    fy: String,
  },
  { _id: false }
);

const liabilityRatioSchema = new Schema<TLiabilityRatio>(
  {
    curfy: String,
    prevfy: String,
    curtotal: String,
    prevtotal: String,
    curdtls: [liabilityDetailSchema],
    prevdtls: [liabilityDetailSchema],
  },
  { _id: false }
);

const gstFilingsSchema = new Schema<TGstFilings>(
  {
    gstin: String,
    filingInfo: [filingInfoSchema],
    filingFrequency: [filingFrequencySchema],
    turnoverDetails: [turnoverDetailsSchema],
    liabilityRatio: liabilityRatioSchema,
    taxpayerInfo: taxpayerInfoSchema,
    geoCodePlace: geoCodePlaceSchema,
  },
  { _id: false }
);

const panDetailsSchema = new Schema<TPanDetails>(
  {
    cin: { type: String, required: true },
    company: { type: String, required: true },
    pan: { type: String, required: true },
    GstinFound: { type: Boolean, required: true },
    gstin_list: [
      {
        gstin: String,
        authStatus: String,
      },
    ],
    gstinverified: { type: Boolean, required: true },
    filings: [gstFilingsSchema],
    isFirstTimeFetch: { type: Boolean },
    isProcessing: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// updateLog schema
const UpdateLogSchema = new Schema<TUpdateLog>({
  cin: { type: String, required: true },
  isCompanyDataUpdated: { type: String },
  isDirectorDataUpdated: { type: String },
  isSrnDataUpdated: { type: String },
  isVpdV3Updated: { type: String },
  isGstUpdated: { type: String },
  isLLPVpdUpdated: { type: String },
  lastUpdatedOn: { type: Date, default: Date.now },
  createdOn: { type: Date, default: Date.now },
});

// post hook

export const CompanyModel = model<TCompany>('company_data', companySchema, 'company_data');
export const SrnDocumentModel = model<TSrnDocument>('srn_data', SrnDocumentSchema, 'srn_data');
export const UpdateLogModel = model<TUpdateLog>('Update_Scrapper_Log', UpdateLogSchema);
export const PanDetailsModel = model<TPanDetails>('pan_details', panDetailsSchema, 'pan_details');
// export const VpdDataV3DocumentModel = model<TVpdDataV3Documents>(
//   'vpd_Data_V3_2024',
//   vpdDataV3DocumentSchema,
//   'vpd_Data_V3_2024'
// );
