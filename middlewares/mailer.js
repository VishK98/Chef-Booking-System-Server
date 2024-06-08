const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
const schedule = require("node-schedule");
const bodyParser = require("body-parser");
const ipinfo = require("ipinfo");
const moment = require("moment-timezone");

const OTP = require("../models/otpSchema");
const Invoice = require("../models/invoiceSchema");

const AppLogoS3 = "https://chefonwheelz.s3.ap-south-1.amazonaws.com/logo.png";

const notAllowedEmails = [
    "bharoliyahetvi@gmail.com",
    "reddy27@gmail.com",
    "johnhirst@y7mail.com",
    "andre.doria87@gmail.com",
    "John.Frances@gmail.com",
    "najiayasir@hotmail.com",
];

const getDishesNameList = (dishDetails) => {
    if (dishDetails === undefined || !dishDetails) return "";
    return dishDetails.map((dish) => dish).join(",  ");
};

const getAdditionalInfo = (dietaryRestrictions) => {
    if (
        dietaryRestrictions === undefined ||
        dietaryRestrictions === "" ||
        !dietaryRestrictions
    )
        return "N/A";
    else return dietaryRestrictions;
};

const generateOTP = () => {
    const digits = "0123456789";

    const getRandomDigit = () => {
        const randomIndex = Math.floor(Math.random() * digits.length);
        return digits[randomIndex];
    };

    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += getRandomDigit();
    }

    return otp;
};

const pdfHTMLGenerator = ({
    userName,
    userEmail,
    chefName,
    bookingDate,
    date,
    time,
    adultCount,
    childCount,
    dietaryRestrictions,
    subTotal,
    platformFee,
    promoDiscount,
    tax,
    totalFee,
    venue,
    dishNames,
    invoiceID,
}) => {
    // let bookingDateTime = new Date(bookingDate);
    // // let date = bookingDateTime.toLocaleDateString();
    // // let time = bookingDateTime.toLocaleTimeString();
    // let date = bookingDateTime.toISOString().split("T")[0];
    // let time = bookingDateTime.toISOString().split("T")[1].slice(0, 8);
    const htmlForPDF = `<!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Booking Invoice</title>
                <style>
                    body {
                        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 0;
                    }

                    .app-name {
                        color: #107569;
                    }
                    
                    .order-summary{
                        text-align: center;
                        font-weight: bold;
                        font-size: 1.3rem;
                    }

                    .invoice-container {
                        max-width: 800px;
                        margin: 20px auto;
                        padding: 20px;
                        border: 1px solid #ccc;
                    }

                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }

                    .header-logo {
                        margin-bottom: 10px;
                    }

                    .header-address {
                        margin-bottom: 20px;
                    }

                    .invoice-details {
                        width: 100%;
                        margin-bottom: 20px;
                    }

                    .invoice-details th,
                    .invoice-details td {
                        text-align: left;
                        padding: 8px;
                        border-bottom: 1px solid #eee;
                    }

                    .company-abn {
                        text-align: left;
                        padding: 8px;
                        border-bottom: 1px solid #eee;
                    }

                    .invoice-items {
                        width: 100%;
                        margin-bottom: 20px;
                    }

                    .invoice-items th,
                    .invoice-items td {
                        text-align: left;
                        padding: 8px;
                        border-bottom: 1px solid #eee;
                    }

                    .invoice-summary {
                        width: 100%;
                    }

                    .invoice-summary th,
                    .invoice-summary td {
                        text-align: left;
                        padding: 8px;
                    }

                    .footer {
                        text-align: center;
                        margin-top: 30px;
                    }

                    .total td {
                        border-bottom: 1px solid #eee;
                        border-top: 1px solid #eee;
                    }
                </style>
            </head>

            <body>
                <div class="invoice-container">
                    <div class="header">
                        <div class="header-logo">
                            <img
                                src="${AppLogoS3}"
                                alt="Chef on Wheelz Logo"
                                style="height: 3em; width: auto"
                            />
                            <h1 class="app-name">Chef on Wheelz</h1>
                        </div>
                        <div>Invoice: #${invoiceID}</div>
                        <div>Issue date: ${date}</div>
                    </div>

                    <table class="company-abn">
                        <tr>
                            <th>ZENTACT SYSTEMS PTY LTD</th>
                        </tr>
                        <tr>
                            <td>ABN: 49 627 129 542</td>
                        </tr>
                    </table>
                    <table class="company-abn">
            </table>

                    <table class="invoice-details">
                        <tr>
                            <th>Service</th>
                            <th>Customer</th>
                            <th>Payment</th>
                        </tr>

                        <tr>
                            <td>
                                Service:<br /> On demand Chef<br />
                                Chef: ${chefName}<br />
                                Date of Service: ${date}<br />
                                Time: ${time}
                            </td>
                            <td>
                                ${userName}<br />
                                ${userEmail}<br />
                                ${venue.addressLine}, ${venue.city}, ${
        venue.state
    },
                                ${venue.zipCode}
                            </td>
                            <td>
                                Payment Date: ${date}<br />
                                Due Date: ${date}
                            </td>
                        </tr>
                    </table>
                    
                    <p class="order-summary">Order Summary</p>

                    <table style="width: 100%" class="invoice-summary">
                        <tr>
                            <td>Dishes</td>
                            <td>${getDishesNameList(dishNames)}</td>
                        </tr>
                        <tr>
                            <td>Adults</td>
                            <td>${adultCount} Adults</td>
                        </tr>
                        <tr>
                            <td>Kids</td>
                            <td>${childCount} Kids</td>
                        </tr>
                        <tr>
                            <td>Chef Charges</td>
                            <td>+ $${subTotal}</td>
                        </tr>
                        <tr>
                            <td>Platform Fee</td>
                            <td>+ $${platformFee}</td>
                        </tr>
                        <tr>
                            <td>Promotional Discount</td>
                            <td>- $${promoDiscount}</td>
                        </tr>
                        
                        <tr class="total">
                            <td class="total" style="width: 75%"><strong>Total</strong></td>
                            <td class="total"><strong>$${totalFee} </strong></td>
                        </tr>
                    </table>

                    <div class="footer">
                        <p>Thank you for using Chef on Wheelz service.</p>
                        <p>
                            Please contact us if you have any queries: <br />
                            📞 03 1234 5678 <br />
                            📧 support@chefonwheelz.com.au
                        </p>
                    </div>
                </div>
            </body>
        </html>`;
    return htmlForPDF;
};

