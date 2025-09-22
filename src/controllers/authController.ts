import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserAttributes } from '../models/User';
import userService from '../services/userService';
import { UserPayload } from '../middleware/authMiddleware';

// Types
type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterData = LoginCredentials & {
  role?: 'Admin' | 'User';
  cartId?: number | null;
};

interface AuthRequest<T = any> extends Request {
  body: T;
  user?: UserPayload;
}

export const register = async (
  req: AuthRequest<RegisterData>,
  res: Response
): Promise<Response> => {
  const { 
    email, 
    password, 
    role = 'User',
    cartId = null
  } = req.body;

  // Basic input validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  try {
    // Check if user exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Create new user
    const newUser = await userService.createUser({
      email,
      password,
      role,
      cartId
    });
    
    if (!newUser) {
      throw new Error('Failed to create user');
    }
    
    // Generate token
    const jwtSecret = process.env.JWT_KEY;
    if (!jwtSecret) {
      throw new Error('Server configuration error');
    }

    // Create JWT payload
    const payload = {
      email: newUser.email,
      role: newUser.role
    };

    // Sign the JWT token
    const token = jwt.sign(
      payload, 
      jwtSecret,
      { 
        expiresIn: '1h',
        issuer: 'eCommerceDsAPI',
        audience: 'eCommerceDsClient',
        algorithm: 'HS256' as const
      }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorObject = error instanceof Error ? { 
      message: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    } : { message: 'Unknown error' };
    
    return res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const login = async (
  req: AuthRequest<LoginCredentials>,
  res: Response
): Promise<Response> => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    // Find user by email
    const user = await userService.findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Create JWT payload with consistent structure
    const payload = {
      sub: user.email, 
      email: user.email,
      role: user.role,
      cartId: user.cartId || 0, 
      iat: Math.floor(Date.now() / 1000) 
    };
    
    // Verify JWT_KEY is configured
    if (!process.env.JWT_KEY) {
      console.error('JWT_KEY is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }
    
    // Sign the JWT token with 24h expiration
    const token = jwt.sign(
      payload, 
      process.env.JWT_KEY,
      { 
        expiresIn: '24h',
        algorithm: 'HS256'
      }
    );
    
    console.log('Token generated successfully');

    // Set cookie expiration (24 hours to match token)
    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'lax' | 'strict' | 'none';
      maxAge: number;
      path: string;
      domain?: string;
    } = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      path: '/',
    };

    // Add domain if configured
    if (process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    // Set the token in an HTTP-only cookie
    res.cookie('token', token, cookieOptions);

    // Send the token in the response body as well
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          email: user.email,
          role: user.role,
          cartId: user.cartId || 0
        }
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorObject = error instanceof Error ? { 
      message: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    } : { message: 'Unknown error' };
    
    return res.status(500).json({
      success: false,
      message: 'Error during login',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const logout = (_req: Request, res: Response): Response => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/'
  };

  // Add domain if configured (must match the domain used in login)
  if (process.env.COOKIE_DOMAIN) {
    (cookieOptions as any).domain = process.env.COOKIE_DOMAIN;
  }

  res.clearCookie('token', cookieOptions);
  return res.json({
    success: true,
    message: 'Logout successful'
  });
};

// Get current user profile
export const getMe = (req: AuthRequest, res: Response): Response => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  const { email, role } = req.user;
  return res.json({
    success: true,
    data: {
      email,
      role
    }
  });
};

// Default export with all controller methods
export default {
  register,
  login,
  logout,
  getMe
};
