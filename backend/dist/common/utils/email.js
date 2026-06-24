"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("./logger");
const sendOTPEmail = async (toEmail, otp) => {
    const emailUser = process.env.EMAIL_USER || 'pmeodz1@gmail.com';
    const emailPass = process.env.EMAIL_PASS;
    if (!emailPass) {
        logger_1.logger.warn(`[EMAIL BYPASS] EMAIL_PASS environment variable is not configured. Logged OTP to console: ${otp}`);
        return false;
    }
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });
        const mailOptions = {
            from: `"Hệ thống quản lý nhà trọ" <${emailUser}>`,
            to: toEmail,
            subject: '[Hệ thống quản lý nhà trọ] Mã xác thực đặt lại mật khẩu',
            text: `Xin chào,\n\nBạn đã yêu cầu đặt lại mật khẩu cho tài khoản Hệ thống quản lý nhà trọ của mình.\n\nMã xác thực OTP của bạn là: ${otp}\n\nMã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.\n\nTrân trọng,\nBan quản trị hệ thống`,
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #10b981; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">Hệ thống quản lý nhà trọ</h1>
          </div>
          <div style="padding: 32px 24px; color: #333333; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0;">Xin chào,</p>
            <p style="font-size: 15px;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản đăng ký bằng email của bạn trên hệ thống.</p>
            <p style="font-size: 15px;">Vui lòng sử dụng mã xác thực OTP dưới đây để hoàn tất quá trình:</p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
              <span style="font-size: 30px; font-weight: bold; color: #16a34a; letter-spacing: 4px;">${otp}</span>
            </div>
            
            <p style="font-size: 13px; color: #666666; font-style: italic; margin-bottom: 0;">Lưu ý: Mã OTP có hiệu lực trong vòng 5 phút và chỉ sử dụng được một lần duy nhất. Hãy tuyệt đối giữ bảo mật mã này.</p>
          </div>
          <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #e8e8e8;">
            Email tự động từ Hệ thống quản lý nhà trọ. Vui lòng không trả lời thư này.
          </div>
        </div>
      `,
        };
        await transporter.sendMail(mailOptions);
        logger_1.logger.info(`✅ Email OTP successfully sent to ${toEmail}`);
        return true;
    }
    catch (error) {
        logger_1.logger.error(`❌ Failed to send email OTP to ${toEmail}`, error);
        return false;
    }
};
exports.sendOTPEmail = sendOTPEmail;
