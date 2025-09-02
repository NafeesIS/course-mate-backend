import { getCurrencySymbol, toTitleCase } from '../../dataFormatter';

interface DirectorContactEmailData {
  directorName: string;
  directorMobile: string | null;
  directorEmail: string | null;
  din: string;
  orderId: string;
  amount: number;
  currency: string;
}

const directorContactDetailsEmail = (data: DirectorContactEmailData) => {
  const { directorName, directorMobile, directorEmail, din, orderId, amount, currency } = data;
  const currencySymbol = getCurrencySymbol(currency);

  const htmlContent = `
 
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Director Contact Details</title>
    </head>
    <body
      style="
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        color: #333333;
        background-color: #f7f7f7;
      "
    >
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 20px 0">
            <table
              role="presentation"
              style="
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              "
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
            >
              <!-- Header -->
              <tr>
                <td
                  style="
                    padding: 30px 30px 20px;
                    text-align: center;
                    background-color: #4a6cf7;
                    border-radius: 8px 8px 0 0;
                  "
                >
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px">
                    Thank You for Your Purchase
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 30px">
                  <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px; line-height: 1.5">
                    Dear Customer,
                  </p>

                  <p style="margin-top: 0; margin-bottom: 20px; font-size: 16px; line-height: 1.5">
                    Thank you for your payment. As requested, here are the contact details:
                  </p>
                 <table
                    role="presentation"
                    style="
                      width: 100%;
                      border-collapse: collapse;
                      margin-bottom: 25px;
                      border: 1px solid #e0e0e0;
                      border-radius: 6px;
                    "
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                  >
                    <tr>
                      <td
                        style="
                          padding: 15px;
                          background-color: #f5f8ff;
                          border-radius: 6px 6px 0 0;
                          border-bottom: 1px solid #e0e0e0;
                        "
                      >
                        <h3 style="margin: 0; font-size: 16px; color: #222831">
                          Director Details
                        </h3>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 20px">
                        <table
                          role="presentation"
                          style="width: 100%"
                          cellspacing="0"
                          cellpadding="0"
                          border="0"
                        >
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee">
                              <strong style="font-size: 14px; color: #555555">DIN:</strong>
                            </td>
                            <td
                              style="
                                padding: 8px 0;
                                border-bottom: 1px solid #eeeeee;
                                text-align: right;
                              "
                            >
                              <span style="font-size: 14px">${din}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee">
                              <strong style="font-size: 14px; color: #555555">Name:</strong>
                            </td>
                            <td
                              style="
                                padding: 8px 0;
                                border-bottom: 1px solid #eeeeee;
                                text-align: right;
                              "
                            >
                              <span style="font-size: 14px">${toTitleCase(directorName)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee">
                              <strong style="font-size: 14px; color: #555555">Mobile:</strong>
                            </td>
                            <td
                              style="
                                padding: 8px 0;
                                border-bottom: 1px solid #eeeeee;
                                text-align: right;
                              "
                            >
                              <span style="font-size: 14px">${directorMobile}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0">
                              <strong style="font-size: 14px; color: #555555">Email:</strong>
                            </td>
                            <td style="padding: 8px 0; text-align: right">
                              <span style="font-size: 14px; font-weight: bold"
                                >${directorEmail}</span
                              >
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>
                  <table
                    role="presentation"
                    style="
                      width: 100%;
                      border-collapse: collapse;
                      margin-bottom: 25px;
                      border: 1px solid #e0e0e0;
                      border-radius: 6px;
                    "
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                  >
                    <tr>
                      <td
                        style="
                          padding: 15px;
                          background-color: #FDFAF6;
                          border-radius: 6px 6px 0 0;
                          border-bottom: 1px solid #e0e0e0;
                        "
                      >
                        <h3 style="margin: 0; font-size: 16px; color: #222831">
                          Transaction Details
                        </h3>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 20px">
                        <table
                          role="presentation"
                          style="width: 100%"
                          cellspacing="0"
                          cellpadding="0"
                          border="0"
                        >
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee">
                              <strong style="font-size: 14px; color: #555555">Order ID:</strong>
                            </td>
                            <td
                              style="
                                padding: 8px 0;
                                border-bottom: 1px solid #eeeeee;
                                text-align: right;
                              "
                            >
                              <span style="font-size: 14px">${orderId}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0">
                              <strong style="font-size: 14px; color: #555555">Amount:</strong>
                            </td>
                            <td style="padding: 8px 0; text-align: right">
                              <span style="font-size: 14px; font-weight: bold"
                                >${currencySymbol} ${amount.toFixed(2)}</span
                              >
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px; line-height: 1.5">
                    Thank you for using our service. If you have any questions, please don't hesitate
                    to contact our support team.
                  </p>
                </td>
              </tr>

              <!-- Need Assistance Section -->
              <tr>
                <td
                  style="padding: 20px 30px; background-color: #f5f9ff; border-top: 1px solid #eeeeee"
                >
                  <h2
                    style="
                      text-align: center;
                      color: #333333;
                      font-size: 20px;
                      margin-top: 0;
                      margin-bottom: 20px;
                    "
                  >
                    Need Assistance?
                  </h2>

                  <table
                    role="presentation"
                    style="width: 100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                  >
                    <tr>
                      <td style="padding: 0 5px" width="50%">
                        <a
                          href="tel:+918104946419"
                          style="
                            display: block;
                            background-color: #4285f4;
                            color: #ffffff;
                            text-decoration: none;
                            padding: 12px 20px;
                            border-radius: 6px;
                            text-align: center;
                            font-weight: bold;
                          "
                        >
                          <span style="display: inline-block; vertical-align: middle">📞</span> Call
                          Us
                        </a>
                      </td>
                      <td style="padding: 0 5px" width="50%">
                        <a
                          href="https://wa.me/918104946419"
                          style="
                            display: block;
                            background-color: #4fce5d;
                            color: #ffffff;
                            text-decoration: none;
                            padding: 12px 20px;
                            border-radius: 6px;
                            text-align: center;
                            font-weight: bold;
                          "
                        >
                          <span style="display: inline-block; vertical-align: middle">💬</span>
                          WhatsApp
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  return htmlContent;
};

export default directorContactDetailsEmail;
