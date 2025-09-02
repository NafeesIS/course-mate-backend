// // Send email function
// import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
// import { EmailClient } from '@azure/communication-email';
// import axios from 'axios';
// import dotenv from 'dotenv';

// dotenv.config();

// // const azureConnectionString = process.env.AZURE_EMAIL_CONNECTION_STRING;
// const azureConnectionString =
//   'endpoint=https://filesure-azure-email.india.communication.azure.com/;accesskey=8c5i5xMj6PTQo6Hw3Vd3Lhz6pp1igMHHydBagLpO8v98GlBkTr0xJQQJ99BAACULyCpfLid9AAAAAZCSwOv1';

// const sesClient = new SESClient({
//   region: 'ap-south-1',
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
//   },
// });

// export async function sendEmailWithSES(to: string, subject: string, content: string) {
//   const params = {
//     Destination: {
//       ToAddresses: [to],
//     },
//     Message: {
//       Body: {
//         Html: { Data: content },
//       },
//       Subject: { Charset: 'UTF-8', Data: subject },
//     },
//     Source: 'FileSure <no-reply@notifications.filesure.in>',
//   };

//   try {
//     await sesClient.send(new SendEmailCommand(params));
//     // console.log('Email sent successfully');
//   } catch (error) {
//     console.log(error);
//   }
// }

// // Send email function with Azure Communication Services
// export async function sendEmailWithAzure(
//   to: string,
//   subject: string,
//   content: string,
//   cc?: string[]
// ): Promise<void> {
//   if (!azureConnectionString) {
//     throw new Error('Azure Email Connection String is not set in the environment variables.');
//   }

//   try {
//     const client = new EmailClient(azureConnectionString);
//     const senderAddress = 'no-reply@notifications.filesure.agency';

//     const message = {
//       senderAddress,
//       replyTo: [{ address: 'helpdesk@filesure.in' }],
//       recipients: {
//         to: [{ address: to }],
//         cc: cc?.map(email => ({ address: email })) || [],
//       },
//       content: {
//         subject,
//         plainText: content,
//         html: `
//           <html>
//             <body>
//               ${content}
//             </body>
//           </html>`,
//       },
//     };

//     await client.beginSend(message);
//     // console.log('Email send initiated');
//   } catch (error) {
//     console.error('Failed to send email:', error instanceof Error ? error.message : error);
//     throw error;
//   }
// }

// // SEND ORDER CONFIRMATION TO WHATSAPP
// export async function sendConfirmationToWhatsapp(params: {
//   integratedNumber?: string; // Your whatsapp integrated number, e.g. "15558121894"
//   templateName?: string; // Template name e.g. "order_confirmation_v1"
//   namespace?: string; // Template namespace string e.g. "d850c941_9a59_43f5_9fb5_22688505a60f"
//   phoneNumbers: string[]; // List of destination phone numbers in international format with country code
//   components: {
//     body_1?: string; // name
//     body_2?: string; // currency symbol
//     body_3?: string; // amount
//     body_4?: string; // order id
//   };
// }) {
//   const MSG91_WHATSAPP_API_URL =
//     'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';
//   const MSG91_AUTH_KEY = '430158AMc2qgboYm66f2a5b4P1'; // store in env variables for security

//   const {
//     integratedNumber = '15558121894',
//     templateName = 'order_confirmation_v1',
//     namespace = 'd850c941_9a59_43f5_9fb5_22688505a60f',
//     phoneNumbers,
//     components,
//   } = params;

//   // MSG91 uses `to_and_components` array, each with `to` and `components`
//   // The components keys are like "body_1", "body_2", etc., with { type: "text", value: "your_value" }
//   const toAndComponentsPayload: {
//     to: string[];
//     components: Record<string, { type: string; value: string }>;
//   }[] = [
//     {
//       to: phoneNumbers,
//       components: Object.entries(components)
//         .filter(([, value]) => typeof value === 'string')
//         .reduce(
//           (acc, [key, value]) => {
//             acc[key] = { type: 'text', value: value as string };
//             return acc;
//           },
//           {} as Record<string, { type: string; value: string }>
//         ),
//     },
//   ];

//   const payload = {
//     integrated_number: integratedNumber,
//     content_type: 'template',
//     payload: {
//       messaging_product: 'whatsapp',
//       type: 'template',
//       template: {
//         name: templateName,
//         language: {
//           code: 'en',
//           policy: 'deterministic',
//         },
//         namespace: namespace,
//         to_and_components: toAndComponentsPayload,
//       },
//     },
//   };

//   try {
//     const response = await axios.post(MSG91_WHATSAPP_API_URL, payload, {
//       headers: {
//         'Content-Type': 'application/json',
//         authkey: MSG91_AUTH_KEY,
//       },
//     });

