import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

export const sendOTPEmail = async (email, otp, type = "EMAIL_VERIFICATION") => {
  // Determine subject based on OTP type
  let subject = "OTP Code";
  let purpose = "verification";

  switch (type) {
    case "EMAIL_VERIFICATION":
      subject = "Verify Your Email - OTP Code";
      purpose = "email verification";
      break;
    case "PHONE_VERIFICATION":
      subject = "Verify Your Phone - OTP Code";
      purpose = "phone verification";
      break;
    case "PASSWORD_RESET":
      subject = "Password Reset - OTP Code";
      purpose = "password reset";
      break;
    case "TRANSACTION_PIN":
      subject = "Transaction PIN Reset - OTP Code";
      purpose = "PIN reset";
      break;
    default:
      subject = "OTP Verification Code";
      purpose = "verification";
  }

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Your OTP Code for ${purpose}</h2>
      <p>Hello,</p>
      <p>Your OTP code is:</p>
      <h1 style="background-color: #f4f4f4; padding: 20px; text-align: center; letter-spacing: 5px; color: #333;">
        ${otp}
      </h1>
      <p>This code will expire in ${
        process.env.OTP_EXPIRY_MINUTES || 10
      } minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #999; font-size: 12px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

export const sendWelcomeEmail = async (email, firstName) => {
  const subject = `Welcome to ${process.env.APP_NAME || "Wallet App"}!`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome, ${firstName}!</h2>
      <p>Thank you for signing up with ${
        process.env.APP_NAME || "Wallet App"
      }.</p>
      <p>Your account has been successfully created. You can now:</p>
      <ul>
        <li>Fund your wallet via bank transfer or card</li>
        <li>Send money to other wallet users</li>
        <li>Withdraw to your bank account</li>
        <li>Complete KYC to increase transaction limits</li>
      </ul>
      <p>Get started by logging in to your account!</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #999; font-size: 12px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

export const sendTransactionEmail = async (email, transaction) => {
  const subject = `Transaction ${transaction.status}: ${transaction.reference}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Transaction Notification</h2>
      <p>Your transaction has been ${transaction.status.toLowerCase()}.</p>
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <p><strong>Reference:</strong> ${transaction.reference}</p>
        <p><strong>Amount:</strong> ₦${parseFloat(
          transaction.amount
        ).toLocaleString()}</p>
        <p><strong>Type:</strong> ${transaction.category.replace("_", " ")}</p>
        <p><strong>Status:</strong> ${transaction.status}</p>
        <p><strong>Date:</strong> ${new Date(
          transaction.createdAt
        ).toLocaleString()}</p>
      </div>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #999; font-size: 12px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

export default {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendTransactionEmail,
};
