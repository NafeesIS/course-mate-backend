/* eslint-disable quotes */
export const companySearchSuggestionProjectStage = {
  $project: {
    cin: '$cin',
    company: '$company',
    category: '$masterData.companyData.companyCategory',
    classOfCompany: '$masterData.companyData.classOfCompany',
    status: '$masterData.companyData.llpStatus',
    state: { $arrayElemAt: ['$masterData.companyData.MCAMDSCompanyAddress.state', 0] },
    incorporationAge: {
      $dateDiff: {
        startDate: {
          $dateFromString: {
            dateString: '$masterData.companyData.dateOfIncorporation',
            format: '%m/%d/%Y',
          },
        },
        endDate: '$$NOW',
        unit: 'month',
      },
    },
    score: { $meta: 'searchScore' },
    highlight: { $meta: 'searchHighlights' },
  },
};

export const dashboardCompanySearchSuggestionProjectStage = {
  $project: {
    cin: '$cin',
    company: '$company',
    // category: '$masterData.companyData.companyCategory',
    // classOfCompany: '$masterData.companyData.classOfCompany',
    companyType: '$masterData.companyData.companyType',
    companyOrigin: '$masterData.companyData.companyOrigin',
    // status: '$masterData.companyData.llpStatus',
    // state: { $arrayElemAt: ['$masterData.companyData.MCAMDSCompanyAddress.state', 0] },
    // incorporationAge: {
    //   $dateDiff: {
    //     startDate: {
    //       $dateFromString: {
    //         dateString: '$masterData.companyData.dateOfIncorporation',
    //         format: '%m/%d/%Y',
    //       },
    //     },
    //     endDate: '$$NOW',
    //     unit: 'month',
    //   },
    // },
    directorData: '$masterData.directorData',

    score: { $meta: 'searchScore' },
    highlight: { $meta: 'searchHighlights' },
  },
};

export const eligibleDirectorDesignations = [
  'Nominee Director',
  'Managing Director',
  'Additional Director',
  'Whole-time director',
  'Alternate Director',
  'Director appointed in casual vacancy',
  'Director',
  'Designated Partner',
  'Nominee for Body corporate designated partner',
  'Authorised Representative',
];

