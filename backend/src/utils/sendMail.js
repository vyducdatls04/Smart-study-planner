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

  if (hasValidResendKey()) {
    return "Smart Study <onboarding@resend.dev>";
  }

  const emailUser = cleanEnv(process.env.EMAIL_USER);
  if (!emailUser) return "";

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
    let message = errorText;

    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || parsed.error || errorText;
    } catch {
      message = errorText;
    }

    if (
      response.status === 403 &&
      String(message).includes("resend.dev")
    ) {
      throw new Error(
        "Resend đang dùng onboarding@resend.dev nên chỉ gửi được tới email tài khoản Resend của bạn. Để gửi tới email thật của mọi user, hãy verify domain trong Resend và set EMAIL_FROM=Smart Study <noreply@domain-cua-ban.com> trên Render."
      );
    }

    throw new Error(`Resend email error ${response.status}: ${message}`);
  }
};

const createTransportConfigs = () => {
  const emailUser = cleanEnv(process.env.EMAIL_USER);
  const emailPass = cleanEnv(process.env.EMAIL_PASS).replace(/\s/g, "");
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
  const emailPass = cleanEnv(process.env.EMAIL_PASS).replace(/\s/g, "");

  if (!emailUser || !emailPass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS on the server");
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

  throw new Error(
    `Could not send email via SMTP. ${errors.join(" | ")}. Nếu backend chạy trên Render, hãy set RESEND_API_KEY để gửi qua Resend API thay vì Gmail SMTP.`
  );
};

export const sendMail = async (mailOptions) => {
  if (hasValidResendKey()) {
    return sendWithResend(mailOptions);
  }

  return sendWithSmtp(mailOptions);
};