module.exports.sendOTPEmail = async (req, res) => {
    try {
        const otp = generateOTP();
        const { name, email } = req.body;
        const transporter = nodemailer.createTransport({
            host: `${process.env.SMTP_HOST}`,
            port: `${process.env.SMTP_PORT}`,
            secure: true,
            auth: {
                user: `${process.env.SMTP_USER_OTP_VERIFICATION}`,
                pass: `${process.env.SMTP_PASS_OTP_VERIFICATION}`,
            },
        });

        // Send email with OTP
        let message = {
            from: "Chef On Wheelz <notification@chefonwheelz.com>",
            to: email,
            subject: "Email verification via OTP",
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>OTP Verification</title>
              <style>
                body, h1, p {
                  margin: 0;
                  padding: 0;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                  background-color: #f9f9f9;
                  border-radius: 10px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                  padding: 20px;
                  text-align: center;
                  border-top-left-radius: 10px;
                  border-top-right-radius: 10px;
                }
                .content {
                  padding: 20px;
                  background-color: #fff;
                  border-radius: 0 0 10px 10px;
                  border: 1px solid #e0e0e0;
                }
                .button {
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #107569;
                  color: #fff;
                  text-decoration: none;
                  border-radius: 5px;
                  margin-top: 20px;
                  border: none;
                  cursor: pointer;
                }
                .button:hover {
                  background-color: #0a564a;
                }
                a {
                  color: #107569;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
                .logo {
                  max-width: 100px;
                  margin-bottom: 20px;
                }
                #logo-text {
                  color: #107569;
                }
                .signature {
                  margin-top: 20px;
                  border-top: 1px solid #e0e0e0;
                  padding-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <img src=${AppLogoS3} alt="Chef on Wheelz Logo" class="logo">
                  <h1>Welcome to <span id="logo-text">Chef on Wheelz</span>!</h1>
                </div>
                <div class="content">
                  <p>Dear ${name},</p>
                  <p>Your One-Time Password (OTP) for verification is: <strong>${otp}</strong></p>
                  <p>Please use this OTP to complete your verification process.</p>
                  <p>If you didn't request this OTP, please ignore this email.</p>
                  <p>Thank you!</p>
                </div>
                <div class="signature">
                  <p>Best regards,<br>Team <span id="logo-text">Chef on Wheelz</span>!</p>
                </div>
              </div>
            </body>
            </html>
            `,
        };
        await transporter.sendMail(message);

        const newOTP = await OTP.create({
            email: email,
            sentOtp: otp,
            generatedTime: req.otpGenerationTime,
        });

        res.status(200).json({
            success: true,
            message: "OTP sent successfully.",
            userName: name,
            userEmail: email,
            redirectRoute: "/api/users/verify",
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({
            success: false,
            message: "Error sending OTP",
            redirectRoute: "/api/users/signup",
        });
    }
};

module.exports.sendSignUpEmail = async (req, res, next) => {
    try {
        const { userEmail, userName, ip, device, loginTime } =
            req.signupDetails;
        // const location = await ipinfo(ip);
        const transporter = nodemailer.createTransport({
            host: `${process.env.SMTP_HOST}`,
            port: `${process.env.SMTP_PORT}`,
            secure: true,
            auth: {
                user: `${process.env.SMTP_USER_SIGNUP}`,
                pass: `${process.env.SMTP_PASS_SIGNUP}`,
            },
        });
        let message = {
            from: "Chef On Wheelz <notification@chefonwheelz.com>",
            to: userEmail,
            subject: "Welcome to Chef On Wheelz",
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to <span id="logo-text" style="color: #107569;">Chef on Wheelz</span>!</title>
            <style>
                body, h1, p {
                margin: 0;
                padding: 0;
                }
                .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                padding: 20px;
                text-align: center;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
                }
                .content {
                padding: 20px;
                background-color: #fff;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e0e0e0;
                }
                .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #1075691a;
                color: #107569;
                text-decoration: none;
                border: 2px solid #7ddacf;
                border-radius: 5px;
                margin-top: 20px;
                cursor: pointer;
                transition: background-color 0.3s ease-in-out;
                }
                .button:hover {
                background-color: #107569;
                color: #fff;
                }
                a {
                color: #107569;
                text-decoration: none;
                }

                a:hover {
                text-decoration: underline;
                }
                .logo {
                max-width: 100px;
                margin-bottom: 20px;
                }
                #logo-text {
                color: #107569;
                }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="header">
                <img src=${AppLogoS3} alt="Chef on Wheelz Logo" class="logo">
                <h1>Welcome to <span id="logo-text">Chef on Wheelz</span>!</h1>
                </div>
                <div class="content">
                <p>Dear ${userName},</p>
                <p>Welcome to Chef on Wheelz! We're thrilled to have you join our community of food enthusiasts.</p>
                <p>Your account has been successfully created, and you are now ready to explore all the delicious offerings available on our platform. Whether you're craving a gourmet meal, a healthy option, or a comforting classic, we have something for every taste bud.</p>
                <p>Here are a few things you can do to get started:</p>
                <ol>
                    <li>Book a chef: Hire a skilled chef who will arrive at your home and cook a delicious meal just for you.</li>
                    <li>Customize your preferences: Personalize your profile to receive recommendations tailored to your tastes.</li>
                </ol>
                <p>If you have any questions or need assistance, don't hesitate to reach out to our customer support team at <a href="mailto:support@chefonwheelz.com">support@chefonwheelz.com</a> or by replying to this email.</p>
                <p>Once again, welcome to Chef on Wheelz! We're excited to embark on this culinary journey with you.</p>
                <a href="https://chefonwheelz.com/" class="button">Start Exploring</a>
                <p>Best regards,<br>Team <span id="logo-text" style="color: #107569;">Chef on Wheelz</span>!</p>
                </div>
            </div>
            </body>
            </html>
            `,
        };
        let info = await transporter.sendMail(message);
        console.log("Signup email sent successfully.");
    } catch (error) {
        console.error("Error sending signup email:", error);
        res.status(500).json({
            success: false,
            message: "Error sending signup email",
        });
    }
};

module.exports.sendLoginEmail = async (req, res, next) => {
    try {
        const { userEmail, userName, ip, device, loginTime } = req.loginDetails;
        // const location = await ipinfo(ip);
        const transporter = nodemailer.createTransport({
            host: `${process.env.SMTP_HOST}`,
            port: `${process.env.SMTP_PORT}`,
            secure: true,
            auth: {
                user: `${process.env.SMTP_USER_LOGIN}`,
                pass: `${process.env.SMTP_PASS_LOGIN}`,
            },
        });
        let message = {
            from: "Chef On Wheelz <notification@chefonwheelz.com>",
            to: userEmail,
            subject: "Login detected",
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login Detected</title>
            <style>
                /* Reset styles to ensure consistency */
                body, h1, p {
                margin: 0;
                padding: 0;
                }

                /* Container styling */
                .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                /* Header styling */
                .header {
                padding: 20px;
                text-align: center;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
                }

                /* Content styling */
                .content {
                padding: 20px;
                background-color: #fff;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e0e0e0;
                }

                /* Button styling */
                .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #107569;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
                border: none;
                cursor: pointer;
                }

                .button:hover {
                background-color: #0a564a;
                }

                /* Link styling */
                a {
                color: #107569;
                text-decoration: none;
                }

                a:hover {
                text-decoration: underline;
                }

                /* Logo styling */
                .logo {
                max-width: 100px;
                margin-bottom: 20px;
                }

                /* Logo text styling */
                #logo-text {
                color: #107569;
                }

                /* Signature styling */
                .signature {
                margin-top: 20px;
                border-top: 1px solid #e0e0e0;
                padding-top: 20px;
                }

                /* Table styling */
                table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                }

                th, td {
                border: 1px solid #e0e0e0;
                padding: 8px;
                text-align: left;
                }

                th {
                background-color: #f2f2f2;
                }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="header">
                <img src=${AppLogoS3} alt="Chef on Wheelz Logo" class="logo">
                <h1>Welcome to <span id="logo-text">Chef on Wheelz</span>!</h1>
                </div>
                <div class="content">
                <p>Dear ${userName},</p>
                <p>We detected a login to your account from the following device:</p>
                <table>
                    <tr>
                    <th>Login Time</th>
                    <td>${loginTime}</td>
                    </tr>
                    <tr>
                    <th>Device</th>
                    <td>${device}</td>
                    </tr>
                </table>
                <p>If this login was not made by you, please change your password immediately and contact our support team.</p>
                <p>If you made this login, you can ignore this email.</p>
                <p>Thank you!</p>
                </div>
                <div class="signature">
                <p>Best regards,<br>Team <span id="logo-text">Chef on Wheelz</span>!</p>
                </div>
            </div>
            </body>
            </html>
            `,
        };
        let info = await transporter.sendMail(message);
        console.log("Login email sent successfully.");
    } catch (error) {
        console.error("Error sending login email:", error);
        res.status(500).json({
            success: false,
            message: "Error sending login email",
        });
    }
};

module.exports.sendPasswordResetEmail = async (req, res) => {
    try {
        const otp = generateOTP();
        const { name, email } = req.body;
        const transporter = nodemailer.createTransport({
            host: `${process.env.SMTP_HOST}`,
            port: `${process.env.SMTP_PORT}`,
            secure: true,
            auth: {
                user: `${process.env.SMTP_USER_OTP_VERIFICATION}`,
                pass: `${process.env.SMTP_PASS_OTP_VERIFICATION}`,
            },
        });

        // Send email with OTP
        let message = {
            from: "Chef On Wheelz <notification@chefonwheelz.com>",
            to: email,
            subject: "Password Reset requested",
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset</title>
              <style>
                /* Reset styles to ensure consistency */
                body, h1, p {
                  margin: 0;
                  padding: 0;
                }
            
                /* Container styling */
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                  background-color: #f9f9f9;
                  border-radius: 10px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
            
                /* Header styling */
                .header {
              padding: 20px;
              text-align: center;
              border-top-left-radius: 10px;
              border-top-right-radius: 10px;
            }
            
            
                /* Content styling */
                .content {
                  padding: 20px;
                  background-color: #fff;
                  border-radius: 10px;
                  border: 2px solid #7ddacf;
                  margin-top: 20px;
                }
            
                /* Button styling */
                .button {
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #1075691a;
                  color: #107569;
                  text-decoration: none;
                  border-radius: 5px;
                  border: 2px solid #7ddacf;
                  margin-top: 20px;
                  cursor: pointer;
                }
            
                .button:hover {
                  background-color: #0a564a;
                }
            
                /* Link styling */
                a {
                  color: #107569;
                  text-decoration: none;
                }
            
                a:hover {
                  text-decoration: underline;
                }
            
                /* Logo styling */
                .logo {
                  max-width: 100px;
                  margin-bottom: 20px;
                }
            
                /* Logo text styling */
                #logo-text {
                  color: #107569; /* Matching the company name color to the logo color */
              }
            
                /* Signature styling */
                .signature {
                  margin-top: 20px;
                  border-top: 1px solid #e0e0e0;
                  padding-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <img src=${AppLogoS3} alt="Chef on Wheelz Logo" class="logo">
                  <h1>Welcome to <span id="logo-text">Chef on Wheels</span>!</h1>
                </div>
                <div class="content">
                  <p>Dear ${name},</p>
                  <p>You have requested to reset your password. Please use the OTP to reset your password</p>
                  <p>Your One-Time Password (OTP) for password reset is: <strong>${otp}</strong></p>
                  <p>If you didn't request this, you can ignore this email.</p>
                  <p>Thank you!</p>
                </div>
                <div class="signature">
                  <p>Best regards,<br>Team <span id="logo-text" style="color: #107569;">Chef on Wheels</span>!</p>
                </div>
              </div>
            </body>
            </html>
            `,
        };
        await transporter.sendMail(message);

        const newOTP = await OTP.create({
            email: email,
            sentOtp: otp,
            generatedTime: req.otpGenerationTime,
        });

        res.status(200).json({
            success: true,
            message: "OTP sent successfully.",
            userName: name,
            userEmail: email,
            redirectRoute: "/api/users/resetuser",
        });
    } catch (error) {
        console.error("Error sending password reset OTP.", error);
        res.status(500).json({
            success: false,
            message: "Error sending password reset OTP",
            redirectRoute: "/api/users/login",
        });
    }
};

