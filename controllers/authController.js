const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc Register new user
// @route POST /api/auth/signup
// @access Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;


        if (!name || !email || !password) {
            return res.status(400).json({ status: false, message: 'Please add all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ status: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date();
        otpExpire.setMinutes(otpExpire.getMinutes() + 10); // OTP valid for 10 mins

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpire,
            isVerified: false
        });

        if (user) {
            // Send OTP Email
            const message = `
            <h3>Hello ${name},</h3>
            <p>Your verification code for Open Sense is:</p>
            <h1 style="color:blue">${otp}</h1>
            <p>This code expires in 10 minutes.</p>
        `;
            await sendEmail(email, "Open Sense Email Verification", message);

            res.status(201).json({
                status: true,
                message: "Signup successful. Please verify your email with the OTP sent.",
                email: email
            });
        } else {
            res.status(400).json({ status: false, message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }

};

// @desc Verify OTP
// @route POST /api/auth/verify
// @access Public
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;


        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ status: false, message: 'User already verified' });
        }

        if (user.otp !== otp || new Date() > user.otpExpire) {
            return res.status(400).json({ status: false, message: 'Invalid or expired OTP' });
        }

        // Verify User
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        res.status(200).json({
            status: true,
            message: "Account verified successfully",
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }

};

// @desc Login user
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;


        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (!user.isVerified) {
                return res.status(401).json({ status: false, message: 'Please verify your email first' });
            }

            res.json({
                status: true,
                message: "Login successful",
                token: generateToken(user),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(400).json({ status: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }

};

// @desc Forgot Password - Generate OTP
// @route POST /api/auth/forgot-password
// @access Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ status: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found' });
        }

        // Generate OTP for password reset
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date();
        otpExpire.setMinutes(otpExpire.getMinutes() + 10); // OTP valid for 10 mins

        // Save OTP to user
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpire = otpExpire;
        await user.save();

        // Send OTP Email
        const message = `
            <h3>Hello ${user.name},</h3>
            <p>Your password reset code for Open Sense is:</p>
            <h1 style="color:blue">${otp}</h1>
            <p>This code expires in 10 minutes.</p>
        `;
        await sendEmail(email, "Open Sense Password Reset", message);

        res.status(200).json({
            status: true,
            message: "Password reset OTP sent to your email"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// @desc Verify Password Reset OTP
// @route POST /api/auth/reset-password-verify
// @access Public
const verifyPasswordResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found' });
        }

        if (user.resetPasswordOTP !== otp || new Date() > user.resetPasswordOTPExpire) {
            return res.status(400).json({ status: false, message: 'Invalid or expired OTP' });
        }

        // OTP is valid, return success
        res.status(200).json({
            status: true,
            message: "OTP verified successfully",
            email: email
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// @desc Reset Password
// @route POST /api/auth/reset-password
// @access Public
const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ status: false, message: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found' });
        }

        // Check if new password is the same as old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ status: false, message: 'New password must be different from old password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset OTP fields
        user.password = hashedPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpire = undefined;
        await user.save();

        res.status(200).json({
            status: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// @desc Change Password
// @route PUT /api/auth/change-password
// @access Private
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ status: false, message: 'Old and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ status: false, message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found' });
        }

        // Check if old password is correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: false, message: 'Old password is incorrect' });
        }

        // Check if new password is the same as old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ status: false, message: 'New password must be different from old password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            status: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = { registerUser, verifyOTP, loginUser, forgotPassword, verifyPasswordResetOTP, resetPassword, changePassword };