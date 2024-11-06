const config = require('../config/config');
const nodemailer = require('nodemailer')
const ejs = require('ejs');
const path = require('path');
// const AWS_SES = require('../utils/ses.Email');

// const sendVerificationEmail = async (email, verificationToken) => {
//   // Construct the email params
// const verificationLink = `http://3.89.83.27/nodeApi/api/verifyEmail?token=${verificationToken}&email=${email}`; // Replace with your actual verification link

// const emailTemplate = `
//   <!DOCTYPE html>
//   <html lang="en">
//   <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Email Verification</title>
//   </head>
//   <body>
//     <p>Hello,</p>
//     <p>Thank you for signing up! Please click the following link to verify your email address:</p>
//     <a href="${verificationLink}" target="_blank">Verify Your Email</a>
//     <p>If you did not create an account, please ignore this email.</p>
//     <p>Best regards,<br>Your Company Name</p>
//   </body>
//   </html>
// `;

//   const params = {
//     Destination: {
//       ToAddresses: [email],
//     },
//     Message: {
//       Body: {
//         Html: {
//           Data: emailTemplate,
//         },
//       },
//       Subject: {
//         Data: "Subject of the Email",
//       },
//     },
//     Source: config.smtp.EMAIL_USER, // Sender's email address (verified in SES)
//   };

//   try {
//     const email = await AWS_SES.sendEmail(params).promise()
//     console.log(`Verification email sent to ${email}`);
//   } catch (error) {
//     console.error(`Error sending verification email: ${error}`);
//   }
// };

const sendVerificationEmail = async (email, verificationToken,userId,roleId) => {
  // const verificationLink = `http://3.89.83.27/nodeApi/api/verifyEmail?token=${verificationToken}&email=${email}`;
  if(roleId==2){
    var verificationLink = `${config.BASEURL}artist/emailVerification?userId=${userId}&token=${verificationToken}`;
  }else{
    var verificationLink = `${config.BASEURL}emailVerification?userId=${userId}&token=${verificationToken}`;
  }
  // Render the EJS template
  const filePath = path.join(__dirname, '..', 'view', 'verificationTemplate.ejs')
  const emailTemplate = await ejs.renderFile(
    filePath, // Go back one step, then find 'view'
    { verificationLink, logoImage:config.BASEURL+'assets/imgs/logo.png',footerImage:config.BASEURL+'apple-touch-icon.png' } // Adjust the path to your CSS file
  );
  
  const subjectData = 'Email Verification'; // Add your subject here

  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: config.SENDER_EMAIL,
        pass: config.SENDER_PASSWORD
      }
    });

    const mailOptions = {
      from: config.SENDER_EMAIL,
      to: email,
      subject: subjectData,
      html: emailTemplate, // Set the HTML content
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};


module.exports = sendVerificationEmail;