const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using SMTP
// IMPORTANT: USER MUST CONFIGURE .env WITH REAL SMTP DATA
// Example for Gmail: EMAIL_USER=your@gmail.com, EMAIL_PASS=your_app_password
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'jmart.app.dummy@gmail.com',
        pass: process.env.EMAIL_PASS || 'dummy_pass_123'
    }
});

exports.sendStatusEmail = async (userEmail, userName, status) => {
    const isVerified = status === 'verified';
    const subject = isVerified ? 'Selamat! Akun Driver JMart Anda telah Diterima' : 'Pemberitahuan Status Pendaftaran Driver JMart';

    // Aesthetic HTML Template
    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #FF8A00; margin: 0; font-style: italic;">JMart Driver</h1>
                <p style="color: #666; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Verification System</p>
            </div>
            
            <div style="padding: 30px; background-color: ${isVerified ? '#F0FFF4' : '#FFF5F5'}; border-radius: 15px; text-align: center;">
                <h2 style="color: ${isVerified ? '#2F855A' : '#C53030'}; margin-bottom: 15px;">
                    ${isVerified ? 'Pendaftaran Diterima!' : 'Pendaftaran Belum Dapat Diterima'}
                </h2>
                <p style="color: #4A5568; line-height: 1.6;">
                    Halo <strong>${userName}</strong>,<br><br>
                    ${isVerified
            ? 'Selamat! Dokumen Anda telah diverifikasi oleh tim JMart. Anda sekarang sudah bisa mulai menerima pesanan Antar Jemput di aplikasi.'
            : 'Mohon maaf, berdasarkan hasil peninjauan tim kami, pendaftaran Anda belum dapat kami setujui saat ini. Silakan hubungi support jika Anda merasa ada kesalahan.'}
                </p>
            </div>

            <div style="margin-top: 30px; text-align: center; color: #718096; font-size: 12px;">
                <p>Terima kasih telah bergabung bersama JMart.</p>
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
                    <p>&copy; 2026 JMart Indonesia. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"JMart Verification" <${process.env.EMAIL_USER || 'jmart.app.dummy@gmail.com'}>`,
            to: userEmail,
            subject: subject,
            html: htmlContent
        });
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        // We log but don't crash the whole process
        return false;
    }
};
