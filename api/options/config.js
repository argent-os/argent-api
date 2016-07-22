var path = require('path');

module.exports = {
  logFile: path.join(__dirname, 'authlogger.log'),
  corsDomains: ['*', 'http://localhost:5000'],
  mailer: {
    mailerFrom    : process.env.SUPPORT_EMAIL,
    supportTitle: 'Support Request',
    supportEmails: ['support@argent-tech.com', 'sinan@argent-tech.com', 'selin@argent-tech.com', 'semih@argent-tech.com'],
    verifyEmailTitle   : 'Verify Account for Argent',
    verifyEmailLinkText   : 'Welcome to Argent!  Please verify your email using the following link: ',
    quoteEmailTitle: 'Quote created',  
    quoteEmailTextLink: 'Please use the following link to accept or reject proposal ',
    mailerInfo    : 'Hello! ',
    transporter   : {
      service: 'Gmail',
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.SUPPORT_EMAIL_PW
      }
    }
  }
};
