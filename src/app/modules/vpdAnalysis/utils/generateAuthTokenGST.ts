import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

export const generateGSTAuthToken = async () => {
  try {
    // Launch the browser
    const browser = await puppeteer.launch({
      headless: false, // Extensions only operate in headful mode
    });

    const pages = await browser.pages(); // Get all open pages (tabs)
    const page = pages[0]; // Assume the first tab is the initial "about:blank"

    // Go to the GST login page on the first tab
    await page.goto('https://services.gst.gov.in/services/login', { waitUntil: 'networkidle0' });
    // // After navigation, check if there are any new tabs
    const allPages = await browser.pages();
    await Promise.all(
      allPages.map(async (p, index) => {
        if (p.url() === 'about:blank' && index !== 0) {
          // Close any 'about:blank' tabs except the first one
          await p.close();
        }
      })
    );

    // console.log(await page.content());

    // Wait for the username input to be available and type the username
    await page.waitForSelector('#username', { visible: true });
    await page.type('#username', 'Filesure_India1'); // Replace 'gst username' with the actual username

    // Wait for the password input to be available and type the password
    await page.waitForSelector('#user_pass', { visible: true });
    await page.type('#user_pass', 'User@100'); // Replace 'your_password_here' with the actual password

    // Click the audio captcha button and intercept the URL
    await page.waitForSelector('button[ng-click="play()"]:not([disabled])', { visible: true });
    await page.click('button[ng-click="play()"]');

    // Function to wait for a specific timeout
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    // Function to wait for multiple specific cookies
    const waitForCookies = async (cookieNames: string[], timeout = 30000) => {
      const startTime = Date.now();
      interface FoundCookies {
        [key: string]: string;
      }
      const foundCookies: FoundCookies = {};
      while (Date.now() - startTime < timeout) {
        const cookies = await page.cookies();
        cookieNames.forEach(name => {
          const cookie = cookies.find(c => c.name === name);
          if (cookie) {
            foundCookies[name] = cookie.value;
          }
        });
        if (Object.keys(foundCookies).length === cookieNames.length) {
          return foundCookies; // All required cookies have been found
        }
        await wait(500); // Wait for 500 ms before checking again
      }
      throw new Error('Not all required cookies were found within timeout period');
    };

    // Specify the required cookies
    const requiredCookies = ['CaptchaCookie', 'Lang', 'TS01b8883c'];

    // Wait for the required cookies
    const cookies = await waitForCookies(requiredCookies);
    const cookieString = requiredCookies.map(name => `${name}=${cookies[name]}`).join('; ');

    const audioUrl = 'https://services.gst.gov.in/services/audiocaptcha';
    // Fetch the audio file using the captured cookies
    const audioResponse = await fetch(audioUrl, {
      headers: {
        Host: 'services.gst.gov.in',
        Cookie: cookieString,
      },
    });

    const audioBuffer = await audioResponse.arrayBuffer();

    const audioCaptchaPath = path.join(__dirname, 'captchaAudio.wav');

    // Save the audio file to your file system
    fs.writeFile(audioCaptchaPath, Buffer.from(audioBuffer), err => {
      if (err) throw err;
    });

    try {
      const audioData = await getAudioData(audioCaptchaPath);
      const captcha = await generateAudioCaptchaSolver(audioData);

      await page.type('input[name="captcha"]', captcha); // Adjust the selector if necessary

      // Click the login button
      await page.click('button[type="submit"]');

      // Optionally, wait for navigation or some confirmation of login
      await page.waitForNavigation({ waitUntil: 'networkidle0' });

      // Get all cookies
      const cookies = await page.cookies();
      const authTokenCookie = cookies.find(cookie => cookie.name === 'AuthToken');

      if (authTokenCookie) {
        return authTokenCookie.value;
      } else {
        console.log('Auth Token cookie not found');
      }
    } catch (error) {
      console.log(error);
    }

    // Close the browser
    await browser.close();
  } catch (error) {
    console.error('Error running Puppeteer script:', error);
    process.exit(1); // Exit script with error code 1
  }
};

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

// Function to read the Audio file and construct Audio object
async function getAudioData(audioPath: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(audioPath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const base64Data = data.toString('base64');
        const audio1 = {
          inlineData: {
            mimeType: 'audio/wav',
            data: base64Data,
          },
        };
        resolve(audio1);
      }
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateAudioCaptchaSolver = async (audio1: any) => {
  // console.log(audio1);
  try {
    const text1 = {
      text: '"Thank you for your assistance! To proceed, I need your help in verifying the numbers from an audio captcha. You will hear a sequence of six numbers in the audio file. Please listen carefully and transcribe the numbers you hear. Once you have deciphered the entire sequence, type it out here in the chat. Remember, there are six numbers in total. Your cooperation is greatly appreciated! provide the captcha in the following JSON format: {"captcha": <value>}"',
    };

    const req = {
      contents: [{ role: 'user', parts: [audio1, text1] }],
    };

    const streamingResp = await generativeModel.generateContentStream(req);

    // console.log('streamingResp', streamingResp);

    // for await (const item of streamingResp.stream) {
    //   process.stdout.write('stream chunk: ' + JSON.stringify(item) + '\n');
    // }

    // process.stdout.write('aggregated response: ' + JSON.stringify(await streamingResp.response));

    let fullText = '';

    for await (const item of streamingResp.stream) {
      if (!item.candidates || item.candidates.length === 0) {
        continue;
      }
      item.candidates.forEach(candidate => {
        candidate.content.parts.forEach(part => {
          fullText += part.text + '\n'; // Add new line to safely handle concatenation
        });
      });
    }

    // First attempt with JSON parsing if the format is strict JSON
    try {
      const data = JSON.parse(fullText.trim());
      if (data.captcha) {
        return data.captcha;
      }
    } catch {
      console.log('Not a valid json stream');
    }

    // Fallback to regex if JSON parsing fails
    const regex = /"captcha"\s*:\s*"(\d+)"/;
    const match = regex.exec(fullText);

    if (match && match[1]) {
      return match[1];
    } else {
      console.log('Captcha not found in the response.');
    }

    // for await (const item of streamingResp.stream) {
    //   if (!item.candidates || item.candidates.length === 0) {
    //     continue;
    //   }
    //   const { content } = item.candidates[0];
    //   // console.log('content', content);
    //   if (!content || !content.parts || content.parts.length === 0) {
    //     continue;
    //   }

    //   // Append all parts to the fullText string
    //   content.parts.forEach(part => {
    //     fullText += part.text + ' '; // Add space to separate parts to safely handle concatenation
    //   });

    //   console.log('Aggregated content:', fullText);

    //   // Define regex to extract the captcha value, accounting for possible formatting and newlines
    //   const regex = /"captcha":\s*(\d+)/;
    //   const match = regex.exec(fullText);
    //   console.log(match);
    //   if (match && match[1]) {
    //     const captchaValue = match[1];
    //     console.log('Captcha value:', captchaValue);
    //     return captchaValue;
    //   } else {
    //     console.log('Captcha not found in the response.');
    //   }
    //   // if (match && match[1]) {
    //   //   captchaSum = parseInt(match[1]);
    //   //   break;
    //   // }
    // }

    // if (captchaSum !== null) {
    //   // Call function to perform browser automation with the extracted sum
    //   const sessionCookie = await automateBrowser(page, captchaSum);

    //   return sessionCookie;
    // } else {
    //   console.error('Failed to extract sum from API response');
    // }
  } catch (error) {
    console.error('Error generating content:', error);
  }
};
