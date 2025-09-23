import { transporter } from "../lib/nodemailer.js";
import { createWelcomeEmailTemplate } from "./emailTemplates.js";

export const sendWelcomeEmail = async (email, userName, profileUrl) => {

    const mailOptions = {
        from: process.env.NODEMAILER_EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME,
        to: email,
        subject: 'Welcome to AlumniLink!',
        text: `Hi ${userName},\n\nWelcome to AlumniLink! We're excited to have you on board.\n\nYou can view and edit your profile here: ${profileUrl}\n\nBest regards,\nThe AlumniLink Team`,
        html: createWelcomeEmailTemplate(userName, profileUrl),
        category: "welcome"
    };

    try {
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



