// eslint-disable-next-line @typescript-eslint/no-explicit-any

import { getDate } from 'date-fns';

const userId = [
  'RYM02O39@LSH.MY.ID',
  '8GETE8V1@LUXUSMAIL.MY.ID',
  'MS7AZLX28@LUXUSMAIL.MY.ID',
  '6XLPB6JF@WHATISAKILOWATT.COM',
  'CN9LABT@LUXUSMAIL.MY.ID',
  '8UVXPVTOK@LSH.MY.ID',
  'P8OZOWM@LSH.MY.ID',
  'V7XNUQ6HL@MIRAMAIL.MY.ID',
  '2NEHSFTEQ@WHATISAKILOWATT.COM',
  'A5T2ZI@LUXUSMAIL.MY.ID',
  'SHFM20R@AMIK.PRO',
  'GU1T7R@HIGHMAIL.MY.ID',
  'KCGVQV@AMIK.PRO',
  'HFF6O238@WHATISAKILOWATT.COM',
  'GME7I5BB@LUXUSMAIL.MY.ID',
  'N5AFXM6R@MIRAMAIL.MY.ID',
  'HE24I4R@LUXUSMAIL.MY.ID',
  '5BV258K@AMIK.PRO',
  'Z7VMSH8I@MIRAMAIL.MY.ID',
  // 'N88QJU9V@HIGHMAIL.MY.ID', user id locked
  'XMT0A06@AMIK.PRO',
  'S56HSHM@AMIK.PRO',
  'C6CIBQNGD@MIRAMAIL.MY.ID',
  'H0NOAFK1C@WHATISAKILOWATT.COM',
  '76INZXHD0@LUXUSMAIL.MY.ID',
  'EAIDDFE@MIRAMAIL.MY.ID',
  'AJO0QG@MIRAMAIL.MY.ID',
  '3ZDSAQFV@AMIK.PRO',
  '2JD4F4TBY@LUXUSMAIL.MY.ID',
  'RYM02O39@LSH.MY.ID',
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const automateBrowser = async (page: any, captchaSum: number) => {
  //get todays date
  const today = new Date();

  //get the day of the month
  const dayOfMonth = getDate(today);

  const index = (dayOfMonth - 1) % userId.length;

  ///get the userId for today
  const userIdForToday = userId[index];
  // console.log('userIdForToday', userIdForToday);

  // Enter username
  await page.type(
    '#guideContainer-rootPanel-panel_1846244155-guidetextbox___widget',
    userIdForToday
  );

  // Enter password
  await page.type(
    '#guideContainer-rootPanel-panel_1846244155-guidepasswordbox___widget',
    'Mca@2024Feb'
  );

  // Enter captcha solution
  await page.type('#customCaptchaInput', captchaSum.toString());

  // Click on validate captcha button
  await page.click('#check');

  // Wait for the login button to become visible
  await page.waitForSelector('.iconButton-label');

  // Click on login button
  await page.click('.iconButton-label');

  // Wait for the login process to complete
  await page.waitForNavigation();

  // After logging in successfully, retrieve and log the session cookies
  const cookies = await page.cookies();

  // console.log('Session cookies:', cookies);
  return cookies;
};
