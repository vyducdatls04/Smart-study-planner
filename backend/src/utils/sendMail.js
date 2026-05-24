import nodemailer from "nodemailer";

const cleanEnv = (value) => {
  if (!value) return "";
  const cleaned = String(value).trim();
  const first = cleaned[0];
  const last = cleaned[cleaned.length - 1];

  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return cleaned.slice(1, -1).trim();
  }

  return cleaned;
};

const getFromAddress = () => {
  const emailFrom = cleanEnv(process.env.EMAIL_FROM);
  if (emailFrom) return emailFrom;

  const emailUser = cleanEnv(process.env.EMAIL_USER);
  return `Smart Study <${emailUser}>`;
};

const hasValidResendKey = () => {
  const key = cleanEnv(process.env.RESEND_API_KEY);
  return key.startsWith("re_") && key.length > 20 && !key.includes("xxxx");
};

const sendWithResend = async ({ to, subject, html, text }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cleanEnv(process.env.RESEND_API_KEY)}`,
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

const createTransportConfigs = () => {
  const emailUser = cleanEnv(process.env.EMAIL_USER);
  const emailPass = cleanEnv(process.env.EMAIL_PASS);
  const envHost = cleanEnv(process.env.EMAIL_HOST);
  const envPort = Number(cleanEnv(process.env.EMAIL_PORT));

  const auth = {
    user: emailUser,
    pass: emailPass,
  };

  const timeoutOptions = {
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  };

  const configs = [];

  if (envHost && envPort) {
    configs.push({
      host: envHost,
      port: envPort,
      secure: cleanEnv(process.env.EMAIL_SECURE)
        ? cleanEnv(process.env.EMAIL_SECURE) === "true"
        : envPort === 465,
      auth,
      ...timeoutOptions,
    });
  }

  configs.push(
    {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth,
      requireTLS: true,
      ...timeoutOptions,
    },
    {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth,
      ...timeoutOptions,
    }
  );

  return configs;
};

const sendWithSmtp = async ({ to, subject, html, text }) => {
  const emailUser = cleanEnv(process.env.EMAIL_USER);
  const emailPass = cleanEnv(process.env.EMAIL_PASS);

  if (!emailUser || !emailPass) {
    throw new Error("Thiếu EMAIL_USER hoặc EMAIL_PASS trong môi trường máy chủ");
  }

  const errors = [];

  for (const config of createTransportConfigs()) {
    try {
      const transporter = nodemailer.createTransport(config);

      await transporter.sendMail({
        from: getFromAddress(),
        to,
        subject,
        html,
        text,
      });

      return;
    } catch (err) {
      errors.push(`${config.host}:${config.port} - ${err.message}`);
    }
  }

  throw new Error(`Không thể gửi email qua SMTP. ${errors.join(" | ")}`);
};

export const sendMail = async (mailOptions) => {
  if (hasValidResendKey()) {
    return sendWithResend(mailOptions);
  }

  return sendWithSmtp(mailOptions);
};