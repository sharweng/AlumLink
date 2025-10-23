import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
    service: "SendGrid",
    auth: {
        user: "apikey", // SendGrid requires this literal string
        pass: process.env.SENDGRID_API_KEY
    }
});

export const sender = {
    email: process.env.EMAIL_FROM,
    name: process.env.EMAIL_FROM_NAME
};