module.exports.bookingConfirmationEmail = async (req, res, next) => {
    try {
        const {
            userEmail,
            userName,
            chefName,
            chefEmail,
            bookingDate,
            date,
            time,
            adultCount,
            childCount,
            dietaryRestrictions,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
            venue,
            dishDetails,
        } = req.bookingDetails;

        const transporter = nodemailer.createTransport({
            host: `${process.env.SMTP_HOST}`,
            port: `${process.env.SMTP_PORT}`,
            secure: true,
            auth: {
                user: `${process.env.SMTP_USER_ORDER_CONFIRMATION}`,
                pass: `${process.env.SMTP_PASS_ORDER_CONFIRMATION}`,
            },
        });
        let message = {
            from: "Chef On Wheelz <notification@chefonwheelz.com>",
            to: userEmail,
            subject: "Booking Confirmation",
            html: `
            <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Booking Confirmed</title>
                <style>
                    /* Reset styles to ensure consistency */
                    body, h1, p {
                    margin: 0;
                    padding: 0;
                    }

                    /* Container styling */
                    .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }

                    /* Header styling */
                    .header {
                    padding: 20px;
                    text-align: center;
                    border-top-left-radius: 10px;
                    border-top-right-radius: 10px;
                    }

                    /* Content styling */
                    .content {
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 0 0 10px 10px;
                    border: 1px solid #e0e0e0;
                    }

                    /* Button styling */
                    .button {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #107569;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                    border: none;
                    cursor: pointer;
                    }

                    .button:hover {
                    background-color: #0a564a;
                    }

                    /* Link styling */
                    a {
                    color: #107569;
                    text-decoration: none;
                    }

                    a:hover {
                    text-decoration: underline;
                    }

                    /* Logo styling */
                    .logo {
                    max-width: 100px;
                    margin-bottom: 20px;
                    }

                    /* Logo text styling */
                    #logo-text {
                    color: #107569;
                    }

                    /* Signature styling */
                    .signature {
                    margin-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    padding-top: 20px;
                    }

                    /* Table styling */
                    table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    }

                    th, td {
                    border: 1px solid #e0e0e0;
                    padding: 8px;
                    text-align: left;
                    }

                    th {
                    background-color: #f2f2f2;
                    }
                </style>
                </head>
                <body>
                <div class="container">
                    <div class="header">
                    <img src=${AppLogoS3} alt="Chef on Wheelz Logo" class="logo">
                    <h1>Welcome to <span id="logo-text">Chef on Wheelz</span>!</h1>
                    </div>
                    <div class="content">
                    <p>Dear ${userName},</p>
                    <p>Your booking has been confirmed!</p>
                    <br>
                    <p>Booking Details:</p>
                    <table>
                        <tr>
                        <th>Date</th>
                        <td>${date}</td>
                        </tr>
                        <tr>
                        <th>Time</th>
                        <td>${time}</td>
                        </tr>
                        <tr>
                        <th>Location</th>
                        <td>${venue.addressLine}, ${venue.city}, ${
                venue.state
            }, ${venue.zipCode}</td>
                        </tr>
                        <tr>
                        <th>Chef</th>
                        <td>${chefName}</td>
                        </tr>
                        <tr>
                        <th>Dish</th>
                        <td>${getDishesNameList(dishDetails)}</td>
                        </tr>
                        <tr>
                        <th>Number of Adults</th>
                        <td>${adultCount}</td>
                        </tr>
                        <tr>
                        <th>Number of Kids</th>
                        <td>${childCount}</td>
                        </tr>
                        <tr>
                        <th>Dietary Instructions</th>
                        <td>${getAdditionalInfo(dietaryRestrictions)}</td>
                        </tr>
                        <tr>
                        <th>Chef Charges</th>
                        <td>+ ${subTotal} $</td>
                        </tr>
                        <tr>
                        <th>Platform Charges</th>
                        <td>+ ${platformFee} $</td>
                        </tr>
                        <tr>
                        <th>Promotional Discount</th>
                        <td>- ${promoDiscount} $</td>
                        </tr>
                        <tr>
                        <th>Total Charges</th>
                        <td>${totalFee} $</td>
                        </tr>
                    </table>
                    <p>Enjoy your meal experience with Chef on Wheelz!</p>
                    </div>
                    <div class="signature">
                    <p>Best regards,<br>Team <span id="logo-text">Chef on Wheelz</span>!</p>
                    </div>
                </div>
                </body>
                </html>
            `,
        };
        let info = await transporter.sendMail(message);
        console.log("booking confirmation email sent successfully.");
        next();
    } catch (error) {
        console.error("Error sending booking confirmation email:", error);
        res.status(500).json({
            success: false,
            message: "Error sending booking confirmation email",
        });
    }
};

