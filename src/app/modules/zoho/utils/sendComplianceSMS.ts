import axios from 'axios';
import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';

export const sendComplianceSMS = async (
  to: string,
  name: string,
  companyName: string,
  amount: number,
  callbackURL: string
) => {
  const url = 'https://control.msg91.com/api/v5/flow';
  const MSG91_AUTH_KEY = '430158AMc2qgboYm66f2a5b4P1';

  const data = {
    template_id: '66f25f4ad6fc0536e137ea42',
    short_url: '0',
    realTimeResponse: '1',
    recipients: [
      {
        mobiles: to,
        name,
        companyName,
        amount,
        callbackURL,
      },
    ],
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authkey: MSG91_AUTH_KEY,
      },
    });

    return response.data;
  } catch (error) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send SMS throw msg91');
  }
};
