import { isValid } from 'date-fns';
import { LeadDTO, leadZodSchema } from './leadGen.interface';
import Leads, { ILeads, UnsubscribeModel } from './leadGen.model';
import { createOdooLead } from './utils/odoo/odooLeadManager';
import { sendSlackNotification } from './utils/sendSlackNotification';

export const createLeadIntoDB = async (leadData: LeadDTO): Promise<ILeads> => {
  // Validate incoming data using Zod schema
  const validatedData = leadZodSchema.parse(leadData);

  let returnLeadData;

  const existingLead = await Leads.findOne({ email: validatedData.email });

  if (existingLead) {
    // Update the existing lead
    existingLead.sources = Array.from(new Set([...existingLead.sources, ...leadData.sources]));

    existingLead.serviceType = Array.from(
      new Set([...existingLead.serviceType, ...leadData.serviceType])
    );

    existingLead.pathname = leadData.pathname;

    if (!existingLead.hitsCount) {
      existingLead.hitsCount = 2;
    } else {
      existingLead.hitsCount += 1;
    }

    await existingLead.save();
    returnLeadData = existingLead;
  } else {
    // Lead doesn't exist, create new lead
    const newLead = await Leads.create(validatedData);
    returnLeadData = newLead;
  }

  sendSlackNotification(validatedData);

  // Send Lead to Odoo CRM
  const odooLeadData = {
    name: `${validatedData.name || ''}`.trim() || validatedData.email,
    email_from: validatedData.email,
    phone: validatedData.contactNo,
    description: `Downloaded Sample File from New Company Alert page: ${validatedData.pathname}`,
    pathname: validatedData.pathname,
  };
  try {
    await createOdooLead(odooLeadData);
    console.log(`[Odoo] lead created successfully for ${validatedData.email}`);
  } catch (err) {
    console.error(`[Odoo] Failed to sync lead to Odoo for ${validatedData.email} \n Error: ${err}`);
  }

  return returnLeadData;
};

const getLeadsFromDB = async (): Promise<ILeads[]> => {
  return await Leads.find();
};
const getMarketingLeadsFromDB = async (): Promise<ILeads[]> => {
  return await Leads.find().sort({ updatedAt: -1 }).exec();
};

const getLeadByIdFromDB = async (id: string): Promise<ILeads | null> => {
  return await Leads.findById(id);
};

const updateLeadsDataIntoDB = async (id: string, updatedFields: LeadDTO) => {
  try {
    const {
      isQualified,
      isContacted,
      leadConverted,
      convertingRemarkReason,
      contactingFailedReason,
      nextCallSchedule,
      followUpTime,
      customerReqCallSchedule,
      customerReqFollowUpTime,
    } = updatedFields;
    let parsedNextCallSchedule = null;
    if (nextCallSchedule) {
      const nextCallScheduleDateObj = new Date(nextCallSchedule);
      if (isValid(nextCallScheduleDateObj)) {
        parsedNextCallSchedule = nextCallScheduleDateObj;
      }
    }

    let parsedCustomerReqCallSchedule = null;
    if (customerReqCallSchedule) {
      const customerReqCallScheduleDateObj = new Date(customerReqCallSchedule);
      if (isValid(customerReqCallScheduleDateObj)) {
        parsedCustomerReqCallSchedule = customerReqCallScheduleDateObj;
      }
    }

    const updateInfo = await Leads.updateOne(
      { _id: id },
      {
        isQualified,
        isContacted,
        leadConverted,
        convertingRemarkReason: convertingRemarkReason,
        contactingFailedReason: contactingFailedReason,
        nextCallSchedule: parsedNextCallSchedule,
        customerReqCallSchedule: parsedCustomerReqCallSchedule,
        followUpTime,
        customerReqFollowUpTime,
        updatedAt: new Date(),
      }
    );

    return updateInfo;
  } catch (err) {
    throw new Error('Error updating lead');
  }
};

const createUnsubscribeEmailIntoDB = async (email: string) => {
  // Check if the email is already unsubscribed
  const existing = await UnsubscribeModel.findOne({ email });
  if (existing) {
    return {
      message: 'You are already unsubscribed.',
    };
  }

  // Add the email to the unsubscribe list
  const unsubscribe = new UnsubscribeModel({ email });
  await unsubscribe.save();
  return {
    message: 'You have been successfully unsubscribed.',
  };
};

export const LeadServices = {
  createLeadIntoDB,
  getLeadsFromDB,
  getLeadByIdFromDB,
  updateLeadsDataIntoDB,
  getMarketingLeadsFromDB,
  createUnsubscribeEmailIntoDB,
};