module.exports.bookingConfirmationEmailToChef = async (req, res, next) => {
    try {
        const {
            userEmail,
            userName,
            chefName,
            chefEmail,
            bookingDate,
            date,
            time,
            adultCount,
            childCount,
            dietaryRestrictions,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
            venue,
            dishDetails,
        } = req.bookingDetails;

        if (notAllowedEmails.includes(chefEmail)) {
            next();
        } else {
            const transporter = nodemailer.createTransport({
                host: `${process.env.SMTP_HOST}`,
                port: `${process.env.SMTP_PORT}`,
                secure: true,
                auth: {
                    user: `${process.env.SMTP_USER_ORDER_CONFIRMATION}`,
                    pass: `${process.env.SMTP_PASS_ORDER_CONFIRMATION}`,
                },
            });
            let message = {
                from: "Chef On Wheelz <notification@chefonwheelz.com>",
                to: chefEmail,
                subject: "New Booking Alert",
                html: `
                <!DOCTYPE html>
                    <html lang="en">
                    <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Booking Confirmed</title>
                    <style>
                        /* Reset styles to ensure consistency */
                        body, h1, p {
                        margin: 0;
                        padding: 0;
                        }
    
                        /* Container styling */
                        .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        font-family: Arial, sans-serif;
                        background-color: #f9f9f9;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
    
                        /* Header styling */
                        .header {
                        padding: 20px;
                        text-align: center;
                        border-top-left-radius: 10px;
                        border-top-right-radius: 10px;
                        }
    
                        /* Content styling */
                        .content {
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 0 0 10px 10px;
                        border: 1px solid #e0e0e0;
                        }
    
                        /* Button styling */
                        .button {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #107569;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                        border: none;
                        cursor: pointer;
                        }
    
                        .button:hover {
                        background-color: #0a564a;
                        }
    
                        /* Link styling */
                        a {
                        color: #107569;
                        text-decoration: none;
                        }
    
                        a:hover {
                        text-decoration: underline;
                        }
    
                        /* Logo styling */
                        .logo {
                        max-width: 100px;
                        margin-bottom: 20px;
                        }
    
                        /* Logo text styling */
                        #logo-text {
                        color: #107569;
                        }
    
                        /* Signature styling */
                        .signature {
                        margin-top: 20px;
                        border-top: 1px solid #e0e0e0;
                        padding-top: 20px;
                        }
    
                        /* Table styling */
                        table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        }
    
                        th, td {
                        border: 1px solid #e0e0e0;
                        padding: 8px;
                        text-align: left;
                        }
    
                        th {
                        background-color: #f2f2f2;
                        }
                    </style>
                    </head>
                    <body>
                    <div class="container">
                        <div class="header">
                        <img src=${AppLogoS3} alt="Chef on Wheelz Logo" class="logo">
                        <h1>Welcome to <span id="logo-text">Chef on Wheelz</span>!</h1>
                        </div>
                        <div class="content">
                        <p>Dear ${chefName},</p>
                        <p>You have a new upcoming booking.</p>
                        <br>
                        <p>Booking Details:</p>
                        <table>
                            <tr>
                            <th>Date</th>
                            <td>${date}</td>
                            </tr>
                            <tr>
                            <th>Time</th>
                            <td>${time}</td>
                            </tr>
                            <tr>
                            <th>Location</th>
                            <td>${venue.addressLine}, ${venue.city}, ${
                    venue.state
                }, ${venue.zipCode}</td>
                            </tr>
                            <tr>
                            <th>Chef</th>
                            <td>${chefName}</td>
                            </tr>
                            <tr>
                            <th>Dish</th>
                            <td>${getDishesNameList(dishDetails)}</td>
                            </tr>
                            <tr>
                            <th>Number of Adults</th>
                            <td>${adultCount}</td>
                            </tr>
                            <tr>
                            <th>Number of Kids</th>
                            <td>${childCount}</td>
                            </tr>
                            <tr>
                            <th>Dietary Instructions</th>
                            <td>${getAdditionalInfo(dietaryRestrictions)}</td>
                            </tr>
                            <tr>
                            <th>Chef Charges</th>
                            <td>+ ${subTotal} $</td>
                            </tr>
                            <tr>
                            <th>Platform Charges</th>
                            <td>+ ${platformFee} $</td>
                            </tr>
                            <tr>
                            <th>Promotional Discount</th>
                            <td>- ${promoDiscount} $</td>
                            </tr>
                            <tr>
                            <th>Total Charges</th>
                            <td>${totalFee} $</td>
                            </tr>
                        </table>
                        <p>Enjoy your meal experience with Chef on Wheelz!</p>
                        </div>
                        <div class="signature">
                        <p>Best regards,<br>Team <span id="logo-text">Chef on Wheelz</span>!</p>
                        </div>
                    </div>
                    </body>
                    </html>
                `,
            };
            let info = await transporter.sendMail(message);
            console.log(
                "booking confirmation email to Chef sent successfully."
            );
            next();
        }
    } catch (error) {
        console.error(
            "Error sending booking confirmation email to Chef:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Error sending booking confirmation email to Chef",
        });
    }
};

