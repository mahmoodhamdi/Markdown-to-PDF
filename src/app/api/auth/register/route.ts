/**
 * User Registration API
 * POST /api/auth/register - Register a new user
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Check rate limit (5 registrations per hour per IP)
    const rateLimitResult = checkRateLimit(`register:${ip}`, 5, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        { error: firstError.message, code: 'validation_error' },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findById(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use', code: 'email_in_use' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await User.create({
      _id: email.toLowerCase(),
      email: email.toLowerCase(),
      name,
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      plan: 'free',
      password: hashedPassword,
      usage: {
        conversions: 0,
        apiCalls: 0,
        lastReset: new Date().toISOString().split('T')[0],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.', code: 'server_error' },
      { status: 500 }
    );
  }
}
