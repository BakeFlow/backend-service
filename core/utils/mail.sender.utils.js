const { google } = require("googleapis");
require("dotenv").config();

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLEINT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLEINT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail(email, title, body) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const message = [`From: ${process.env.GMAIL}`, `To: ${email}`, "Content-Type: text/html; charset=utf-8", "MIME-Version: 1.0", `Subject: ${title}`, "", body].join("\n");

  const encodedMessage = Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = sendMail;
