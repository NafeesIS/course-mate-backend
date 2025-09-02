/* eslint-disable no-useless-escape */
import { VertexAI } from '@google-cloud/vertexai';
import { TCompany } from '../company.interface';

// Initialize Vertex with your Cloud project and location
const vertexAi = new VertexAI({ project: 'glossy-flow-418503', location: 'us-central1' });
const model = 'gemini-1.5-pro-preview-0409';

// Instantiate the models
const generativeModel = vertexAi.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  },
});

// const text1 = {
//   text: `for this following data i want to create a comprehensive summary of company in a paragraph describing company information. make it not more than 600 character. provide information what is available in the json packet. \"data\": {
// \"_id\": \"64cd3ddf562db65673c6fe7c\",
// \"cin\": \"U15100MH2022PTC377994\",
// \"company\": \"PATILKAKI ECOM VENTURES PRIVATE LIMITED\",
// \"companyType\": \"Company\",
// \"companyOrigin\": \"Indian\",
// \"category\": \"Company limited by shares\",
// \"registrationNumber\": \"377994\",
// \"classOfCompany\": \"Private\",
// \"status\": \"Active\",
// \"state\": \"Maharashtra\",
// \"incorporationAge\": 25,
// \"rocCode\": \"ROC Mumbai\",
// \"dateOfIncorporation\": \"07-Mar-2022\",
// \"companySubcategory\": \"Non-government company\",
// \"listingStatus\": \"N\",
// \"industry\": \"MANUFACTURING\",
// \"authorizedCapital\": \"1000000\",
// \"paidUpCapital\": 104660,
// \"email\": \"vinit@patilkaki.com\",
// \"formattedAuthorizedCapital\": \"₹10.00 Lakh\",
// \"formattedPaidUpCapital\": \"₹1.05 Lakh\",

// \"chargeData\": {
// \"totalOpenCharges\": 4000000,
// \"totalSatisfiedCharges\": 0,
// \"totalLenders\": 1,
// \"lastChargeDate\": \"09/22/2022\",
// \"lastChargeAmount\": 4000000
// },
// \"address\": {
// \"registeredAddress\": \"ROOM NO 294 INDIRA NAGAR KISHOR KUMAR GANGULI RD SANTACRUZ W NEAR INDIRA NAGAR , NA, MUMBAI, Maharashtra 400049, India\",
// \"pinCode\": \"400049\"
// },
// \"currentDirectors\": [
// {
// \"din\": \"09528173\",
// \"fullName\": \"DARSHIL ANIL SAVLA\",
// \"dateOfAppointment\": \"03/07/2022\",
// \"designation\": \"Director\",
// \"totalDirectorship\": 1,
// \"isPromoter\": true
// },
// {
// \"din\": \"09528174\",
// \"fullName\": \"VINIT GOVINDA PATIL\",
// \"dateOfAppointment\": \"03/07/2022\",
// \"designation\": \"Director\",
// \"totalDirectorship\": 1,
// \"isPromoter\": true
// }
// ],
// \"pastDirectors\": []
// }`,
// };

export async function generateAboutContent(company: TCompany) {
  const text1 = {
    text: `Generate a company summary using the following JSON data. Focus on core company details and avoid adding extra headings. Limit the response to a maximum of 600 characters. \"data\": ${JSON.stringify(company)}`,
  };
  const req = {
    contents: [{ role: 'user', parts: [text1] }],
  };

  const streamingResp = await generativeModel.generateContentStream(req);
  let generatedText = '';

  for await (const item of streamingResp.stream) {
    if (item.candidates && item.candidates[0].content.parts[0].text) {
      generatedText += item.candidates[0].content.parts[0].text;
    }
  }

  return generatedText;
  // for await (const item of streamingResp.stream) {
  //   process.stdout.write(JSON.stringify(item) + '\n');
  // }

  // // process.stdout.write('aggregated response: ' + JSON.stringify(await streamingResp.response));
  // const aggregatedResponse = await streamingResp.response;
  // const generatedText =
  //   aggregatedResponse?.candidates && aggregatedResponse.candidates[0].content.parts[0].text;
  // return generatedText;
}

// generateContent();
