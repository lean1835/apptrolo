import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserModel from './auth.model';
import LodgeModel from '@modules/lodge/lodge.model';
import UtilityPriceModel from '@modules/utilityPrice/utilityPrice.model';
import { JWT_SECRET, JWT_EXPIRATION } from '@common/config/environment';
import { ApiError } from '@common/utils/ApiError';
import { sendOTPEmail } from '@common/utils/email';
import { IUser } from '@common/interfaces/user.interface';
import mongoose from 'mongoose';

export class AuthService {
  public async register(payload: any): Promise<any> {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        const existingUser = await UserModel.findOne({ phone: payload.phone }).session(session);
        if (existingUser) {
          throw new ApiError(400, 'Số điện thoại này đã được đăng ký');
        }

        const hashedPassword = await bcrypt.hash(payload.password, 10);
        
        // 1. Create User
        const user = new UserModel({
          name: payload.name,
          phone: payload.phone,
          email: payload.email || '',
          password: hashedPassword,
        });
        await user.save({ session });

        // 2. Create Lodge
        const lodge = new LodgeModel({
          name: payload.lodgeName,
          address: payload.lodgeAddress || '',
          phone: payload.phone,
          owner: user._id,
        });
        await lodge.save({ session });

        // 3. Create Utility Price
        const utilityPrice = new UtilityPriceModel({
          elec: 3500.0,
          water: 15000.0,
          wifi: 100000.0,
          garbage: 20000.0,
          waterMode: 'meter',
          waterFixed: 150000.0,
          lodge: lodge._id,
        });
        await utilityPrice.save({ session });

        // Update relationships
        lodge.utilityPrice = utilityPrice._id;
        await lodge.save({ session });

        user.lodge = lodge._id;
        await user.save({ session });

        const jwtToken = jwt.sign({ sub: user.phone }, JWT_SECRET, {
          expiresIn: parseInt(JWT_EXPIRATION, 10) || 86400000,
        });

        result = {
          token: jwtToken,
          name: user.name,
          phone: user.phone,
          email: user.email,
        };
      });
      return result;
    } finally {
      session.endSession();
    }
  }

  public async authenticate(payload: any): Promise<any> {
    const user = await UserModel.findOne({ phone: payload.phone });
    if (!user) {
      throw new ApiError(400, 'Số điện thoại hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(payload.password, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'Số điện thoại hoặc mật khẩu không chính xác');
    }

    const jwtToken = jwt.sign({ sub: user.phone }, JWT_SECRET, {
      expiresIn: parseInt(JWT_EXPIRATION, 10) || 86400000,
    });

    return {
      token: jwtToken,
      name: user.name,
      phone: user.phone,
      email: user.email,
    };
  }

  public async getMe(phone: string): Promise<IUser> {
    const user = await UserModel.findOne({ phone }).populate({
      path: 'lodge',
      populate: {
        path: 'utilityPrice',
      },
    });
    if (!user) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }
    return user;
  }

  public async updateProfile(phone: string, payload: any): Promise<IUser> {
    const user = await UserModel.findOne({ phone });
    if (!user) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }

    user.name = payload.name;
    user.email = payload.email || '';
    await user.save();

    return user;
  }

  public async changePassword(phone: string, payload: any): Promise<void> {
    const user = await UserModel.findOne({ phone });
    if (!user) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }

    const isMatch = await bcrypt.compare(payload.oldPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'Mật khẩu cũ không chính xác');
    }

    user.password = await bcrypt.hash(payload.newPassword, 10);
    await user.save();
  }

  public async forgotPassword(payload: { email: string }): Promise<void> {
    const emailLower = payload.email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: emailLower });
    if (!user) {
      throw new ApiError(404, 'Không tìm thấy người dùng với email này');
    }

    // Generate a random 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
    await user.save();

    // Send email to user
    await sendOTPEmail(emailLower, otp);

    // Log to console for testing
    console.log(`\n==================================================`);
    console.log(`[RESET PASSWORD] OTP for email ${emailLower} is: ${otp}`);
    console.log(`==================================================\n`);
  }

  public async resetPassword(payload: { email: string; otp: string; newPassword: string }): Promise<void> {
    const emailLower = payload.email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: emailLower });
    if (!user) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== payload.otp) {
      throw new ApiError(400, 'Mã xác thực OTP không chính xác');
    }

    if (!user.resetPasswordOTPExpires || user.resetPasswordOTPExpires.getTime() < Date.now()) {
      throw new ApiError(400, 'Mã xác thực OTP đã hết hạn');
    }

    // Update password
    user.password = await bcrypt.hash(payload.newPassword, 10);
    user.resetPasswordOTP = '';
    user.resetPasswordOTPExpires = null;
    await user.save();
  }
}
