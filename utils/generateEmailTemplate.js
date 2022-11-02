const Mailgen = require("mailgen");

const generateEmailTemplate = (name, resetLink) => {
    // Configure mailgen by setting a theme and your product info
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            // Appears in header & footer of e-mails
            name: "TeleCart",
            link: process.env.CLIENT_APP_URL,
        },
    });

    // Email content(data)
    const email = {
        body: {
            name: name,
            intro: "You have received this email because a password reset request for your account was received.",
            action: {
                instructions: "Click the button below to reset your password:",
                button: {
                    color: "#22BC66",
                    text: "Reset your Password",
                    link: resetLink,
                },
            },
            outro: "If you did not request a password reset, no further action is required on your part.",
        },
    };

    // Generating an HTML email Template with the provided contents
    return mailGenerator.generate(email);
};

module.exports = generateEmailTemplate;
