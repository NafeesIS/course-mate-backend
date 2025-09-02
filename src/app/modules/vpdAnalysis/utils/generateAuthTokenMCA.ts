/* eslint-disable @typescript-eslint/no-explicit-any */
import puppeteer from 'puppeteer';
// const fs = require('fs');
import fs from 'fs';
// const path = require('path');
import { VertexAI } from '@google-cloud/vertexai';
import path from 'path';
import { automateBrowser } from './automateBrowser';

export const generateAuthTokenMCA = async () => {
  console.log('Starting generate Auth Token MCA');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080',
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });
  const page = await browser.newPage();
  console.log('page content', page);
  // Modify the user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Add additional headers to make the request look more like a real browser
  await page.setExtraHTTPHeaders({
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Upgrade-Insecure-Requests': '1',
  });

  // Enable JavaScript and cookies
  await page.setJavaScriptEnabled(true);

  // Use request interception to block scripts
  await page.setRequestInterception(true);

  page.on('request', request => {
    if (
      request.resourceType() === 'script' &&
      (request.url().includes('disable-devtool') || request.url().includes('clientlib-devtool.js'))
    ) {
      request.abort(); // Block scripts matching the condition
    } else {
      request.continue(); // Allow other requests
    }
  });

  // Navigate to the page
  await page.goto('https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html', {
    waitUntil: 'networkidle0',
  });

  try {
    // Add multiple selector options and increase timeout
    const buttonSelector = 'button.btn.btn-primary[data-dismiss="modal"]';
    await page.waitForFunction(
      selector => {
        const element = document.querySelector(selector) as HTMLElement;
        return element && element.offsetParent !== null;
      },
      { timeout: 60000 },
      buttonSelector
    );

    // Add a longer delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const okButton = await page.$(buttonSelector);
    if (okButton) {
      await okButton.click();
    }
  } catch (error) {
    console.error('Failed to find or click the OK button:', error);
    // Optional: Take screenshot for debugging
    // await page.screenshot({ path: 'error-screenshot.png' });
    // console.log('error', error);
    throw error; // Re-throw to handle it in the calling code
  }

  await page.waitForSelector('#captchaCanvas');

  const captchaDataURL = await page.evaluate(() => {
    const canvas = document.getElementById('captchaCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    return canvas.toDataURL('image/png');
  });

  function dataURLToBuffer(dataURL: string) {
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
    // eslint-disable-next-line no-undef
    return Buffer.from(base64Data, 'base64');
  }

  const buffer = dataURLToBuffer(captchaDataURL);
  // eslint-disable-next-line no-undef
  const imagePath = path.join(__dirname, 'captcha.png');

  // Return a new Promise that resolves with the sessionCookie
  return new Promise((resolve, reject) => {
    fs.writeFile(imagePath, buffer, async err => {
      if (err) {
        console.error('Failed to save the CAPTCHA image:', err);
        reject(err);
        return;
      }

      try {
        const image1 = await getImageData(imagePath);
        const sessionCookie = await generateContent(image1, page);
        // console.log('sessionCookie', sessionCookie);
        resolve(sessionCookie); // Resolve with the sessionCookie
      } catch (error) {
        reject(error);
      } finally {
        browser.close();
      }
    });
  });
};

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

// Function to read the image file and construct image1 object
async function getImageData(imagePath: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const base64Data = data.toString('base64');
        const image1 = {
          inlineData: {
            mimeType: 'image/png',
            data: base64Data,
          },
        };
        resolve(image1);
      }
    });
  });
}

// Function to generate content
export const generateContent = async (image1: any, page: any) => {
  try {
    const text1 = {
      text: 'The image contains an addition equation with two numbers. Each number has one or two digits. Based on the equation in the image, provide the sum in the following JSON format: {"sum": <value>}',
    };

    const req = {
      contents: [{ role: 'user', parts: [image1, text1] }],
    };

    const streamingResp = await generativeModel.generateContentStream(req);

    let captchaSum = null;

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
      // Call function to perform browser automation with the extracted sum
      const sessionCookie = await automateBrowser(page, captchaSum);

      return sessionCookie;
    } else {
      console.error('Failed to extract sum from API response');
    }
  } catch (error) {
    console.error('Error generating content:', error);
  }
};

// export default generateAuthTokenMCA;
