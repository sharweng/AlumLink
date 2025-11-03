import { transporter } from "../lib/nodemailer.js";
import { createVerificationEmailTemplate, createCommentNotificationEmailTemplate, createLinkAcceptedEmailTemplate, createWelcomeEmailTemplate, createAccountCredentialsEmailTemplate } from "./emailTemplates.js";

export const sendVerificationEmail = async (email, code) => {
    if (process.env.NODE_ENV === 'production') {
        // Use Mailtrap in production
        const { sendVerificationEmail: mailtrapSendVerificationEmail } = await import('./emailHandlers.js');
        return mailtrapSendVerificationEmail(email, code);
    }
    // Default: use Nodemailer in development
    try {
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL_FROM,
            name: process.env.EMAIL_FROM_NAME,
            to: email,
            subject: "Verify Your Email for AlumniLink",
            html: createVerificationEmailTemplate(code),
            category: "verification"
        };
        await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log('Error:', error);
            } else {
                console.log('Verification email sent:', info.response);
            }
        });
        console.log("Verification email sent successfully")
    } catch (error) {
        throw new Error(`Failed to send verification email: ${error.message}`)
    }
}

export const sendWelcomeEmail = async (email, userName, profileUrl) => {
    if (process.env.NODE_ENV === 'production') {
        // Use Mailtrap in production
        const { sendWelcomeEmail: mailtrapSendWelcomeEmail } = await import('./emailHandlers.js');
        return mailtrapSendWelcomeEmail(email, userName, profileUrl);
    }
    // Default: use Nodemailer in development
    try {
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL_FROM,
            name: process.env.EMAIL_FROM_NAME,
            to: email,
            subject: 'Welcome to AlumniLink!',
            html: createWelcomeEmailTemplate(userName, profileUrl),
            category: "welcome"
        };
        await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log('Error:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
        console.log("Welcome email sent successfully")
    } catch (error) {
        throw new Error(`Failed to send welcome email: ${error.message}`)
    }
}

export const sendCommentNotificationEmail = async (recipientEmail, recipientName, commenterName, postUrl, commentContent) => {
    if (process.env.NODE_ENV === 'production') {
        // Do not send comment notification emails in production via Mailtrap
        return;
    }
    // Default: use Nodemailer in development
    if (!recipientEmail) {
        throw new Error("Recipient email is required for comment notification email.");
    }
    try {
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL_FROM,
            name: process.env.EMAIL_FROM_NAME,
            to: recipientEmail,
            subject: 'New Comment on Your Post',
            html: createCommentNotificationEmailTemplate(recipientName, commenterName, postUrl, commentContent),
            category: "comment_notification"
        };
        await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log('Error:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
        console.log("Comment notification email sent successfully")
    } catch (error) {
        throw new Error(`Failed to send comment notification email: ${error.message}`)
    }
}

export const sendLinkAcceptedEmail = async (senderEmail, senderName, recipientName, profileUrl) => {
    if (process.env.NODE_ENV === 'production') {
        // Use Mailtrap in production
        const { sendLinkAcceptedEmail: mailtrapSendLinkAcceptedEmail } = await import('./emailHandlers.js');
        return mailtrapSendLinkAcceptedEmail(senderEmail, senderName, recipientName, profileUrl);
    }
    // Default: use Nodemailer in development
    try {
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL_FROM,
            name: process.env.EMAIL_FROM_NAME,
            to: senderEmail,
            subject: `${recipientName} accepted your Link Request!`,
            html: createLinkAcceptedEmailTemplate(senderName, recipientName, profileUrl),
            category: "link_accepted"
        };
        await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log('Error:', error);   
            } else {
                console.log('Email sent:', info.response);
            }
        });
        console.log("Link accepted email sent successfully")
    } catch (error) {
        throw new Error(`Failed to send link accepted email: ${error.message}`)
    }
}

export const sendAccountCredentialsEmail = async (email, userName, username, tuptEmail, password, loginUrl) => {
    if (process.env.NODE_ENV === 'production') {
        // Use SendGrid in production
        const { sendAccountCredentialsEmail: sendGridSendAccountCredentialsEmail } = await import('./emailHandlers.js');
        return sendGridSendAccountCredentialsEmail(email, userName, username, tuptEmail, password, loginUrl);
    }
    // Default: use Nodemailer in development (Mailtrap)
    try {
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL_FROM,
            name: process.env.EMAIL_FROM_NAME,
            to: email,
            subject: 'Your AlumniLink Account Credentials',
            html: createAccountCredentialsEmailTemplate(userName, username, tuptEmail, password, loginUrl),
            category: "account_credentials"
        };
        await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log('Error:', error);   
            } else {
                console.log('Email sent:', info.response);
            }
        });
        console.log("Account credentials email sent successfully")
    } catch (error) {
        throw new Error(`Failed to send account credentials email: ${error.message}`)
    }
}