export const formCodes: { [key: string]: { formDescription: string; formName: string } } = {
  'CRA-4': {
    formDescription:
      "It's an official document used by companies to submit their cost audit findings and analysis to the Central Government as part of regulatory compliance.",
    formName: 'Form for filing Cost Audit Report with the Central Government.',
  },
  'CRA-2': {
    formDescription:
      "It's an official document a company uses to inform the government about appointing a cost auditor, ensuring compliance with regulatory requirements.",
    formName:
      'Form of intimation of appointment of cost auditor by the company to Central Government.',
  },
  'CG-1': {
    formDescription:
      "It's a request for forgiveness or leniency when a deadline is missed or a requirement isn't met, typically in a legal or administrative context.",
    formName: 'Form for filing application or documents with Central Government',
  },
  ADJ: {
    formDescription: 'Document outlining the grounds and details of an appeal.',
    formName: 'Memorandum of Appeal',
  },
  'RD-1': {
    formDescription: 'Documents submitted for approval or requests to the Regional Director.',
    formName: 'Applications made to Regional Director',
  },
  'MSC-4': {
    formDescription: 'Application for seeking status of active company',
    formName: 'Application for seeking status of active company',
  },
  'MSC-3': {
    formDescription:
      'Filing to update regulators on the status of dormant companies, confirming their inactive state as per legal requirements',
    formName: 'Return of dormant companies',
  },
  'MSC-1': {
    formDescription:
      'Applying to Registrar for dormant company status, a simplified request for approval.',
    formName: 'Application to Registrar for obtaining the status of dormant company',
  },
  'MSME FORM 1': {
    formDescription:
      'It is a half-yearly return that the specified companies need to file regarding their outstanding payments to the MSME.',
    formName:
      'Form for furnishing half yearly return with the registrar in respect of outstanding payments to Micro or Small Enterprise.',
  },
  FTE: {
    formDescription:
      'Request for company name removal under Fast Track Exit (FTE) Mode. Simplified application for approval.',
    formName:
      'Application for striking off the name of company under the Fast Track Exit(FTE) Mode',
  },
  'FC-4': {
    formDescription:
      'Yearly report, where a foreign company reveals its activities in compliance with regulatory frameworks.',
    formName: 'Annual Return of a Foreign company',
  },
  'FC-3': {
    formDescription:
      'Submission of annual accounts and list of business locations in India by foreign company.',
    formName:
      'Annual accounts along with the list of all principal places of business in India established by foreign company',
  },
  'FC-2': {
    formDescription:
      'Form for foreign company to report changes in registration documents. Seeking approval for updated details.',
    formName: 'Return of alteration in the documents filed for registration by foreign company',
  },
  'CHG-9': {
    formDescription:
      'Application to register changes or creation of financial obligations (debentures) and fix any mistakes.',
    formName:
      'Application for registration of creation or modification of charge for debentures or rectification of particulars filed in respect of creation or modification of charge for debetures',
  },
  'CHG-8': {
    formDescription:
      'Request to the Central Government for more time to file or correct charge registration information."',
    formName:
      'Application to Central Government for extension of time for filing particulars of registration of creation / modification / satisfaction of charge OR for rectification of omission or misstatement of any particular in respect of creation/ modification/ satisfaction of charge',
  },
  'CHG-6': {
    formDescription:
      "Notification of appointing or ceasing a receiver/manager for a company's affairs. Official communication.",
    formName: 'Notice of appointment or cessation of receiver or manager',
  },
  'CHG-4': {
    formDescription:
      'Notification to the Registrar about details for completing a financial obligation.',
    formName: 'Particulars for satisfaction of charge thereof',
  },
  'CHG-1': {
    formDescription:
      "It's a formal request to officially document a financial arrangement or change, typically related to loans or credit, excluding debentures.",
    formName:
      'Application for registration of creation, modification of charge (other than those related to debentures)',
  },
  'DIR-12': {
    formDescription:
      'Details about directors and important personnel hired, including any updates.',
    formName:
      'Particulars of appointment of Directors and the key managerial personnel and the changes among them',
  },
  'DIR-11': {
    formDescription: 'Official notice from a director to the Registrar about their resignation.',
    formName: 'Notice of resignation of a director to the Registrar',
  },
  'DIR-10': {
    formDescription:
      'Request to take away disqualified directors from their positions.	Request to take away disqualified directors from their positions.',
    formName: 'Form of application for removal of disqualification of directors',
  },
  'DIR-9': {
    formDescription: 'The company must inform the Registrar if a director gets disqualified.',
    formName: 'A Report by a company to ROC for intimating the disqualification of the director',
  },
  'DIR-6': {
    formDescription:
      'Notifying about updates to the information provided in the Director Identification Number (DIN) application.',
    formName:
      'Intimation of change in particulars of Director to be given to the Central Government',
  },
  'DIR-5': {
    formDescription: 'Request to give up Director Identification Number (DIN).',
    formName: 'Application for surrender of Director Identification Number',
  },
  'DIR-3C': {
    formDescription:
      "Notification by the company to the Registrar about a Director's Identification Number (DIN).",
    formName:
      'Intimation of Director Identification Number by the company to the Registrar DIN services',
  },
  'DIR-3': {
    formDescription:
      'Request for a unique identification number (DIN) to become a director in an already existing company.',
    formName: 'Application for allotment of Director Identification Number',
  },
  'DIR-2': {
    formDescription: 'Agreeing to be a Company Director.',
    formName: 'Consent to act as a director of a company',
  },
  'INC-29': {
    formDescription:
      'Comprehensive form for integrated incorporation process, streamlining details for new business registration.',
    formName: 'Integrated Incorporation Form',
  },
  'INC-28': {
    formDescription:
      "Official announcement to inform about a court or competent authority's order.",
    formName: 'Notice of Order of the Court or any other competent authority',
  },
  'INC-27': {
    formDescription:
      'Application for converting company type: Public to Private or Private to Public. Seeking official approval.',
    formName:
      'Conversion of public company into private company or private company into public company',
  },
  'INC-24': {
    formDescription:
      'Asking the Central Government for permission to change the name of a company through an application.',
    formName: 'Application for approval of Central Government for change of name',
  },
  'INC-23': {
    formDescription:
      "Requesting permission to change a company's registered office location from one place to another within the same state or from one state to another, through an application to the Regional Director.",
    formName:
      'Application to Regional Director for approval to shift the Registered Office from one state to another state or from jurisdiction of one Registrar to another Registrar within the same State',
  },
  'INC-22': {
    formDescription:
      'A notice sent to the registrar authority to cancel or give up a special permission/license given to a company operating for social or charitable purposes.',
    formName: 'Notice of situation or change of situation of registered office',
  },
  'INC-20': {
    formDescription:
      'Notification to the official registry about canceling or giving up a license issued under section 8.',
    formName: 'Intimation to Registrar of revocation/surrender of license issued under section 8',
  },
  'INC-18': {
    formDescription:
      'Seeking approval to transform Section 8 company into a different type. Simplified application for the change.',
    formName:
      'Application to Regional director for conversion of section 8 company into company of any other kind',
  },
  'INC-12': {
    formDescription:
      'Application seeking License under Section 8, aiming to comply with legal requirements for approval.',
    formName: 'Application for grant of License under section 8',
  },
  'INC-11': {
    formDescription:
      'A special paper that officially says a new company has been created and is recognized by the registrar, like a birth certificate for a company',
    formName: ' CERTIFICATE OF INCORPORATION ',
  },
  'INC-7': {
    formDescription:
      'Application for incorporating a company (excluding One Person Company), initiating the official registration process.',
    formName: 'Application for Incorporation of Company (Other than OPC)',
  },
  'INC-6': {
    formDescription:
      'Application to convert One Person Company, simplifying legal transition process for individuals.',
    formName: 'One Person Company- Application for Conversion',
  },
  'INC-5': {
    formDescription:
      'Notice for One Person Company exceeding threshold limits, complying with regulatory requirements and reporting.',
    formName: 'One Person Company- Intimation of exceeding threshold',
  },
  'INC-4': {
    formDescription:
      'Form for changing Member/Nominee details in a One Person Company, ensuring accurate and updated information.',
    formName: 'One Person Company- Change in Member/Nominee',
  },
  'INC-3': {
    formDescription:
      'Nominee Consent Form for a One Person Company, formalizing acknowledgment and approval for nominee role',
    formName: 'One Person Company- Nominee consent form',
  },
  'INC-2': {
    formDescription:
      'Application for creating a One Person Company, initiating the incorporation process for a single-member entity.',
    formName: 'One Person Company- Application for Incorporation',
  },
  'INC-1': {
    formDescription:
      'Request form for reserving a business name, a step towards official name registration process',
    formName: 'Application for reservation of name',
  },
  'URC-1': {
    formDescription:
      "Company's application for registration under Section 366, a formal request for specific legal compliance.",
    formName: 'Application by a company for registration under section 366',
  },
  'FC-1': {
    formDescription:
      'Details to be submitted by a foreign company, ensuring proper information disclosure and legal compliance',
    formName: 'Information to be filed by foreign company',
  },
  'ADT-3': {
    formDescription: "Auditor's official notice of stepping down from their position.",
    formName: 'Notice of Resignation by the Auditor',
  },
  'ADT-2': {
    formDescription: "Company's request to remove the auditor before their term ends.",
    formName: 'Application for removal of auditor(s) from his/their office before expiry of term',
  },
  'ADT-1': {
    formDescription: "Company's notification to the registrar about appointing an auditor.",
    formName: 'Information to the Registrar by Company for appointment of Auditor',
  },
  'DPT-4': {
    formDescription:
      'Report on deposits that were already in place when the Companies Act started.',
    formName: 'Statement regarding deposits existing on the commencement of the Act',
  },
  'DPT-3': {
    formDescription: 'Report on returning deposited money to individuals.',
    formName: 'Return of deposits',
  },
  'DPT-1': {
    formDescription:
      'Announcement in a newspaper inviting people to deposit money.	Announcement in a newspaper inviting people to deposit money.',
    formName: 'Circular or circular in the form of advertisement inviting deposits',
  },
  'SH-11': {
    formDescription:
      "It's a formal report a company submits to authorities, confirming the successful completion of a share or securities buyback with relevant details.",
    formName: 'Return in respect of buy-back of securities',
  },
  'SH-9': {
    formDescription:
      "It's a financial statement a publicly traded company submits to registrar and stock market regulators, confirming their financial capability for share or securities buyback without financial risk.",
    formName: 'Declaration of Solvency',
  },
  'SH-8': {
    formDescription:
      "It's a formal letter a company submits to registrar when they want to repurchase their own shares or securities, outlining the buyback process.",
    formName: 'Letter of offer',
  },
  'SH-7': {
    formDescription:
      "It's a formal notification to registrar about changes in a company's total share value, whether increasing or decreasing.",
    formName: 'Notice to Registrar of any alteration of share capital',
  },
  'GNL-4': {
    formDescription:
      'Supplementary form for fixing errors or completing missing information in a submission.',
    formName: 'Addendum for rectification of defects or incompleteness.',
  },
  'GNL-3': {
    formDescription:
      'Details of individuals, directors, charged, or specified in official documents. Comprehensive information report',
    formName: 'Details of persons/directors/charged/specified',
  },
  'GNL-2': {
    formDescription:
      'A straightforward paperwork process for submitting essential documents to the official Registrar.',
    formName: 'Form for submission of documents with the Registrar.',
  },
  'GNL-1': {
    formDescription:
      'Submitted applications to Registrar of Companies, seeking approvals and necessary actions',
    formName: 'Applications made to Registrar of Companies',
  },
  'MGT-15': {
    formDescription:
      "It's a document where a company reports important details and outcomes of its annual meeting, usually submitted to regulatory authorities or stakeholders",
    formName: 'Form for filing Report on Annual General Meeting',
  },
  'MGT-14': {
    formDescription:
      "It's the process of submitting a company's important decisions and contracts to a registrar to ensure legal compliance and transparency",
    formName: 'Filing of company resolutions and agreements with the Registrar',
  },
  'MGT-10': {
    formDescription:
      'A report showing if the main owners and top shareholders in a company have changed.',
    formName: 'Changes in shareholding position of promoters and top ten shareholders',
  },
  'MGT-6': {
    formDescription: 'Statement from individuals who have a hidden ownership in shares',
    formName: 'Persons not holding beneficial interest in shares',
  },
  'MGT-7': {
    formDescription:
      'Companies need to submit a yearly summary of their activities and finances to the registrar.',
    formName: 'Form for filing annual return by a company.',
  },
  'MGT-7A': {
    formDescription:
      'Companies need to submit a yearly summary of their activities and finances to the registrar.',
    formName: 'Form for filing annual return by a company.',
  },
  'MGT-3': {
    formDescription: "Notification about moving or stopping a foreign register's location",
    formName:
      'Notice of situation or change of situation or discontinuation of situation,of place where foreign register shall be kept',
  },
  SchV: {
    formDescription:
      'Yearly summary of company activities and finances submitted to the registrar.',
    formName: 'Annual return(other than OPCs and small Companies)',
  },
  ICP: {
    formDescription:
      'Document for reporting and resolving investor concerns with simplicity and clarity.',
    formName: 'INVESTOR COMPLAINT FORM',
  },
  SCP: {
    formDescription:
      'Form to address and address serious complaints, ensuring a prompt and thorough resolution.',
    formName: 'SERIOUS COMPLAINT FORM',
  },
  'MR-2': {
    formDescription:
      "It's an official document that companies use to request approval from the Central Government for appointing or reappointing top executives and determining their compensation packages",
    formName:
      'Form of application to the Central Government for approval of appointment or reappointment and remuneration or increase in remuneration or waiver for excess or over payment to managing director or whole time director or manager and commission or remuneration to directors',
  },
  'MR-1': {
    formDescription:
      "It's a formal document a company submits to report the appointment of key executives like Whole Time Directors, Managing Directors, or Managers to regulatory authorities, ensuring legal compliance.",
    formName: 'Return of appointment of MD/WTD/Manager',
  },
  'AOC-5': {
    formDescription:
      "Notification to provide the address where the company's financial records are kept.",
    formName: 'Notice of address at which books of account are maintained',
  },
  'AOC-4(CFS)': {
    formDescription:
      'A document to file combined financial reports and related documents with the Registrar.',
    formName:
      'Form for filing consolidated financial statements and other documents with the Registrar',
  },
  'AOC-4(XBRL)': {
    formDescription:
      'XBRL file for financial statement and related documents submitted to the Registrar.',
    formName:
      'Form for filing XBRL document in respect of financial statement and other documents with the Registrar.',
  },
  'AOC-4': {
    formDescription:
      "The form use to share financial statements and documents with the registrar is like an official paper of company's important information.",
    formName: 'Form for filing financial statement and other documents with the Registrar',
  },
  Refund: {
    formDescription:
      'Application for reclaiming fees paid, simplifying the process for reimbursement.',
    formName: 'Application for requesting refund of fees paid.',
  },
  'NDH-3': {
    formDescription: 'A report submitted every six months, providing a summary of key information',
    formName: 'Half Yearly Return',
  },
  'NDH-2': {
    formDescription: 'Application to ask for more time in a straightforward manner.',
    formName: 'Application for extension of Time',
  },
  'NDH-1': {
    formDescription: 'Report ensuring that all necessary legal requirements have been met.',
    formName: 'Return of Statutory Compliances',
  },
  'PAS-6': {
    formDescription:
      'Twice-a-year report on the shares you own that are stored electronically instead of as paper certificates.',
    formName: 'Half yearly return for reporting of shares held in Demat form',
  },
  'PAS-4': {
    formDescription:
      'A letter inviting certain people to buy company shares, with a form to apply for those shares attached, like an invitation to become a part-owner of the company.',
    formName: 'Private Placement Offer Letter',
  },
  'PAS-3': {
    formDescription:
      'A report that tells the registrar about the new shares or securities a company has given to people, like a record of handing out ownership portions.',
    formName: 'Return of allotment',
  },
  'PAS-2': {
    formDescription:
      "A document that provides clear and simple information about a company or project, helping people understand what it's all about ",
    formName: 'Information Memorandum',
  },
  'Form DD-C': {
    formDescription: 'Form to apply for the removal of disqualification of directors.',
    formName: 'Form of application for removal of disqualification of directors',
  },
  'Form II': {
    formDescription:
      'Form for seeking Central Government approval to appoint a sole buying agent for the company.',
    formName:
      'Form of application for approval of the Central Government for the appointment of sole buying agent by a company',
  },
  'Form I': {
    formDescription:
      'Form for seeking Central Government approval to appoint sole selling agents for the company.',
    formName:
      'Form of application for approval of the Central Government for the appointment of sole selling agents by the company',
  },
  'Form 68': {
    formDescription: 'Formal request to correct errors evident in official records',
    formName: 'Application for rectification of mistakes apparent on record',
  },
  'Form 67 (Add.)': {
    formDescription:
      'A document for correcting defects or providing missing information in a previous submission.',
    formName: 'Form for filing addendum for rectification of defects or incompleteness',
  },
  'Form 66': {
    formDescription:
      'A standardized form for submitting the compliance certificate to the Registrar.',
    formName: 'Form for submission of compliance certificate with the Registrar',
  },
  'Form 65': {
    formDescription:
      'A standardized form for submitting applications or documents to the Central Government',
    formName: 'Form for filing application or documents with Central Government',
  },
  'Form 64': {
    formDescription:
      'Document for submitting an application to open branch(es) as a Nidhi company.',
    formName: 'Form for filing application for opening branch(s) by a nidhi company',
  },
  'Form 63': {
    formDescription: 'Document for submitting an application to be recognized as a Nidhi Company.',
    formName: 'Form for filing application for declaration as Nidhi Company',
  },
  'Form 62': {
    formDescription:
      'A standardized form for submitting various documents to the Registrar of Companies.',
    formName: 'Form for submission of documents with Registrar of Companies',
  },
  'Form 61': {
    formDescription:
      'A standardized document for submitting applications to the Registrar of Companies.',
    formName: 'Form for filing an application with Registrar of Companies',
  },
  'Form 19': {
    formDescription:
      'A formal statement confirming adherence to Companies Act, 1956, Section 149(i)(a), (b), and (c) provisions.',
    formName:
      'Declaration of compliance with the provisions of section 149(i)(a), (b) and (c) of the Companies Act,1956',
  },
  'Form 18': {
    formDescription:
      'Formal announcement regarding the address or alteration of the registered office.',
    formName: 'Notice of situation or change of situation of registered office',
  },
  'Form 17': {
    formDescription:
      'Document providing particulars for the satisfaction of charges, indicating the completion of the financial obligation.',
    formName: 'Particulars for satisfaction of charges',
  },
  'Form 15': {
    formDescription:
      'Formal announcement regarding the appointment or cessation of a receiver or manager.',
    formName: 'Appointment or cessation of receiver or manager',
  },
  'Form 14': {
    formDescription:
      'Document for notifying the Registrar of Companies about the conversion of a company into a Limited Liability Partnership (LLP).',
    formName:
      'Form for intimating to Registrar of Companies of conversion of the company into limited liability partnership (LLP).',
  },
  'Form 10': {
    formDescription:
      'Form detailing particulars for the registration of charges related to debentures.',
    formName: 'Particulars for registration of charges for Debenture',
  },
  'Form 1AD': {
    formDescription:
      "Formal request to the Regional Director for approval when shifting a company's registered office within a state between different Registrar jurisdictions ",
    formName:
      'Application for confirmation by Regional Director for change of registered office of the company within the state from the jurisdiction of one Registrar to the jurisdiction of another Registrar',
  },
  'Form 1AA': {
    formDescription:
      'Information about individuals or directors specified or changed for purposes outlined in clause (f) or (g) of Section 5.',
    formName:
      'Particulars of person(s) or director(s) or changed or specified for the purpose of clause(f) or (g) of section 5',
  },
  'Form 1A': {
    formDescription:
      'A standardized form for checking and requesting the availability or change of a name.',
    formName: 'Application form for availability or change of a name',
  },
  'Form 1B': {
    formDescription:
      'Formal request to the Central Government for approval to change the name or convert a public company into a private company.',
    formName:
      'Application for approval of the Central Government for change of name or conversion of a public company into a private company',
  },
  'Form 1 INV': {
    formDescription:
      'Declaration of amounts transferred to the Investor Education and Protection Fund.',
    formName: 'Statement of amounts credited to investor education and protection fund',
  },
  'Form 1': {
    formDescription: 'Formal request or statement for the establishment of a new company.',
    formName: 'Application or declaration for incorporation of a company',
  },
  'Form EES, 2010': {
    formDescription:
      " Formal request to strike off a company's name under the Easy Exit Scheme (EES), 2010. ",
    formName:
      'Application for striking off the name of company under the Easy Exit Scheme (EES), 2010',
  },
  'FORM CLSS 2011': {
    formDescription:
      'Formal request for obtaining an immunity certificate under the Companies Law Settlement Scheme (CLSS) 2011.',
    formName: 'Application for grant of immunity certificate under CLSS 2011',
  },
  'FORM CFSS 2020': {
    formDescription:
      'The Companies Fresh Start Scheme aims to help companies that have suffered during pandemic times.',
    formName: 'Companies Fresh Start Scheme 2020',
  },
  'Form EES, 2011': {
    formDescription:
      "Formal request to strike off a company's name under the Easy Exit Scheme (EES), 2011. ",
    formName:
      'Application for striking off the name of company under the Easy Exit Scheme (EES), 2011',
  },
  'Form FTE': {
    formDescription:
      "Formal request to strike off a company's name swiftly under the Fast Track Exit (FTE) Mode. ",
    formName:
      'Application for striking off the name of company under the Fast Track Exit(FTE) Mode',
  },
  'Form 49': {
    formDescription:
      "Submission detailing changes in a foreign company's charter, registered office, directors, secretary, and address.",
    formName:
      'Return of alteration in the charter, statute or memorandum and articles of association, address of the registered or principal office and directors and secretary of a foreign company',
  },
  'Form 5INV': {
    formDescription: 'Declaration listing amounts that remain unclaimed and unpaid.',
    formName: 'Statement of unclaimed and unpaid amounts',
  },
  'Form 52': {
    formDescription:
      'Official notice regarding alterations in names, addresses, and places of business of a foreign company in India, and cessation of operations.',
    formName:
      'Notice of (A) alteration in names and addresses of persons resident in India authorized to accept service on behalf of a foreign company (B) alteration in the address of principal place of business in India of a foreign company (C) list of places of business established by a foreign company (D) cessation to have a place of business in India',
  },
  'Form 5': {
    formDescription:
      'Announcement of consolidation, division, share capital increase, or member count rise.',
    formName:
      'Notice of consolidation, division, etc. or increase in share capital or increase in number of members',
  },
  'Form 8': {
    formDescription:
      'Documentation for creating or modifying charges, excluding debentures. Includes specifics for modifications by asset reconstruction companies under SARFASI',
    formName:
      'Particulars for creation or modification of charge (other than those related to debentures) including particulars of modification of charge by asset reconstruction companies in terms of Securitisation and Reconstruction of Financial Assets and Enforcement of Securities Interest Act, 2002(SARFASI)',
  },
  'Form 36': {
    formDescription:
      'Overview of receipts and payments by a receiver or manager, simplifying financial information.',
    formName: "Receiver's or manager's abstract of receipts and payments",
  },
  'Form DIN 1': {
    formDescription:
      'Formal request for the assignment of Director Identification Number for individuals intending to be directors.',
    formName: 'Application for allotment of Director Identification Number',
  },
  'Form DIN 4': {
    formDescription:
      "Official notification to the Central Government about alterations in a director's particulars.",
    formName:
      'Intimation of change in particulars of Director to be given to the Central Government',
  },
  'Form 37': {
    formDescription:
      'Application for an existing joint stock or non-joint stock company to register as a public limited, private limited, or unlimited company.',
    formName:
      'Application by an existing joint stock company or by an existing company (not being a joint stock company) for registration as a public limited or private limited or an unlimited company',
  },
  'Form 39': {
    formDescription:
      'Application for the registration of an existing company as a limited company.',
    formName: 'Registration of an existing company as a limited company',
  },
  'Form 44': {
    formDescription: 'Submission of required documents for the registration of a foreign company.',
    formName: 'Documents delivered for registration by a foreign company',
  },
  'Form 25A': {
    formDescription:
      'A formal application seeking approval from the Central Government for the appointment, reappointment, remuneration, increase in remuneration, or waiver for excess payment to managing or whole-time director(s) or manager. It also covers commission, remuneration, or expression of opinion to directors.',
    formName:
      'Form of application to the Central Government for approval of appointment or reappointment and remuneration or increase in remuneration or waiver for excess or over payment to managing or whole-time director(s) or manager and commission or remuneration or expression of opinion to directors',
  },
  'Form 25B': {
    formDescription:
      'Formal application seeking Central Government approval for amending provisions related to managing, whole-time, or non-rotational director.',
    formName:
      'Form of application to Central Government for approval to amendment of provisions relating to managing, whole time or non rotational director',
  },
  'Form 25C': {
    formDescription:
      'Submission confirming the appointment of a managing director, whole-time director, or manager.',
    formName: 'Return of appointment of managing director or whole time director or manager',
  },
  'Form 24AAA': {
    formDescription:
      'A standardized form for filing petitions with the Central Government through the Regional Director.',
    formName: 'Form for filing petitions to Central Government (Regional Director)',
  },
  'Form 24AB': {
    formDescription:
      'Form for applying to provide a loan, security, or guarantee and related details.',
    formName:
      'Form for filing application for giving loan, providing security or guarantee in connection with a loan',
  },
  'Form 24A': {
    formDescription: 'A standardized form for submitting applications to the Regional Director.',
    formName: 'Form for filing application to Regional Director',
  },
  'Form 24B': {
    formDescription:
      'Formal request to the Central Government for approval before holding a profit-making position in the company.',
    formName:
      'Form of application to the Central Government for obtaining prior consent for holding of any office or place of profit in the company by certain persons',
  },
  'Form 24': {
    formDescription:
      'A formal application to the Central Government requesting an increase in the number of directors for a company.*',
    formName:
      'Form of application to the Central Government for increase in the number of directors of the company',
  },
  'Form 23ACA-XBRL': {
    formDescription:
      'A standardized form for submitting XBRL documents related to the Profit and Loss account and other relevant documents to the Registrar..',
    formName:
      'Form for filing XBRL document in respect of Profit and Loss account and other documents with the Registrar',
  },
  'Form 23AC-XBRL': {
    formDescription:
      'A standardized form for submitting XBRL documents related to the balance sheet and other relevant documents to the Registrar.',
    formName:
      'Form for filing XBRL document in respect of balance sheet and other documents with the Registrar',
  },
  'Form 23AAA': {
    formDescription:
      "Application to the Central Government seeking changes in what a company's financial statements should include. ",
    formName:
      "Application to Central Government for modification in the matters to be stated in the company's balance sheet or profit and loss account",
  },
  'Form 23AAB': {
    formDescription:
      'Formal request to be excused from attaching the yearly accounts of subsidiary companies.',
    formName:
      'Application for exemption from attaching the annual accounts of the subsidiary companies',
  },
  'Form 23AAC': {
    formDescription:
      'Formal application to the Central Government seeking approval to omit providing depreciation',
    formName: 'Application to Central Government for not providing depreciation',
  },
  'Form 23C': {
    formDescription: 'Document to apply to the Central Government for appointing a cost auditor.',
    formName: 'Form of application to the Central Government for appointment of cost auditor',
  },
  'Form 23ACA': {
    formDescription:
      'A standardized form for submitting the Profit and Loss account and other documents to the Registrar.',
    formName: 'Form for filing Profit and Loss account and other documents with the Registrar',
  },
  'Form 23AC': {
    formDescription:
      'A standardized form for submitting the balance sheet and other documents to the Registrar.',
    formName: 'Form for filing balance sheet and other documents with the Registrar',
  },
  'Form 23AA': {
    formDescription:
      "Official notification regarding the location where the company's books of account are maintained.",
    formName: 'Notice of address at which books of account are maintained',
  },
  'Form 23B': {
    formDescription:
      'Submission of relevant information by the auditor to the regulatory authority.',
    formName: 'Information by Auditor to Registrar',
  },
  'Form 23D': {
    formDescription:
      'A standardized document for the submission of information by the cost auditor to the Central Government.',
    formName: 'Form for Information by Cost Auditor to Central Government',
  },
  'Form 23': {
    formDescription:
      'Process of officially recording resolutions and agreements with the appropriate regulatory body.',
    formName: 'Registration of resolution(s) and agreement(s)',
  },
  'Form 22B': {
    formDescription:
      'A standardized form used for submitting returns to the Registrar of Companies',
    formName: 'Form of return to be filed with the Registrar',
  },
  'Form 22': {
    formDescription:
      "A mandated document summarizing a company's financial status, operations, and future plans, typically required for public companies.",
    formName: 'Statutory Report',
  },
  'Form 21A': {
    formDescription:
      'Details required for filing the annual return of a company that does not have a share capital.',
    formName: 'Particulars of annual return for the company not having share capital',
  },
  'Form 21': {
    formDescription:
      'Formal announcement of an order issued by the court or the Company Law Board.',
    formName: 'Notice of the court or the company law board order',
  },
  'Form 20A': {
    formDescription:
      'A statement ensuring adherence to the rules outlined in Sections 149(2A) and (2B) of the Companies Act, 1956.',
    formName: 'Declaration of the compliance with the provisions of section 149(2A) and (2B)',
  },
  'Form 20B': {
    formDescription:
      'Document for submitting the annual return by a company with a share capital to the Registrar.',
    formName:
      'Form for filing annual return by a company having a share capital with the Registrar',
  },
  'Form 20': {
    formDescription:
      'A statement confirming that the company is abiding by the specified regulations in Section 149(2)(b) of the Companies Act, 1956.',
    formName:
      'Declaration of compliance with the provisions of section 149(2)(b) of the Companies Act,1956',
  },
  'Form 2': {
    formDescription: 'Documentation confirming the allocation of shares or securities.',
    formName: 'Return of allotment',
  },
  'Form 35A': {
    formDescription:
      'Details to be provided for any offer involving the transfer of shares from the transferor company to the transferee company.',
    formName:
      'Information to be furnished in relation to any offer of a scheme or contract involving the transfer of shares or any class of shares in the transferor company to the transferee company',
  },
  'Form32 Addendum': {
    formDescription:
      'Document outlining details of appointments and changes in managing director, directors, manager, and secretary. Also includes consent from candidates to act in these roles and an undertaking to acquire qualification shares.',
    formName:
      'Particulars of appointment of managing director, directors, manager and secretary and the changes among them or consent of candidate to act as a managing director or director or manager or secretary of a company and/ or undertaking to take and pay for qualification shares',
  },
  'Form 32': {
    formDescription:
      "Document detailing the appointment and changes among managing director, directors, manager, and secretary in a company, along with the candidate's consent and commitment to acquire qualification shares.",
    formName:
      'Particulars of appointment of managing director, directors, manager and secretary and the changes among them or consent of candidate to act as a managing director or director or manager or secretary of a company and/ or undertaking to take and pay for qualification shares',
  },
  'Form 3': {
    formDescription:
      'Information on contracts related to shares allotted as fully or partly paid-up through non-cash means',
    formName:
      'Particulars of contract relating to shares alloted as fully or partly paid-up otherwise than in cash',
  },
  'Form 4C': {
    formDescription:
      'Submission detailing the buyback of shares, providing relevant information as required.',
    formName: 'Return in respect of buy Back of Shares',
  },
  'Form 4': {
    formDescription:
      'Details of the commission amount or percentage, and the number of shares or debentures for which individuals have agreed to subscribe',
    formName:
      'Statement of amount or rate percent of the commission payable in respect of shares or debentures and the number of shares or debentures for which persons have agreed for a commission to subscribe for absolutely or conditionally',
  },
  'Form DD-B': {
    formDescription:
      'A comprehensive document detailing the activities, financial status, and key information of a public company.',
    formName: 'Report by a public company',
  },
  'FORM I-XBRL': {
    formDescription:
      'A standardized form for filing XBRL documents related to the cost audit report and other associated documents with the Central Government.',
    formName:
      'Form for filing XBRL document in respect of cost audit report and other documents with the Central Government',
  },
  'FORM A-XBRL': {
    formDescription:
      'A standardized form for submitting XBRL documents related to the compliance report and other associated documents to the Central Government.',
    formName:
      'Form for filing XBRL document in respect of compliance report and other documents with the Central Government',
  },
  'Form CSR': {
    formDescription:
      'Initiative for companies to voluntarily disclose their Corporate Social Responsibility (CSR) activities and impact.',
    formName: 'Voluntary reporting of Corporate Social Responsibility (CSR)',
  },
  'Investor Complaint Form': {
    formDescription: 'A standardized form for individuals to submit complaints against a company.',
    formName: 'Form for filing complaint(s) against the company',
  },

  'Refund Form': {
    formDescription: 'Formal application for requesting a refund of fees previously paid.',
    formName: 'Application for requesting refund of fees paid',
  },
};
