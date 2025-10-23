import { mailtrap, sender } from "../lib/mailtrap.js";
import { createWelcomeEmailTemplate, createVerificationEmailTemplate, createLinkAcceptedEmailTemplate } from "./emailTemplates.js";

export const sendWelcomeEmail = async (email, userName, profileUrl) => {
    const recipient = [{email}]

    try {
        const response = await mailtrap.send({
            from: sender,
            to: recipient,
            subject: "Welcome to AlumniLink!",
            text: `Hi ${userName},\n\nWelcome to AlumniLink! We're excited to have you on board.\n\nYou can view and edit your profile here: ${profileUrl}\n\nBest regards,\nThe AlumniLink Team`,
            html: createWelcomeEmailTemplate(userName, profileUrl),
            category: "welcome"
        })
        console.log("Welcome email sent successfully:", response)
    } catch (error) {
        throw new Error(`Failed to send welcome email: ${error.message}`)
    }
}

export const sendVerificationEmail = async (email, code) => {
    const recipient = [{email}]

    try {
        const response = await mailtrap.send({
            from: sender,
            to: recipient,
            subject: "Verify Your Email for AlumniLink",
            text: `Your verification code is: ${code}`,
            html: createVerificationEmailTemplate(code),
            category: "verification"
        })
        console.log("Verification email sent successfully:", response)
    } catch (error) {
        throw new Error(`Failed to send verification email: ${error.message}`)
    }
}

export const sendLinkAcceptedEmail = async (senderEmail, senderName, recipientName, profileUrl) => {
    const recipient = [{email: senderEmail}]

    try {
        const response = await mailtrap.send({
            from: sender,
            to: recipient,
            subject: `${recipientName} accepted your Link Request!`,
            text: `${recipientName} accepted your Link Request! View their profile: ${profileUrl}`,
            html: createLinkAcceptedEmailTemplate(senderName, recipientName, profileUrl),
            category: "link_accepted"
        })
        console.log("Link accepted email sent successfully:", response)
    } catch (error) {
        throw new Error(`Failed to send link accepted email: ${error.message}`)
    }
}