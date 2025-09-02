import axios from 'axios';
import { LeadDTO } from '../leadGen.interface';

const cliqHookUrl =
  'https://cliq.zoho.in/company/60031750664/api/v2/channelsbyname/leadform/message?zapikey=1001.b7a0c0b288fc5f5a511cedf6338a6c47.0550af1be4e8bc2da5c4afd12699d79d';

export const sendCliqNotification = async (validatedData: LeadDTO) => {
  const cliqMessage = {
    text: `New ${validatedData.serviceType.join(', ')} lead added`,
    bot: {
      name: 'Notification',
      image:
        'https://img.lovepik.com/png/20231124/3d-bot-ai-powered-marketing-and-notification-tools-support-technology_687740_wh860.png',
    },
    slides: [
      {
        type: 'table',
        title: 'Lead Details',
        data: {
          headers: ['Name', 'Email', 'Contact No', 'Service Type', 'Source URL'],
          rows: [
            {
              Name: validatedData.name,
              Email: validatedData.email,
              'Contact No': validatedData.contactNo,
              'Service Type': `${validatedData.serviceType.join(', ')}${validatedData.otherService ? ':\n ' + validatedData.otherService : ''}`,
              'Source URL': `${validatedData.sources.join(', ')}: \nhttps://www.filesure.in${validatedData.pathname}`,
            },
          ],
        },
      },
    ],
  };

  try {
    await axios.post(cliqHookUrl, cliqMessage);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending Cliq notification:', error);
  }
};
