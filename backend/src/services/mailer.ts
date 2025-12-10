import nodemailer from "nodemailer";
import env from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.mailtrap.host,
  port: env.mailtrap.port,
  auth: {
    user: env.mailtrap.user,
    pass: env.mailtrap.pass,
  },
});

export type SendEmailPayload = {
  to: string;
  subject: string;
  body: string;
};

export const sendEmail = async ({ to, subject, body }: SendEmailPayload) =>
  transporter.sendMail({
    from: env.mailFrom,
    to,
    subject,
    text: body,
  });

export const verifyMailer = async () => transporter.verify();