module.exports.sendChefOnboardLoginEmail = async (req, res, next) => {
    try {
        const { chefName, chefEmail, chefPassword } =
            req.chefOnboardLoginDetails;
        const transporter = nodemailer.createTransport({
            host: `${process.env.SMTP_HOST}`,
            port: `${process.env.SMTP_PORT}`,
            secure: true,
            auth: {
                user: `${process.env.SMTP_USER_LOGIN}`,
                pass: `${process.env.SMTP_PASS_LOGIN}`,
            },
        });
        let message = {
            from: "Chef On Wheelz <notification@chefonwheelz.com>",
            to: chefEmail,
            subject: "Chef onboarding",
            html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login Detected</title>
          <style>
              /* Reset styles to ensure consistency */
              body, h1, p {
              margin: 0;
              padding: 0;
              }

              /* Container styling */
              .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              font-family: Arial, sans-serif;
              background-color: #f9f9f9;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }

              /* Header styling */
              .header {
              padding: 20px;
              text-align: center;
              border-top-left-radius: 10px;
              border-top-right-radius: 10px;
              }

              /* Content styling */
              .content {
              padding: 20px;
              background-color: #fff;
              border-radius: 0 0 10px 10px;
              border: 1px solid #e0e0e0;
              }

              /* Button styling */
              .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #107569;
              color: #fff;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
              border: none;
              cursor: pointer;
              }

              .button:hover {
              background-color: #0a564a;
              }

              /* Link styling */
              a {
              color: #107569;
              text-decoration: none;
              }

              a:hover {
              text-decoration: underline;
              }

              /* Logo styling */
              .logo {
              max-width: 100px;
              margin-bottom: 20px;
              }

              /* Logo text styling */
              #logo-text {
              color: #107569;
              }

              /* Signature styling */
              .signature {
              margin-top: 20px;
              border-top: 1px solid #e0e0e0;
              padding-top: 20px;
              }

              /* Table styling */
              table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              }

              th, td {
              border: 1px solid #e0e0e0;
              padding: 8px;
              text-align: left;
              }

              th {
              background-color: #f2f2f2;
              }
          </style>
          </head>
          <body>
          <div class="container">
              <div class="header">
              <img src=${AppLogoS3} alt="Chef on Wheelz Logo" class="logo">
              <h1>Welcome to <span id="logo-text">Chef on Wheelz</span>!</h1>
              </div>
              <div class="content">
              <p>Dear ${chefName},</p>
              <p>We are thrilled to have you onboarded to our platform.</p>
              <p>You can use your email id <strong>${chefEmail}</strong> and password <strong>${chefPassword}</strong> to login and check see your upcoming bookings.</p>
              <p style="font-weight: bold;">
                Please visit and login by clicking on <a href="https://www.chefonwheelz.com/chef/sessions" style="font-weight: bold;">Chef on Wheelz</a> to check your upcoming bookings.</p>
              <p>Thank you!</p>
              </div>
              <div class="signature">
              <p>Best regards,<br>Team <span id="logo-text">Chef on Wheelz</span>!</p>
              </div>
          </div>
          </body>
          </html>
          `,
        };
        let info = await transporter.sendMail(message);
        console.log("Chef-Onboarding login email sent successfully.");
    } catch (error) {
        console.error("Error sending Chef-Onboarding login email:", error);
        res.status(500).json({
            success: false,
            message: "Error sending Chef-Onboarding login email",
        });
    }
};

module.exports.sendChefLoginEmail = async (req, res, next) => {
    const { chefEmail, chefName, ip, device, loginTime, isChefActive } =
        req.chefLoginDetails;
    if (isChefActive) {
        try {
            const transporter = nodemailer.createTransport({
                host: `${process.env.SMTP_HOST}`,
                port: `${process.env.SMTP_PORT}`,
                secure: true,
                auth: {
                    user: `${process.env.SMTP_USER_LOGIN}`,
                    pass: `${process.env.SMTP_PASS_LOGIN}`,
                },
            });
            let message = {
                from: "Chef On Wheelz <notification@chefonwheelz.com>",
                to: chefEmail,
                subject: "Login detected",
                html: `
              <!DOCTYPE html>
              <html lang="en">
              <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Login Detected</title>
              <style>
                  /* Reset styles to ensure consistency */
                  body, h1, p {
                  margin: 0;
                  padding: 0;
                  }
    
                  /* Container styling */
                  .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                  background-color: #f9f9f9;
                  border-radius: 10px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  }
    
                  /* Header styling */
                  .header {
                  padding: 20px;
                  text-align: center;
                  border-top-left-radius: 10px;
                  border-top-right-radius: 10px;
                  }
    
                  /* Content styling */
                  .content {
                  padding: 20px;
                  background-color: #fff;
                  border-radius: 0 0 10px 10px;
                  border: 1px solid #e0e0e0;
                  }
    
                  /* Button styling */
                  .button {
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #107569;
                  color: #fff;
                  text-decoration: none;
                  border-radius: 5px;
                  margin-top: 20px;
                  border: none;
                  cursor: pointer;
                  }
    
                  .button:hover {
                  background-color: #0a564a;
                  }
    
                  /* Link styling */
                  a {
                  color: #107569;
                  text-decoration: none;
                  }
    
                  a:hover {
                  text-decoration: underline;
                  }
    
                  /* Logo styling */
                  .logo {
                  max-width: 100px;
                  margin-bottom: 20px;
                  }
    
                  /* Logo text styling */
                  #logo-text {
                  color: #107569;
                  }
    
                  /* Signature styling */
                  .signature {
                  margin-top: 20px;
                  border-top: 1px solid #e0e0e0;
                  padding-top: 20px;
                  }
    
                  /* Table styling */
                  table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                  }
    
                  th, td {
                  border: 1px solid #e0e0e0;
                  padding: 8px;
                  text-align: left;
                  }
    
                  th {
                  background-color: #f2f2f2;
                  }
              </style>
              </head>
              <body>
              <div class="container">
                  <div class="header">
                  <img src=${AppLogoS3} alt="Chef on Wheelz Logo" class="logo">
                  <h1>Welcome to <span id="logo-text">Chef on Wheelz</span>!</h1>
                  </div>
                  <div class="content">
                  <p>Dear ${chefName},</p>
                  <p>We detected a login to your account from the following device:</p>
                  <table>
                      <tr>
                      <th>Login Time</th>
                      <td>${loginTime}</td>
                      </tr>
                      <tr>
                      <th>Device</th>
                      <td>${device}</td>
                      </tr>
                  </table>
                  <p>If this login was not made by you, please change your password immediately and contact our support team.</p>
                  <p>If you made this login, you can ignore this email.</p>
                  <p>Thank you!</p>
                  </div>
                  <div class="signature">
                  <p>Best regards,<br>Team <span id="logo-text">Chef on Wheelz</span>!</p>
                  </div>
              </div>
              </body>
              </html>
              `,
            };
            let info = await transporter.sendMail(message);
            console.log("Chef-Login email sent successfully.");
        } catch (error) {
            console.error("Error sending Chef-Login email:", error);
            res.status(500).json({
                success: false,
                message: "Error sending Chef-Login email",
            });
        }
    } else {
        console.log("Chef Password reset requested");
    }
};

module.exports.sendSessionStartedEmail = async (req, res, next) => {
    try {
        const {
            userEmail,
            userName,
            chefName,
            chefEmail,
            bookingDate,
            date,
            time,
            adultCount,
            childCount,
            dietaryRestrictions,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
            venue,
            dishNames,
        } = req.bookingDetails;

        // let bookingDateTime = new Date(bookingDate);
        // // let date = bookingDateTime.toLocaleDateString();
        // // let time = bookingDateTime.toLocaleTimeString();
        // let date = bookingDateTime.toISOString().split("T")[0];
        // let time = bookingDateTime.toISOString().split("T")[1].slice(0, 8);

        const transporter = nodemailer.createTransport({
            host: `${process.env.SMTP_HOST}`,
            port: `${process.env.SMTP_PORT}`,
            secure: true,
            auth: {
                user: `${process.env.SMTP_USER_ORDER_CONFIRMATION}`,
                pass: `${process.env.SMTP_PASS_ORDER_CONFIRMATION}`,
            },
        });
        let message = {
            from: "Chef On Wheelz <notification@chefonwheelz.com>",
            to: userEmail,
            subject: "Your booked session from Chef-On-Wheelz has commenced.",
            html: `
            <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Session Started</title>
                <style>
                    /* Reset styles to ensure consistency */
                    body, h1, p {
                    margin: 0;
                    padding: 0;
                    }

                    /* Container styling */
                    .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }

                    /* Header styling */
                    .header {
                    padding: 20px;
                    text-align: center;
                    border-top-left-radius: 10px;
                    border-top-right-radius: 10px;
                    }

                    /* Content styling */
                    .content {
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 0 0 10px 10px;
                    border: 1px solid #e0e0e0;
                    }

                    /* Button styling */
                    .button {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #107569;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                    border: none;
                    cursor: pointer;
                    }

                    .button:hover {
                    background-color: #0a564a;
                    }

                    /* Link styling */
                    a {
                    color: #107569;
                    text-decoration: none;
                    }

                    a:hover {
                    text-decoration: underline;
                    }

                    /* Logo styling */
                    .logo {
                    max-width: 100px;
                    margin-bottom: 20px;
                    }

                    /* Logo text styling */
                    #logo-text {
                    color: #107569;
                    }

                    /* Signature styling */
                    .signature {
                    margin-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    padding-top: 20px;
                    }

                    /* Table styling */
                    table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    }

                    th, td {
                    border: 1px solid #e0e0e0;
                    padding: 8px;
                    text-align: left;
                    }

                    th {
                    background-color: #f2f2f2;
                    }
                </style>
                </head>
                <body>
                <div class="container">
                    <div class="header">
                    <img src=${AppLogoS3} alt="Chef on Wheelz Logo" class="logo">
                    <h1>Welcome to <span id="logo-text">Chef on Wheelz</span>!</h1>
                    </div>
                    <div class="content">
                    <p>Dear ${userName},</p>
                    <br>
                    <p>This email is to notify you that your booked session at Chef-On-Wheelz from ${chefName} has started.</p>
                    <br>
                    <p><strong>Booking Details</strong></p>
                    <table>
                        <tr>
                        <th>Chef</th>
                        <td>${chefName}</td>
                        </tr>
                        <tr>
                        <th>Date</th>
                        <td>${date}</td>
                        </tr>
                        <tr>
                        <th>Time</th>
                        <td>${time}</td>
                        </tr>
                        <tr>
                        <th>Location</th>
                        <td>${venue.addressLine}, ${venue.city}, ${
                venue.state
            }, ${venue.zipCode}</td>
                        </tr>
                        <tr>
                        <th>Dish</th>
                        <td>${getDishesNameList(dishNames)}</td>
                        </tr>
                        <tr>
                        <th>Number of Adults</th>
                        <td>${adultCount}</td>
                        </tr>
                        <tr>
                        <th>Number of Kids</th>
                        <td>${childCount}</td>
                        </tr>
                        <tr>
                        <th>Dietary Instructions</th>
                        <td>${getAdditionalInfo(dietaryRestrictions)}</td>
                        </tr>
                        <tr>
                        <th>Chef Charges</th>
                        <td>+ ${subTotal} $</td>
                        </tr>
                        <tr>
                        <th>Platform Charges</th>
                        <td>+ ${platformFee} $</td>
                        </tr>
                        <tr>
                        <th>Promotional Discount</th>
                        <td>- ${promoDiscount} $</td>
                        </tr>
                        <tr>
                        <th>Total Charges</th>
                        <td>${totalFee} $</td>
                        </tr>
                    </table>
                    <p>Enjoy your meal experience with Chef on Wheelz!</p>
                    </div>
                    <div class="signature">
                    <p>Best regards,<br>Team <span id="logo-text">Chef on Wheelz</span>!</p>
                    </div>
                </div>
                </body>
                </html>
            `,
        };
        let info = await transporter.sendMail(message);
        console.log("session start notification email sent successfully.");
    } catch (error) {
        console.error(
            "Error sending booking session start notification email:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Error sending session start notification email",
        });
    }
};

module.exports.sendReceiptPDF = async (req, res, next) => {
    try {
        let newInvoiceId = 0;
        let invoice = await Invoice.findOne({}).exec();
        if (!invoice) {
            invoice = new Invoice({ invoiceID: 1000 });
        } else {
            invoice.invoiceID++;
        }
        newInvoiceId = invoice.invoiceID;
        await invoice.save();
        const {
            userEmail,
            userName,
            chefName,
            chefEmail,
            bookingDate,
            date,
            time,
            adultCount,
            childCount,
            dietaryRestrictions,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
            venue,
            dishNames,
        } = req.bookingDetails;
        const pdfHTML = pdfHTMLGenerator({
            userName,
            userEmail,
            chefName,
            bookingDate,
            date,
            time,
            adultCount,
            childCount,
            dietaryRestrictions,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
            venue,
            dishNames,
            invoiceID: newInvoiceId,
        });

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(pdfHTML);
        const pdfBuffer = await page.pdf();
        await browser.close();

        const transporter = nodemailer.createTransport({
            host: `${process.env.SMTP_HOST}`,
            port: `${process.env.SMTP_PORT}`,
            secure: true,
            auth: {
                user: `${process.env.SMTP_USER_ORDER_CONFIRMATION}`,
                pass: `${process.env.SMTP_PASS_ORDER_CONFIRMATION}`,
            },
        });

        // Email message
        const message = {
            from: "Chef On Wheelz <notification@chefonwheelz.com>",
            to: userEmail,
            subject: "Booking Receipt PDF",
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmation</title>
            <style>
                /* Center-align text */
                body {
                    text-align: center;
                }
            </style>
            </head>
            <body>
            <p>Dear ${userName},</p>
            <br>
            <p>We hope you enjoyed your meal from ${chefName}.</p>
            <br>
            <p>Please find your booking invoice attached below.</p>
            </body>
            </html>`,
            attachments: [
                { filename: "booking_invoice.pdf", content: pdfBuffer },
            ],
        };
        const info = await transporter.sendMail(message);
        console.log(
            "Booking invoice email with PDF attachment sent successfully."
        );
    } catch (error) {
        console.error("Error sending booking confirmation email:", error);
        res.status(500).json({
            success: false,
            message: "Error sending PDF",
        });
    }
};

