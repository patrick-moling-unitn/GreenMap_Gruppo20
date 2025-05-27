const nodemailer = require('nodemailer');

const USERNAME = process.env.EMAIL_USER;
const PASSWORD = process.env.EMAIL_PASS;

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: USERNAME,
        pass: PASSWORD
    }
});

class MailProvider {
    sendMail(toEmail, emailSubject, emailText) {
        let mailOptions = {
            from: USERNAME,
            to: toEmail,
            subject: emailSubject,
            text: emailText
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                if (LOG_MODE >= 1) console.warn(error);
            } else {
                if (LOG_MODE >= 1) console.log('Email sent: ' + info.response);
            }
        });
    }
}

const mailProvider = new MailProvider();

module.exports = mailProvider;