//     // Return full response data or specific parts as you wish
//     console.log('Whatsapp response', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Failed to send WhatsApp confirmation message via MSG91:', error);
//     throw error; // Throw the error so the calling function can catch it
//   }
// }

// // SEND UNLOCK CONTACT DETAILS TO WHATSAPP
// export async function sendUnlockContactDetailsToWhatsapp(params: {
//   integratedNumber?: string; // Your whatsapp integrated number, e.g. "15558121894"
//   templateName?: string; // Template name e.g. "unlock_contact_intimation_v1"
//   namespace?: string; // Template namespace string e.g. "d850c941_9a59_43f5_9fb5_22688505a60f"
//   phoneNumbers: string[]; // List of destination phone numbers in international format with country code
//   components: {
//     body_1?: string; // din
//     body_2?: string; // name
//     body_3?: string; // mobile
//     body_4?: string; // email
//   };
// }) {
//   const MSG91_WHATSAPP_API_URL =
//     'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';
//   const MSG91_AUTH_KEY = '430158AMc2qgboYm66f2a5b4P1'; // store in env variables for security

//   const {
//     integratedNumber = '15558121894',
//     templateName = 'unlock_contact_intimation_v1',
//     namespace = 'd850c941_9a59_43f5_9fb5_22688505a60f',
//     phoneNumbers,
//     components,
//   } = params;

//   // MSG91 uses `to_and_components` array, each with `to` and `components`
//   // The components keys are like "body_1", "body_2", etc., with { type: "text", value: "your_value" }
//   const toAndComponentsPayload: {
//     to: string[];
//     components: Record<string, { type: string; value: string }>;
//   }[] = [
//     {
//       to: phoneNumbers,
//       components: Object.entries(components)
//         .filter(([, value]) => typeof value === 'string')
//         .reduce(
//           (acc, [key, value]) => {
//             acc[key] = { type: 'text', value: value as string };
//             return acc;
//           },
//           {} as Record<string, { type: string; value: string }>
//         ),
//     },
//   ];

//   const payload = {
//     integrated_number: integratedNumber,
//     content_type: 'template',
//     payload: {
//       messaging_product: 'whatsapp',
//       type: 'template',
//       template: {
//         name: templateName,
//         language: {
//           code: 'en',
//           policy: 'deterministic',
//         },
//         namespace: namespace,
//         to_and_components: toAndComponentsPayload,
//       },
//     },
//   };

//   try {
//     const response = await axios.post(MSG91_WHATSAPP_API_URL, payload, {
//       headers: {
//         'Content-Type': 'application/json',
//         authkey: MSG91_AUTH_KEY,
//       },
//     });

//     console.log('Whatsapp response', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Failed to send WhatsApp message via MSG91:', error);
//     throw error; // Throw the error so the calling function can catch it
//   }
// }

// // SEND ORDER CONFIRMATION TO SMS
// export const sendConfirmationSMS = async (
//   to: string,
//   name: string,
//   currencySymbo: string,
//   amount: number,
//   orderId: string
// ) => {
//   const url = 'https://control.msg91.com/api/v5/flow';
//   const MSG91_AUTH_KEY = '430158AMc2qgboYm66f2a5b4P1';
//   // console.log({ currencySymbo });
//   const data = {
//     template_id: '670a721dd6fc0560b3502802',
//     short_url: '0',
//     realTimeResponse: '1',
//     recipients: [
//       {
//         mobiles: to,
//         name,
//         currencySymbo,
//         amount,
//         orderId,
//       },
//     ],
//   };

//   try {
//     const response = await axios.post(url, data, {
//       headers: {
//         'Content-Type': 'application/json',
//         Accept: 'application/json',
//         authkey: MSG91_AUTH_KEY,
//       },
//     });

//     console.log('SMS response', response.data);
//     return response.data;
//   } catch (error) {
//     console.error(error);
//     // throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send SMS throw msg91');
//   }
// };

// // SEND UNLOCK CONTACT DETAILS TO SMS
// export const sendUnlockContactDetailsSMS = async (
//   to: string,
//   din: string,
//   name: string,
//   mobile: string,
//   email: string
// ) => {
//   const url = 'https://control.msg91.com/api/v5/flow';
//   const MSG91_AUTH_KEY = '430158AMc2qgboYm66f2a5b4P1';
//   const data = {
//     template_id: '681a5d81d6fc057149636e82',
//     short_url: '0',
//     realTimeResponse: '1',
//     recipients: [
//       {
//         mobiles: to,
//         din,
//         name,
//         mobile,
//         email,
//       },
//     ],
//   };

//   try {
//     const response = await axios.post(url, data, {
//       headers: {
//         'Content-Type': 'application/json',
//         Accept: 'application/json',
//         authkey: MSG91_AUTH_KEY,
//       },
//     });

//     console.log('SMS response', response.data);
//     return response.data;
//   } catch (error) {
//     console.error(error);
//     // throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send SMS throw msg91');
//   }
// };