module.exports.sendUpcomingSessionReminderEmail = async (req, res, next) => {
    try {
        const {
            userEmail,
            userName,
            chefName,
            chefEmail,
            bookingDate,
            date,
            time,
            adultCount,
            childCount,
            dietaryRestrictions,
            subTotal,
            platformFee,
            totalFee,
            venue,
            dishDetails,
        } = req.bookingDetails;

        if (notAllowedEmails.includes(chefEmail)) {
            next();
        } else {
            let bookingDateTime = new Date(bookingDate);

            const transporter = nodemailer.createTransport({
                host: `${process.env.SMTP_HOST}`,
                port: `${process.env.SMTP_PORT}`,
                secure: true,
                auth: {
                    user: `${process.env.SMTP_USER_ORDER_CONFIRMATION}`,
                    pass: `${process.env.SMTP_PASS_ORDER_CONFIRMATION}`,
                },
            });

            const message = {
                from: "Chef On Wheelz <notification@chefonwheelz.com>",
                to: chefEmail,
                subject: "Reminder for your upcoming session",
                html: `<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reminder for upcoming session</title>
            <style>
                /* Reset styles to ensure consistency */
                body, h1, p {
                margin: 0;
                padding: 0;
                }

                /* Container styling */
                .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                /* Header styling */
                .header {
                padding: 20px;
                text-align: center;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
                }

                /* Content styling */
                .content {
                padding: 20px;
                background-color: #fff;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e0e0e0;
                }

                /* Button styling */
                .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #107569;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
                border: none;
                cursor: pointer;
                }

                .button:hover {
                background-color: #0a564a;
                }

                /* Link styling */
                a {
                color: #107569;
                text-decoration: none;
                }

                a:hover {
                text-decoration: underline;
                }

                /* Logo styling */
                .logo {
                max-width: 100px;
                margin-bottom: 20px;
                }

                /* Logo text styling */
                #logo-text {
                color: #107569;
                }

                /* Signature styling */
                .signature {
                margin-top: 20px;
                border-top: 1px solid #e0e0e0;
                padding-top: 20px;
                }

                /* Table styling */
                table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                }

                th, td {
                border: 1px solid #e0e0e0;
                padding: 8px;
                text-align: left;
                }

                th {
                background-color: #f2f2f2;
                }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="header">
                <img src=${AppLogoS3} alt="Chef on Wheelz Logo" class="logo">
                <h1><span id="logo-text">Chef on Wheelz</span>!</h1>
                </div>
                <div class="content">
                <p>Dear ${chefName},</p>
                <br>
                <p>This email is to notify you that you have an upcoming session at Chef-On-Wheelz for ${userName}.</p>
                <br>
                <p><strong>Booking Details</strong></p>
                <table>
                    <tr>
                    <th>User</th>
                    <td>${userName}</td>
                    </tr>
                    <tr>
                    <th>Date</th>
                    <td>${date}</td>
                    </tr>
                    <tr>
                    <th>Time</th>
                    <td>${time}</td>
                    </tr>
                    <tr>
                    <th>Location</th>
                    <td>${venue.addressLine}, ${venue.city}, ${venue.state}, ${
                    venue.zipCode
                }</td>
                    </tr>
                    <tr>
                    <th>Dish</th>
                    <td>${getDishesNameList(dishDetails)}</td>
                    </tr>
                    <tr>
                    <th>Number of Adults</th>
                    <td>${adultCount}</td>
                    </tr>
                    <tr>
                    <th>Number of Kids</th>
                    <td>${childCount}</td>
                    </tr>
                    <tr>
                    <th>Dietary Instructions</th>
                    <td>${getAdditionalInfo(dietaryRestrictions)}</td>
                    </tr>
                    <tr>
                    <th>Chef Charges</th>
                    <td>${subTotal} $</td>
                    </tr>
                    <tr>
                    <th>Platform Charges</th>
                    <td>${platformFee} $</td>
                    </tr>
                    <tr>
                    <th>Total Charges</th>
                    <td>${totalFee} $</td>
                    </tr>
                </table>
                <p>Enjoy your meal experience with Chef on Wheelz!</p>
                </div>
                <div class="signature">
                <p>Best regards,<br>Team <span id="logo-text">Chef on Wheelz</span>!</p>
                </div>
            </div>
            </body>
            </html>`,
            };
            const twoHoursBeforeStartTime = new Date(
                new Date(bookingDateTime).getTime() - 2 * 60 * 60 * 1000
            );
            const currentDateTime = new Date();
            if (currentDateTime >= twoHoursBeforeStartTime) {
                await transporter.sendMail(message);
            } else {
                schedule.scheduleJob(
                    twoHoursBeforeStartTime,
                    async function () {
                        await transporter.sendMail(message);
                    }
                );
            }
            console.log("Upcoming session reminder email sent successfully.");
        }
    } catch (error) {
        console.error("Error sending upcoming session reminder email:", error);
        res.status(500).json({
            success: false,
            message: "Error sending upcoming session reminder email",
        });
    }
};
