import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import httpStatus from 'http-status';
import config from '../../../config';
import AppError from '../../../errors/AppError';
import { TOneTimeComplianceResponse } from '../../company/company.interface';
import { generateEmailBody } from './generateEmailBody';

const sesClient = new SESClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: config.aws_access_key_id as string,
    secretAccessKey: config.aws_secret_access_key as string,
  },
});

export const sendComplianceEmail = async (
  to: string,
  subject: string,
  cin: string,
  company_name: string,
  incorporationDate: string,
  inc20AStatus: TOneTimeComplianceResponse,
  company_url: string
) => {
  const body = generateEmailBody(
    company_name,
    cin,
    incorporationDate,
    inc20AStatus.dueDate,
    company_url,
    to
  );

  const params = {
    Destination: { ToAddresses: [to] },
    Message: {
      Body: { Html: { Data: body } },
      Subject: { Data: subject },
    },
    Source: 'FileSure <hello@marketing.filesure.in>',
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send email from SES');
  }
};
