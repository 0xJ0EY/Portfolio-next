import type { NextApiRequest, NextApiResponse } from 'next'
import { Ok, Result } from 'result';
import { z } from "zod";
import nodemailer from "nodemailer";

type SendEmailRequestData = {
  name: string,
  email: string,
  company?: string,
  message: string
}

type ResponseData = {
  message: string
}

type ResponseError = {
  error: any
}

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().min(5),
  company: z.string().optional(),
  message: z.string().min(1),
});

async function sendEmailToMe(request: SendEmailRequestData): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    port: parseInt(process.env.MAIL_PORT ?? ""),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  console.log("process env");
  console.log(process.env.MAIL_SERVER);
  console.log(process.env.MAIL_USER);

  await transporter.verify();

  const subject = `${request.name} <${request.email}> ${request.company ? `from ${request.company}` : ''}`;

  await transporter.sendMail({
    from: `"${request.email}" <contact@joeyderuiter.me>`,
    to: `contact@joeyderuiter.me`,
    subject,
    text: request.message
  });

  console.log('send email');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | ResponseError>
) {
  if (req.method === 'POST') {
    const request = contactSchema.safeParse(req.body);

    if (request.success) {
      try {
        await sendEmailToMe(request.data);
        return res.status(200).json({ message: "Message processed" });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Unable to send email" });
      }

    } else {
      return res.status(503).json({ error: request.error.flatten().fieldErrors });
    }
  }

  return res.status(404).json({ error: 'Page not found' });
}
