import { transporter, sender } from "../lib/sendgrid.js";
import { createWelcomeEmailTemplate, createVerificationEmailTemplate, createLinkAcceptedEmailTemplate } from "./emailTemplates.js";

export const sendWelcomeEmail = async (email, userName, profileUrl) => {
    try {
        const info = await transporter.sendMail({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Welcome to AlumniLink!",
            text: `Hi ${userName},\n\nWelcome to AlumniLink! We're excited to have you on board.\n\nYou can view and edit your profile here: ${profileUrl}\n\nBest regards,\nThe AlumniLink Team`,
            html: createWelcomeEmailTemplate(userName, profileUrl)
        });
        console.log("Welcome email sent successfully:", info.messageId);
    } catch (error) {
        throw new Error(`Failed to send welcome email: ${error.message}`);
    }
}

export const sendVerificationEmail = async (email, code) => {
    try {
        const info = await transporter.sendMail({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Verify Your Email for AlumniLink",
            text: `Your verification code is: ${code}`,
            html: createVerificationEmailTemplate(code)
        });
        console.log("Verification email sent successfully:", info.messageId);
    } catch (error) {
        throw new Error(`Failed to send verification email: ${error.message}`);
    }
}

export const sendLinkAcceptedEmail = async (senderEmail, senderName, recipientName, profileUrl) => {
    try {
        const info = await transporter.sendMail({
            from: `${sender.name} <${sender.email}>`,
            to: senderEmail,
            subject: `${recipientName} accepted your Link Request!`,
            text: `${recipientName} accepted your Link Request! View their profile: ${profileUrl}`,
            html: createLinkAcceptedEmailTemplate(senderName, recipientName, profileUrl)
        });
        console.log("Link accepted email sent successfully:", info.messageId);
    } catch (error) {
        throw new Error(`Failed to send link accepted email: ${error.message}`);
    }
}