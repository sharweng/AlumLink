export function createVerificationEmailTemplate(code) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification Code</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #CC0000, #FF3333); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <img src="${process.env.CLOUDINARY_LOGO_URL}" alt="AlumniLink Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
    </div>
    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #CC0000;"><strong>Welcome to AlumniLink!</strong></p>
      <p>To complete your registration, please enter the verification code below.</p>
      <div style="background-color: #fce4e4; padding: 24px; border-radius: 8px; margin: 24px 0; text-align:center;">
        <span style="font-size: 40px; font-weight: bold; color: #CC0000; letter-spacing: 6px;">${code}</span>
      </div>
      <p style="font-size: 16px; color: #333;">This code will expire in <b>10 minutes</b>. If you did not request this, please ignore this email.</p>
      <div style="margin-top: 32px; text-align: center;">
        <span style="font-size: 15px; color: #888;">Need help? Contact our support team.</span>
      </div>
      <p style="margin-top: 24px;">Best regards,<br><span style="color:#CC0000;font-weight:bold;">The AlumniLink Management</span></p>
    </div>
  </body>
  </html>
  `;
}
export function createWelcomeEmailTemplate(userName, profileUrl) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AlumniLink</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #CC0000, #FF3333); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <img src="${process.env.CLOUDINARY_LOGO_URL}" alt="AlumniLink Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AlumniLink!</h1>
    </div>
    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #CC0000;"><strong>Hello ${userName},</strong></p>
      <p>We're thrilled to have you join our professional community! AlumniLink is your platform to connect, learn, and grow in your career.</p>
      <div style="background-color: #fce4e4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 16px; margin: 0;"><strong>Here's how to get started:</strong></p>
        <ul style="padding-left: 20px;">
          <li>Complete your profile</li>
          <li>Link with fellow alumni and juniors</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${profileUrl}" style="background-color: #CC0000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Complete Your Profile</a>
      </div>
      <p>If you have any questions or need assistance, our support team is always here to help.</p>
      <p>Best regards,<br>The AlumniLink Management</p>
    </div>
  </body>
  </html>
  `;
}

export const createLinkAcceptedEmailTemplate = (senderName, recipientName, profileUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Request Accepted</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #CC0000, #FF3333); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="${process.env.CLOUDINARY_LOGO_URL}" alt="AlumniLink Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;"/>
    <h1 style="color: white; margin: 0; font-size: 28px;">Link Accepted!</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; color: #CC0000;"><strong>Hello ${senderName},</strong></p>
    <p>Great news! <strong>${recipientName}</strong> has accepted your link request on AlumniLink.</p>
    <div style="background-color: #fce4e4; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 16px; margin: 0;"><strong>What's next?</strong></p>
      <ul style="padding-left: 20px;">
        <li>Check out ${recipientName}'s full profile</li>
        <li>Send a message to start a conversation</li>
        <li>Explore mutual links and interests</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${profileUrl}" style="background-color: #CC0000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">View ${recipientName}'s Profile</a>
    </div>
    <p>Expanding your professional network opens up new opportunities. Keep linking!</p>
    <p>Best regards,<br>The AlumniLink Management</p>
  </div>
</body>
</html>
`;

export const createCommentNotificationEmailTemplate = (recipientName, commenterName, postUrl, commentContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Comment on Your Post</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #CC0000, #FF3333); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="${process.env.CLOUDINARY_LOGO_URL}" alt="AlumniLink Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;"/>
    <h1 style="color: white; margin: 0; font-size: 28px;">New Comment on Your Post</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; color: #CC0000;"><strong>Hello ${recipientName},</strong></p>
    <p>${commenterName} has commented on your post:</p>
    <div style="background-color: #fce4e4; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-style: italic; margin: 0;">"${commentContent}"</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href=${postUrl} style="background-color: #CC0000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">View Comment</a>
    </div>
    <p>Stay engaged with your network by responding to comments and fostering discussions.</p>
    <p>Best regards,<br>The AlumniLink Management</p>
  </div>
</body>
</html>
`;

export const createAccountCredentialsEmailTemplate = (userName, username, tuptEmail, password, loginUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AlumniLink Account Credentials</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #CC0000, #FF3333); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="${process.env.CLOUDINARY_LOGO_URL}" alt="AlumniLink Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;"/>
    <h1 style="color: white; margin: 0; font-size: 28px;">Your Account Credentials</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; color: #CC0000;"><strong>Hello ${userName},</strong></p>
    <p>Your AlumniLink account has been created! Below are your login credentials:</p>
    <div style="background-color: #fce4e4; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 16px; margin: 0 0 10px 0;"><strong>Login Credentials:</strong></p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Username:</td>
          <td style="padding: 8px 0; color: #CC0000; font-weight: bold;">${username}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
          <td style="padding: 8px 0; color: #CC0000; font-weight: bold;">${tuptEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Password:</td>
          <td style="padding: 8px 0; color: #CC0000; font-weight: bold;">${password}</td>
        </tr>
      </table>
    </div>
    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; font-size: 14px; color: #856404;"><strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="background-color: #CC0000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">Login to AlumniLink</a>
    </div>
    <p>If you have any questions or need assistance, please contact our support team.</p>
    <p>Best regards,<br>The AlumniLink Management</p>
  </div>
</body>
</html>
`;