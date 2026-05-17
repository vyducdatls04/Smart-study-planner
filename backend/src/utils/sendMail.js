import nodemailer from "nodemailer";

const getFromAddress = () => {
  return process.env.EMAIL_FROM || `Smart Study <${process.env.EMAIL_USER}>`;
};

const sendWithResend = async ({ to, subject, html, text }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email error ${response.status}: ${errorText}`);
  }
};

const createSmtpTransporter = () => {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 465);
  const secure = process.env.EMAIL_SECURE
    ? process.env.EMAIL_SECURE === "true"
    : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
};

const sendWithSmtp = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Thiếu EMAIL_USER hoặc EMAIL_PASS trong môi trường máy chủ");
  }

  const transporter = createSmtpTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    text,
  });
};

export const sendMail = async (mailOptions) => {
  if (process.env.RESEND_API_KEY) {
    return sendWithResend(mailOptions);
  }

  return sendWithSmtp(mailOptions);
};
