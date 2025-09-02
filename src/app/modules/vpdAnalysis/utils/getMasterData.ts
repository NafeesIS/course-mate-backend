import { VertexAI } from '@google-cloud/vertexai';
import axios from 'axios';
import { Request, Response } from 'express';

async function getCaptchaImage() {
  try {
    const response = await axios.get('https://www.mca.gov.in/bin/mca/generateCaptchaWithHMAC', {
      headers: {
        'sec-ch-ua-platform': '"macOS"',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        Accept: '*/*',
        'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        'sec-ch-ua-mobile': '?0',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        host: 'www.mca.gov.in',
        Cookie:
          '__UUID-HASH=9605bf487253f0b8dee97ef32d33e185$; cookiesession1=678B2869C14549DD3C7F17F639C1E65E',
      }, // Add headers here
      responseType: 'arraybuffer', // Get the image as a buffer
    });
    // Convert image buffer to base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const pre_CT = response.headers['pre_ct'];

    // // Define the path to save the image
    // const filePath = path.join(__dirname, 'mcaCaptchaImage.png');
    // // Write the image buffer to a file
    // fs.writeFileSync(filePath, response.data);
    // console.log('Captcha image saved at:', filePath);

    return { base64Image, pre_CT };
  } catch (error) {
    console.error(error);
  }
}

// Initialize Vertex with your Cloud project and location
const vertexAi = new VertexAI({ project: 'glossy-flow-418503', location: 'us-central1' });
const model = 'gemini-1.0-pro-vision-001';

// Instantiate the models

const generativeModel = vertexAi.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    topP: 0.4,
    topK: 32,
  },
});

// Function to generate content from image using Vertex AI
const generateContent = async (base64Image: string) => {
  try {
    // Construct the image object for Vertex AI request
    const image1 = {
      inlineData: {
        mimeType: 'image/png',
        data: base64Image,
      },
    };

    const text1 = {
      text: 'The image contains an addition equation with two numbers. Each number has one or two digits. Based on the equation in the image, provide the sum in the following JSON format: {"sum": <value>}',
    };

    const req = {
      contents: [{ role: 'user', parts: [image1, text1] }],
    };

    // Call the Vertex AI model to generate the content
    const streamingResp = await generativeModel.generateContentStream(req);

    let captchaSum = null;

    // Parse the streaming response from Vertex AI
    for await (const item of streamingResp.stream) {
      if (!item.candidates || item.candidates.length === 0) {
        continue;
      }
      const { content } = item.candidates[0];
      const regex = /{"sum": (\d+)}/;
      if (!content) {
        continue;
      }
      const match = regex.exec(content.parts[0].text as string);

      if (match && match[1]) {
        captchaSum = parseInt(match[1]);
        break;
      }
    }

    if (captchaSum !== null) {
      console.log(`Extracted CAPTCHA sum: ${captchaSum}`);
      return captchaSum;
    } else {
      console.error('Failed to extract sum from API response');
    }
  } catch (error) {
    console.error('Error generating content:', error);
  }
};

export const solveMCACaptcha = async (req: Request, res: Response) => {
  // Step 1: Get the CAPTCHA image as base64
  const base64Image = await getCaptchaImage();

  if (!base64Image) {
    console.error('Failed to download CAPTCHA image');
    return res.status(500).send({ error: 'Failed to download CAPTCHA image' });
  }

  // Step 2: Send the image to Vertex AI and extract the sum
  const captchaResult = await generateContent(base64Image.base64Image);

  if (!captchaResult || captchaResult == null) {
    console.error('Failed to solve CAPTCHA');
    return res.status(500).send({ error: 'Failed to solve CAPTCHA' });
  }
  if (!base64Image) {
    console.error('Failed to download CAPTCHA image');
    return;
  }

  // Step 3: Send the CAPTCHA solution back as a response
  return res.status(200).json({ solvedCaptcha: captchaResult, pre_CT: base64Image.pre_CT });
};
