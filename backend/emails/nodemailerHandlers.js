import { transporter } from "../lib/nodemailer.js";
import { createCommentNotificationEmailTemplate, createLinkAcceptedEmailTemplate, createWelcomeEmailTemplate } from "./emailTemplates.js";

export const sendWelcomeEmail = async (email, userName, profileUrl) => {

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



