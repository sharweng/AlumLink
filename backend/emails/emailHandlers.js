import sgMail, { sender } from "../lib/sendgridApi.js";
import { createWelcomeEmailTemplate, createVerificationEmailTemplate, createLinkAcceptedEmailTemplate, createAccountCredentialsEmailTemplate } from "./emailTemplates.js";

export const sendWelcomeEmail = async (email, userName, profileUrl) => {
    try {
        const msg = {
            to: email,
            from: {
                email: sender.email,
                name: sender.name
            },
            subject: "Welcome to AlumniLink!",
            text: `Hi ${userName},\n\nWelcome to AlumniLink! We're excited to have you on board.\n\nYou can view and edit your profile here: ${profileUrl}\n\nBest regards,\nThe AlumniLink Team`,
            html: createWelcomeEmailTemplate(userName, profileUrl)
        };
        const response = await sgMail.send(msg);
        console.log("Welcome email sent successfully:", response[0]?.statusCode);
    } catch (error) {
        throw new Error(`Failed to send welcome email: ${error.message}`);
    }
}

export const sendVerificationEmail = async (email, code) => {
    try {
        const msg = {
            to: email,
            from: {
                email: sender.email,
                name: sender.name
            },
            subject: "Verify Your Email for AlumniLink",
            text: `Your verification code is: ${code}`,
            html: createVerificationEmailTemplate(code)
        };
        const response = await sgMail.send(msg);
        console.log("Verification email sent successfully:", response[0]?.statusCode);
    } catch (error) {
        throw new Error(`Failed to send verification email: ${error.message}`);
    }
}

export const sendLinkAcceptedEmail = async (senderEmail, senderName, recipientName, profileUrl) => {
    try {
        const msg = {
            to: senderEmail,
            from: {
                email: sender.email,
                name: sender.name
            },
            subject: `${recipientName} accepted your Link Request!`,
            text: `${recipientName} accepted your Link Request! View their profile: ${profileUrl}`,
            html: createLinkAcceptedEmailTemplate(senderName, recipientName, profileUrl)
        };
        const response = await sgMail.send(msg);
        console.log("Link accepted email sent successfully:", response[0]?.statusCode);
    } catch (error) {
        throw new Error(`Failed to send link accepted email: ${error.message}`);
    }
}

export const sendAccountCredentialsEmail = async (email, userName, username, tuptEmail, password, loginUrl) => {
    try {
        const msg = {
            to: email,
            from: {
                email: sender.email,
                name: sender.name
            },
            subject: "Your AlumniLink Account Credentials",
            text: `Hello ${userName},\n\nYour AlumniLink account has been created!\n\nUsername: ${username}\nEmail: ${tuptEmail}\nPassword: ${password}\n\nLogin here: ${loginUrl}\n\nPlease change your password after your first login.\n\nBest regards,\nThe AlumniLink Team`,
            html: createAccountCredentialsEmailTemplate(userName, username, tuptEmail, password, loginUrl)
        };
        const response = await sgMail.send(msg);
        console.log("Account credentials email sent successfully:", response[0]?.statusCode);
    } catch (error) {
        throw new Error(`Failed to send account credentials email: ${error.message}`);
    }
}