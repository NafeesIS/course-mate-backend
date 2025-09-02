const generateVerifyEmailBody = (verificationLink: string, email: string) => {
  return `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link
            href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
            rel="stylesheet"
            />
            <title>Responsive Email Template</title>
            <style>
            @media screen and (max-width: 600px) {
                .content {
                width: 100% !important;
                display: block !important;
                padding: 10px !important;
                }

                .header,
                .body,
                .footer {
                padding: 20px !important;
                }
            }
            </style>
        </head>

        <body
            style="font-family: 'Poppins', Arial, sans-serif; background-color: #dbe2ef"
        >
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding: 10px">
                <table
                    class="content"
                    width="600"
                    border="0"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                    border-collapse: collapse;
                    border: 1px solid #dbe2ef;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    "
                >
                    <!-- Header -->
                    <tr>
                    <td
                        class="header"
                        style="
                        background-color: #3457d5db;
                        padding: 20px;
                        text-align: center;
                        "
                    >
                        <a
                        href="https://www.filesure.in/"
                        style="color: #3f64ea"
                        target="_blank"
                        >
                        <img
                            src="https://www.filesure.in/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ffilesure-logo-light.1425614d.png&w=256&q=100"
                            alt="FileSure"
                            style="
                            border: none;
                            vertical-align: middle;
                            width: 120px;
                            height: auto;
                            "
                            class="CToWUd"
                            data-bit="iit"
                        />
                        </a>
                    </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                    <td
                        class="body"
                        style="
                        padding: 20px;
                        text-align: left;
                        font-size: 16px;
                        line-height: 1.6;
                        "
                    >
                        <p style="font-size: 60px; text-align: center; margin: 0">📧</p>
                        <p
                        style="
                            text-align: center;
                            font-size: 20px;
                            font-weight: 600;
                            margin: 0;
                        "
                        >
                        Verify Your Email
                        </p>
                        <p style="margin: 10px 0 0 0; text-align: center;">
                        Thank you for signing up for <strong>FileSure</strong>! We're
                        excited to have you on board. To get started, please verify
                        your email address by clicking the button below:
                        </p>
                    </td>
                    </tr>

                    <!-- Call to action Button -->
                    <tr>
                    <td style="padding: 0px 40px 0px 40px; text-align: center">
                        <!-- CTA Button -->
                        <table cellspacing="0" cellpadding="0" style="margin: auto">
                        <tr>
                            <td
                            align="center"
                            style="
                                background-color: #87A96B;
                                padding: 10px 20px;
                                border-radius: 5px;
                            "
                            >
                            <a
                                href=${verificationLink}
                                target="_blank"
                                style="
                                color: #ffffff;
                                text-decoration: none;
                                font-weight: bold;
                                "
                                >Verify My Email</a
                            >
                            </td>
                        </tr>
                        </table>
                    </td>
                    </tr>

                    <!-- Alternative URL -->
                    <tr>
                    <td style="padding: 0px 40px 0px 40px; text-align: center">
                        <!-- -->
                        <table cellspacing="0" cellpadding="0" style="margin: auto">
                        <tr>
                            <td
                            align="center"      
                            >
                            <p
                            style="
                            margin: 30px 0 0 0;
                            font-family: 'Hevetica', sans-serif;
                            font-size: 16px;
                            line-height: 23px;
                            font-weight: 400;
                            text-align: center;
                            "
                        >
                            Alternatively, you can directly paste this link in
                            your browser <br />
                            <a
                            style="
                                font-family: 'Helvetica', sans-serif, sans-serif;
                                text-align: center;
                                word-break: break-all;
                                font-weight: 400;
                                font-size: 14px;
                                line-height: 23px;
                                color: #007aff !important;
                            "
                            href=${verificationLink}
                            target="_blank"
                            >${verificationLink}</a
                            >
                        </p>
                            </td>
                        </tr>
                        </table>
                    </td>
                    </tr>

                    <!-- Caution -->
                    <tr>
                    <td
                        class="body"
                        style="
                        padding: 40px;
                        text-align: center;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #333333;
                        "
                    >
                        <p>
                        This email was sent to
                        <strong>${email}</strong>. If you didn't request
                        this email, you can safely ignore it.
                        </p>
                    </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                    <td
                        class="footer"
                        style="
                        background-color: #4B9CD3;
                        padding: 10px;
                        text-align: center;
                        color: white;
                        font-size: 12px;
                        "
                    >
                        Copyright &copy; ${new Date().getFullYear()} | FileSure
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

export default generateVerifyEmailBody;
