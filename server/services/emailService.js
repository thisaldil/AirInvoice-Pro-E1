const nodemailer = require("nodemailer");

const isProduction = process.env.NODE_ENV === "production";

const getSenderEmail = () =>
  process.env.SENDER_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;

const createTransportOptions = () => {
  const options = [];

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    options.push({
      name: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      transport: {
        host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    options.push({
      name: "gmail",
      transport: {
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
    });
  }

  return options;
};

const isUnauthorizedIpError = (error) =>
  error?.responseCode === 525 ||
  error?.response?.toLowerCase().includes("unauthorized ip address");

const logOtpFallback = (toEmail, otp, reason) => {
  console.warn(`[email] OTP email not sent: ${reason}`);
  console.warn(`[email] Development OTP for ${toEmail}: ${otp}`);
};

const buildOtpMail = (toEmail, otp) => ({
  from: `"AirInvoice Pro" <${getSenderEmail()}>`,
  to: toEmail,
  subject: "Verify your AirInvoice Pro account",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Verify your email</h2>
      <p>Use the code below to verify your account. This code expires in 10 minutes.</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px;">
        ${otp}
      </div>
      <p>If you didn't request this, you can ignore this email.</p>
    </div>
  `,
});

const sendOtpEmail = async (toEmail, otp) => {
  if (process.env.EMAIL_DELIVERY_DISABLED === "true") {
    logOtpFallback(toEmail, otp, "Email delivery is disabled");
    return { skipped: true };
  }

  const transportOptions = createTransportOptions();
  const senderEmail = getSenderEmail();

  if (!transportOptions.length || !senderEmail) {
    if (!isProduction) {
      logOtpFallback(toEmail, otp, "Email credentials are missing");
      return { skipped: true };
    }

    throw new Error("Email credentials are missing");
  }

  let lastError;

  for (const option of transportOptions) {
    try {
      const transporter = nodemailer.createTransport(option.transport);
      await transporter.sendMail(buildOtpMail(toEmail, otp));
      return { skipped: false, provider: option.name };
    } catch (error) {
      lastError = error;

      if (isUnauthorizedIpError(error)) {
        console.warn(`[email] ${option.name} blocked this server IP. Trying next email provider.`);
        continue;
      }

      console.warn(`[email] ${option.name} failed: ${error.message}`);
    }
  }

  if (!isProduction) {
    const reason = isUnauthorizedIpError(lastError)
      ? "All configured SMTP providers blocked this IP address"
      : lastError?.message || "All configured email providers failed";
    logOtpFallback(toEmail, otp, reason);
    return { skipped: true };
  }

  if (isUnauthorizedIpError(lastError)) {
    lastError.message =
      "Email provider blocked this server IP. Add this server IP to your SMTP authorized IP list or configure EMAIL_USER/EMAIL_PASS Gmail fallback.";
  }

  throw lastError;
};

module.exports = { sendOtpEmail };
