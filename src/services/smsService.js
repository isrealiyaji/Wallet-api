import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

export const sendSMS = async (toPhoneNumber, message) => {
  try {
    if (!accountSid || !authToken || !fromPhoneNumber) {
      console.error("Missing Twilio credentials:", {
        accountSid: accountSid ? "✓" : "✗ MISSING",
        authToken: authToken ? "✓" : "✗ MISSING",
        fromPhoneNumber: fromPhoneNumber ? "✓" : "✗ MISSING",
      });
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] SMS to ${toPhoneNumber}: ${message}`);
      }
      return { success: true, message: "SMS logged in development mode" };
    }

    console.log(`Sending SMS from ${fromPhoneNumber} to ${toPhoneNumber}`);
    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to: toPhoneNumber,
    });

    console.log(`✓ SMS sent successfully. SID: ${result.sid}`);
    return { success: true, messageSid: result.sid };
  } catch (error) {
    console.error("❌ SMS sending failed:", error.message);
    console.error("Error details:", error);
    return { success: false, error: error.message };
  }
};

export const sendOTPSMS = async (phone, otp) => {
  const message = `Your OTP verification code is: ${otp}. This code will expire in ${
    process.env.OTP_EXPIRY_MINUTES || 10
  } minutes. Do not share this code with anyone.`;

  return await sendSMS(phone, message);
};

export default {
  sendSMS,
  sendOTPSMS,
};
