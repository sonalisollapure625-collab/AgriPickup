
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { config } from '../config/environment.js';

const router = Router();

// REGISTER: Create a customer or seller account
router.post('/register', async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      businessName,
      ownerName,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required.',
      });
    }

    if (typeof email !== 'string' ||
        typeof password !== 'string' ||
        typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.',
      });
    }

    // Public registration cannot create an administrator.
    const userRole = role === 'SELLER' ? 'SELLER' : 'CUSTOMER';

    if (userRole === 'SELLER' &&
        (!businessName || !ownerName || !phone)) {
      return res.status(400).json({
        success: false,
        message: 'Seller registration requires business name, owner name and phone.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'This email is already registered. Please log in.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone || null,
      role: userRole,
    };

    if (userRole === 'CUSTOMER') {
      userData.customer = { create: {} };
    } else {
      userData.seller = {
        create: {
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          phone: phone.trim(),
          state: 'Karnataka',
          isVerified: false,
        },
      };
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// LOGIN: Verify email and password
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// GET CURRENT AUTHENTICATED USER
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        customer: true,
        seller: {
          include: {
            nurseries: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

import crypto from 'crypto';
import { emailService } from '../services/email.service.js';

// FORGOT PASSWORD: Request password reset link
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user without revealing account existence
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.isActive) {
      // Generate secure 32-byte hex token (64 characters)
      const rawToken = crypto.randomBytes(32).toString('hex');
      // Store SHA-256 hash in database
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      // Token expires in 30 minutes
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: expiresAt,
        },
      });

      const resetUrl = `${config.clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

      await emailService.sendPasswordResetEmail({
        toEmail: user.email,
        name: user.name,
        resetUrl,
      });
    }

    // Always return generic confirmation to protect account privacy
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, password-reset instructions have been sent.',
    });
  } catch (error) {
    next(error);
  }
});

// VERIFY RESET TOKEN: Validate token before displaying form
router.get('/verify-reset-token', async (req, res, next) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid or missing reset token parameters.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Password reset link is invalid or has expired. Please request a new link.',
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: 'Token is valid.',
    });
  } catch (error) {
    next(error);
  }
});

// RESET PASSWORD: Set new password with verified token
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token, email, and new password are required.',
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid, expired, or has already been used.',
      });
    }

    // Hash new password using bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and clear reset token to prevent reuse
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

