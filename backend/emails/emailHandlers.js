import { mailtrap, sender } from "../lib/mailtrap.js";
import { createWelcomeEmailTemplate } from "./emailTemplates.js";

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