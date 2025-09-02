import axios from 'axios';
import { format } from 'date-fns';
import { FeedbackDocument } from '../../feedback/feedback.interface';
import { LeadDTO } from '../leadGen.interface';

const slackHookUrl =
  'https://hooks.slack.com/services/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';

const newCompanyAlertHookUrl =
  'https://hooks.slack.com/services/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';

// export const sendSlackNotification = async (leadData: LeadDTO) => {
//   const message = {
//     blocks: [
//       {
//         type: 'header',
//         text: {
//           type: 'plain_text',
//           text: '🎉 New Lead Added!',
//           emoji: true,
//         },
//       },

//       {
//         type: 'divider',
//       },
//       {
//         type: 'section',
//         fields: [
//           {
//             type: 'mrkdwn',
//             text: '*Name:*',
//           },
//           {
//             type: 'mrkdwn',
//             text: `${leadData.name}`,
//           },
//         ],
//       },
//       {
//         type: 'divider',
//       },
//       {
//         type: 'section',
//         fields: [
//           {
//             type: 'mrkdwn',
//             text: '*Email:*',
//           },
//           {
//             type: 'mrkdwn',
//             text: `${leadData.email}`,
//           },
//         ],
//       },
//       {
//         type: 'divider',
//       },
//       {
//         type: 'section',
//         fields: [
//           {
//             type: 'mrkdwn',
//             text: '*Contact No:*',
//           },
//           {
//             type: 'mrkdwn',
//             text: `${leadData.contactNo}`,
//           },
//         ],
//       },
//       {
//         type: 'divider',
//       },
//       {
//         type: 'section',
//         fields: [
//           {
//             type: 'mrkdwn',
//             text: '*Service Type:*',
//           },
//           {
//             type: 'mrkdwn',
//             text: `${leadData.serviceType.join(', ')}`,
//           },
//         ],
//       },
//       {
//         type: 'divider',
//       },
//       {
//         type: 'section',
//         fields: [
//           {
//             type: 'mrkdwn',
//             text: '*Other Service:*',
//           },
//           {
//             type: 'mrkdwn',
//             text: `${leadData.otherService ? leadData.otherService : '-'}`,
//           },
//         ],
//       },
//       {
//         type: 'divider',
//       },
//       {
//         type: 'section',
//         fields: [
//           {
//             type: 'mrkdwn',
//             text: '*Source:*',
//           },
//           {
//             type: 'mrkdwn',
//             text: `${leadData.sources.join(', ')}`,
//           },
//         ],
//       },
//       {
//         type: 'divider',
//       },
//       {
//         type: 'section',
//         fields: [
//           {
//             type: 'mrkdwn',
//             text: '*Pathname:*',
//           },
//           {
//             type: 'mrkdwn',
//             text: `${leadData.pathname}`,
//           },
//         ],
//       },
//       {
//         type: 'divider',
//       },
//       {
//         type: 'section',
//         fields: [
//           {
//             type: 'mrkdwn',
//             text: '*Contacted:*',
//           },
//           {
//             type: 'mrkdwn',
//             text: `${leadData.isContacted ? 'Yes' : 'No'}`,
//           },
//         ],
//       },
//       {
//         type: 'divider',
//       },
//       {
//         type: 'section',
//         fields: [
//           {
//             type: 'mrkdwn',
//             // text: '*💼 Converted:*',
//             text: '*Converted:*',
//           },
//           {
//             type: 'mrkdwn',
//             text: `${leadData.leadConverted ? 'Yes' : 'No'}`,
//           },
//         ],
//       },
//       {
//         type: 'divider',
//       },
//       {
//         type: 'context',
//         elements: [
//           {
//             type: 'mrkdwn',
//             text: `📅 Created at: ${format(new Date(), 'dd-MM-yyyy HH:mm')}`,
//           },
//         ],
//       },
//     ],
//   };
//   try {
//     await axios.post(slackHookUrl, message);
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.error('Error sending Slack notification:', error);
//   }
// };

export const sendSlackNotification = async (leadData: LeadDTO) => {
  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 New Lead Added!',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:*\n${leadData.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${leadData.email}`,
          },
          {
            type: 'mrkdwn',
            text: `*Contact No:*\n${leadData.contactNo}`,
          },
          {
            type: 'mrkdwn',
            text: `*Service Type:*\n${leadData.serviceType.join(', ')}`,
          },
          {
            type: 'mrkdwn',
            text: `*Other Service:*\n${leadData.otherService ? leadData.otherService : '-'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Source:*\n${leadData.sources.join(', ')}`,
          },
          {
            type: 'mrkdwn',
            text: `*Pathname:*\n${leadData.pathname}`,
          },
          {
            type: 'mrkdwn',
            text: `*Contacted:*\n${leadData.isContacted ? 'Yes' : 'No'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Converted:*\n${leadData.leadConverted ? 'Yes' : 'No'}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Created at: ${format(new Date(), 'dd-MM-yyyy HH:mm')}`,
          },
        ],
      },
    ],
  };
  try {
    if (leadData.serviceType.includes('New company alert')) {
      await axios.post(newCompanyAlertHookUrl, message);
    } else {
      await axios.post(slackHookUrl, message);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending Slack notification:', error);
  }
};

const feedbacksHookUrl =
  'https://hooks.slack.com/services/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';

export const sendSlackFeedbackNotification = async (data: Partial<FeedbackDocument>) => {
  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎯 New Customer Feedback Received',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '> A new customer feedback has been submitted. Review the details below to understand their experience.',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📊 Performance Metrics*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Overall Experience*\n⭐ ${data.overall}/5`,
          },
          {
            type: 'mrkdwn',
            text: `*Website Usability*\n🌐 ${data.website}/5`,
          },
          {
            type: 'mrkdwn',
            text: `*Recommendation Score*\n👥 ${data.recommend}/5`,
          },
          {
            type: 'mrkdwn',
            text: `*Support Quality*\n🛠️ ${data.support}/5`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*👤 Customer Profile*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*User Type*\n${data.userType || 'Not specified'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Contact Email*\n${data.userEmail || 'Not provided'}`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*💬 Customer Comments*\n${data.feedback?.trim() ? `_"${data.feedback.trim()}"_` : '`No additional feedback provided`'}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📅 Submitted on ${format(new Date(), 'MMM dd, yyyy')} • ${format(new Date(), 'HH:mm')}`,
          },
        ],
      },
    ],
  };

  try {
    await axios.post(feedbacksHookUrl, message);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error sending Slack feedback notification:', error);
  }
};
