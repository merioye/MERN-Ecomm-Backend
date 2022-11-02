const sgMail = require("@sendgrid/mail");
const generateEmailTemplate = require("./generateEmailTemplate");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = (name, email, resetLink) => {
    const emailTemplate = generateEmailTemplate(name, resetLink);

    const msg = {
        to: email,
        from: process.env.SENDER_EMAIL,
        subject: "Hello from TeleCart",
        html: emailTemplate,
    };

    // sending the mail
    sgMail
        .send(msg)
        .then((response) => console.log("Email sent..."))
        .catch((error) => {
            console.log(error.message);
            throw new Error(error);
        });
};

module.exports = sendEmail;
