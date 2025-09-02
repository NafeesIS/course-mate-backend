export const generateEmailBody = (
  company_name: string,
  cin: string,
  dateOfIncorporation: string,
  FilingDueDate: string,
  compliance_url: string,
  recipient_email: string
) => {
  return `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0" />
    <meta
      http-equiv="Content-Type"
      content="text/html charset=UTF-8" />
    <title>Compliance Alert</title>
    <style>
      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
      }
      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
      }
      table {
        border-collapse: collapse !important;
      }
      body {
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
      }
      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
      }
      @media screen and (max-width: 525px) {
        .wrapper {
          width: 100% !important;
          max-width: 100% !important;
        }
        .responsive-table {
          width: 100% !important;
        }
        .padding {
          padding: 10px 5% 15px 5% !important;
        }
        .section-padding {
          padding: 0 15px 50px 15px !important;
        }
      }
      .form-container {
        padding: 30px 24px !important;
      }
      div[style*='margin: 16px 0;'] {
        margin: 0 !important;
      }
    </style>
  </head>
  <body style="margin: 0 !important; padding: 0 !important; background: #f3f3f3">
    <table
      border="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      style="max-width: 600px"
      align="center">
      <tr>
        <td
          align="center"
          valign="top"
          width="100%"
          style="background-color: #f3f3f3; padding: 20px 0"
          class="mobile-padding">
          <table
            align="center"
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="100%"
            style="max-width: 600px">
            <tr>
              <td
                align="center"
                valign="top"
                style="padding: 0 0 25px 0; font-family: Arial, sans-serif">
                <table
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  width="100%">
                  <tr>
                    <td
                      align="center"
                      bgcolor="#ffffff"
                      style="border-radius: 12px 12px 0 0;">
                      <span style="background-color: rgba(255, 0, 0, 0.8); height: 8px; width: 100%; display: block; border-radius: 12px 12px 0 0;"></span>
                      <h1 style="font-size: 24px; color: #25253B; margin: 0; padding-top: 20px; font-weight: 600">
                        Compliance
                        <span
                          style="
                            color: red;
                            border: 2px solid red;
                            border-radius: 8px;
                            padding: 4px 8px;
                            font-size: 20px;
                            margin-left: 10px;
                          ">
                          ALERT !!
                        </span>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="center"
                      bgcolor="#ffffff">
                      <h2 style="font-size: 20px; color: #25253B; margin: 0; padding: 20px 0; font-weight: 500">
                        Form INC-20A Filing Submission Overdue
                      </h2>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td
                align="left"
                height="100%"
                valign="top"
                width="100%"
                style="padding: 0 0 20px 0"
                bgcolor="#ffffff">
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="max-width: 600px">
                  <tr>
                    <td
                      align="left"
                      valign="top"
                      style="font-size: 0; padding: 0 20px">
                      <div
                        style="
                          display: inline-block;
                          max-width: 100%;
                          min-width: 240px;
                          vertical-align: top;
                          width: 100%;
                        ">
                        <table
                          align="left"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          >
                          <tr>
                            <td
                              align="left"
                              valign="top"
                              style="
                                font-family: Arial, sans-serif;
                                font-size: 16px;
                                font-weight: 400;
                                line-height: 30px;
                                padding: 15px 0 0 0;
                                color: #25253B;
                              ">
                              <p>
                                <span style="font-weight: 600">Ministry of Corporate Affairs (MCA)</span>
                                records shows your company has
                                <span style="font-weight: 600"
                                  ><span style="background-color: red; padding: 4px 6px; color: #f3f3f3; margin: 0 3px 0 0; border-radius: 4px; white-space: nowrap;">not filed</span> Form INC-20A (Commencement of Business)</span
                                >
                                within the required six-month period following the company's incorporation.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td
                align="center"
                height="100%"
                valign="top"
                width="100%"
                bgcolor="#ffffff"
                style="padding: 0 20px 20px 20px">
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="max-width: 600px; color: #25253B;">
                  <tr>
                    <td
                      align="left"
                      valign="top"
                      style="font-family: Arial, sans-serif; font-size: 16px; font-weight: 600; padding-bottom: 15px">
                      Please find the details below:
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="left"
                      valign="top">
                      <table
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        width="100%"   
                        style="box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2); border-radius: 12px;border: 1px solid #d5d5d5; border-collapse: separate; border-spacing: 0; overflow: hidden;"                     
                        >
                        <tr>
                          <td
                            width="40%"
                            align="left"
                            bgcolor="#007bff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 500;
                              line-height: 24px;
                              padding: 10px;
                              color: #ffffff;
                              border: 1px solid #d5d5d5;
                            ">
                            Company Name:
                          </td>
                          <td
                            width="60%"
                            align="left"
                            bgcolor="#ffffff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 600;
                              line-height: 24px;
                              padding: 10px;
                              border: 1px solid #d5d5d5;
                            ">
                            ${company_name}
                          </td>
                        </tr>
                        <tr>
                          <td
                            width="40%"
                            align="left"
                            bgcolor="#007bff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 500;
                              line-height: 24px;
                              padding: 10px;
                              color: #ffffff;
                              border: 1px solid #d5d5d5;
                            ">
                            CIN:
                          </td>
                          <td
                            width="60%"
                            align="left"
                            bgcolor="#ffffff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 600;
                              line-height: 24px;
                              padding: 10px;
                              border: 1px solid #d5d5d5;
                            ">
                            ${cin}
                          </td>
                        </tr>
                        <tr>
                          <td
                            width="40%"
                            align="left"
                            bgcolor="#007bff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 500;
                              line-height: 24px;
                              padding: 10px;
                              color: #ffffff;
                              border: 1px solid #d5d5d5;
                            ">
                            Incorporation Date:
                          </td>
                          <td
                            width="60%"
                            align="left"
                            bgcolor="#ffffff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 600;
                              line-height: 24px;
                              padding: 10px;
                              border: 1px solid #d5d5d5;
                            ">
                            ${dateOfIncorporation}
                          </td>
                        </tr>
                        <tr>
                          <td
                            width="40%"
                            align="left"
                            bgcolor="#007bff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 500;
                              line-height: 24px;
                              padding: 10px;
                              color: #ffffff;
                              border: 1px solid #d5d5d5;
                            ">
                            Due Date for Filing:
                          </td>
                          <td
                            width="60%"
                            align="left"
                            bgcolor="#ffffff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 600;
                              line-height: 24px;
                              padding: 10px;
                              border: 1px solid #d5d5d5;
                            ">
                            ${FilingDueDate}
                          </td>
                        </tr>
                        <tr>
                          <td
                            width="40%"
                            align="left"
                            bgcolor="#007bff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 500;
                              line-height: 24px;
                              padding: 10px;
                              color: #ffffff;
                              border: 1px solid #d5d5d5;
                            ">
                            Filing Status:
                          </td>
                          <td
                            width="60%"
                            align="left"
                            bgcolor="#ffffff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 600;
                              line-height: 24px;
                              padding: 10px;
                              border: 1px solid #d5d5d5;
                            ">
                            <!-- <u>NOT Filed</u> -->
                             <span style="background-color: red; padding: 4px 6px; color: #f3f3f3; margin: 0 3px 0 0; border-radius: 4px; white-space: nowrap;">Not Filed</span>
                          </td>
                        </tr>
                        <tr>
                          <td
                            width="40%"
                            align="left"
                            bgcolor="#007bff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 500;
                              line-height: 24px;
                              padding: 10px;
                              color: #ffffff;
                              border: 1px solid #d5d5d5;
                            ">
                            Compliance Details:
                          </td>
                          <td
                            width="60%"
                            align="left"
                            bgcolor="#ffffff"
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 600;
                              line-height: 24px;
                              padding: 10px;
                              border: 1px solid #d5d5d5;
                              
                            ">
                            <a
                              href="https://www.filesure.in/${compliance_url}"
                              style="
                                background: #ffffff;
                                border: 2px solid #010952;
                                color: #010952;
                                font-family: Arial, sans-serif;
                                font-size: 14px;
                                font-weight: 600;
                                line-height: 24px;
                                padding: 6px 16px 5px 16px;
                                text-align: center;
                                text-decoration: none;
                                border-radius: 8px;
                                display: inline-block;
                              ">
                              Visit Page ↗
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td
                align="center"
                height="100%"
                valign="top"
                width="100%"
                bgcolor="#ffffff"
                style="padding: 40px 20px 20px 20px">
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="max-width: 600px">
                  <tr>
                    <td
                      align="left"
                      valign="top"
                      style="font-family: Arial, sans-serif; font-size: 16px; font-weight: 600; padding: 12px; border-radius: 0 12px 12px 0; background-color: rgba(0, 128, 0, 0.1); border-left: 4px solid rgba(0, 128, 0, 0.8); box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2);">
                      <span style="font-size: 20px; margin-right: 5px;">📢</span> Important Information
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="left"
                      valign="top"
                      style="font-family: Arial, sans-serif; font-size: 16px; font-weight: 400; padding: 15px 0; line-height: 24px">
                      <p>
                        <strong>Filing Form INC-20A</strong> is a mandatory requirement for all newly incorporated
                        companies under the Companies Act, 2013.
                      </p>
                      <p>
                        Failure to comply with this requirement can result in significant <strong>penalties</strong> and
                        could lead to further <strong>legal implications</strong> for your company.
                      </p>
                      <p>
                        If you'd prefer to avoid the hassle and ensure everything is done correctly, our team of experts
                        is here to help.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td
                align="center"
                height="100%"
                valign="top"
                width="100%"
                bgcolor="#ffffff"
                style="padding: 0 20px 20px 20px">
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="max-width: 600px">
                  <tr>
                    <td
                      align="left"
                      valign="top"
                      style="font-family: Arial, sans-serif; font-size: 18px; font-weight: 600; padding-bottom: 15px">
                      Choose FileSure & Get Benefits
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="left"
                      valign="top">
                      <table
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        width="100%">
                        <tr>
                          <td
                            align="left"
                            bgcolor="#d6faff"
                            style="border-radius: 12px; box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2); padding: 14px 10px">
                            <table
                              cellspacing="0"
                              cellpadding="0"
                              border="0"
                              width="100%">
                              <tr>
                                <td
                                  width="50"
                                  align="center">
                                  <span style="font-size: 26px; margin-right: 16px">⏰</span>
                                </td>
                                <td
                                  align="left"
                                  style="
                                    font-family: Arial, sans-serif;
                                    font-size: 16px;
                                    font-weight: 400;
                                    line-height: 24px;
                                  ">
                                  <p style="font-weight: 600; margin: 0">Accurate and Timely Filing</p>
                                  <p style="margin: 0; font-size: 14px">Avoid penalties and ensure your compliance is up to date.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td height="10"></td>
                        </tr>
                        <tr>
                          <td
                            align="left"
                            bgcolor="#d6faff"
                            style="border-radius: 12px; box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2); padding: 14px 10px">
                            <table
                              cellspacing="0"
                              cellpadding="0"
                              border="0"
                              width="100%">
                              <tr>
                                <td
                                  width="50"
                                  align="center">
                                  <span style="font-size: 26px; margin-right: 16px">😎</span>
                                </td>
                                <td
                                  align="left"
                                  style="
                                    font-family: Arial, sans-serif;
                                    font-size: 16px;
                                    font-weight: 400;
                                    line-height: 24px;
                                  ">
                                  <p style="font-weight: 600; margin: 0">Expert Assistance</p>
                                  <p style="margin: 2px 0 0 0; font-size: 14px;">
                                    Our experienced team handles everything, so you don't have to worry about the
                                    details.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td height="10"></td>
                        </tr>
                        <tr>
                          <td
                            align="left"
                            bgcolor="#d6faff"
                            style="border-radius: 12px; box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2); padding: 14px 10px">
                            <table
                              cellspacing="0"
                              cellpadding="0"
                              border="0"
                              width="100%">
                              <tr>
                                <td
                                  width="50"
                                  align="center">
                                  <span style="font-size: 26px; margin-right: 16px">✌</span>
                                </td>
                                <td
                                  align="left"
                                  style="
                                    font-family: Arial, sans-serif;
                                    font-size: 16px;
                                    font-weight: 400;
                                    line-height: 24px;
                                  ">
                                  <p style="font-weight: 600; margin: 0">Peace of Mind</p>
                                  <p style="margin: 0; font-size: 14px;">
                                    Focus on your business while we take care of your compliance needs.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td
                align="center"
                height="100%"
                valign="top"
                width="100%"
                bgcolor="#e6f2fb"
                style="padding: 20px">
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="max-width: 600px">
                  <tr>
                    <td
                      align="center"
                      valign="top">
                      <img
                        src="https://filesurecomppdf.s3.ap-south-1.amazonaws.com/filesure_logo_padded+(1).jpg"
                        alt="Filesure"
                        style="width: 150px; max-width: 200px; margin-bottom: 20px; border-radius: 8px; overflow: hidden;" />
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="center"
                      valign="top"
                      style="font-family: Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 24px">
                      <p style="margin: 0">
                        India's First Platform Dedicated To Simplifying RoC Compliance For Company Owners And Compliance
                        Professionals
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="center"
                      valign="top"
                      style="
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        font-weight: 600;
                        line-height: 24px;
                        padding-top: 20px;
                      ">
                      Reach Out To Us
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="center"
                      valign="top"
                      style="padding-top: 20px">
                      <table
                        border="0"
                        cellspacing="0"
                        cellpadding="0">
                        <tr>
                          <td
                            align="center"
                            style="border-radius: 12px"
                            bgcolor="#007bff">
                            <a
                              href="tel:+912048556622"
                              target="_blank"
                              style="
                                font-size: 16px;
                                font-family: Arial, sans-serif;
                                color: #ffffff;
                                text-decoration: none;
                                border-radius: 12px;
                                background-color: #007bff;
                                padding: 10px 20px;
                                border: 1px solid #007bff;
                                display: block;
                                box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2);
                              "
                              >📞 +91 20 4855 6622</a
                              
                            >
                          </td>
                        </tr>
                        <tr>
                          <td height="10"></td>
                        </tr>
                        <tr>
                          <td
                            align="center"
                            style="border-radius: 12px"
                            bgcolor="#25d366">
                            <a
                              href="https://wa.me/912048556622"
                              target="_blank"
                              style="
                                font-size: 16px;
                                font-family: Arial, sans-serif;
                                color: #ffffff;
                                text-decoration: none;
                                border-radius: 12px;
                                background-color: #25d366;
                                padding: 10px 20px;
                                border: 1px solid #25d366;
                                display: block;
                                box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2);
                              "
                              >💬 Chat On WhatsApp</a
                            >
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="center"
                      valign="top"
                      style="
                        font-family: Arial, sans-serif;
                        font-size: 12px;
                        font-weight: 400;
                        line-height: 24px;
                        padding-top: 20px;
                      ">
                      <p style="margin: 0">
                        <strong>Corporate Office :</strong> 6th Floor, Rahimtoola House, Homji Street, Near Horniman
                        Circle, Kala Ghoda, Fort, Mumbai, Maharashtra - 400 001.
                      </p>
                      <p style="margin: 0"><strong>CIN :</strong> U62013MH2023PTC411571</p>
                      <p style="margin: 0">
                        If you prefer to not receive email from us,
                        <a
                          href="https://development.filesure.in/api/v1/leads/unsubscribe?email=${recipient_email}"
                          style="color: #007bff; text-decoration: none"
                          >Unsubscribe here</a
                        >
                      </p>
                      <p style="margin: 0">© 2024 Filesure India Private Limited. All rights reserved.</p>
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
};
