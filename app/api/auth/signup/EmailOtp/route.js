import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import axios from "axios";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), { status: 400 });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Use absolute URL or environment variable for host
    const host = process.env.APP_URL || 'https://vizai-frontend.vercel.app';
    const response = await axios.post(`${host}/api/send-mail`, {
      to: email,
      subject: 'Email Verification OTP',
      html: `<h1>Your OTP is ${otp}</h1>`,
    });

    if (response.status === 200) {
      console.log('OTP sent successfully');
      return new Response(JSON.stringify({ message: 'OTP sent to email', otp }), { status: 200 });
    } else {
      throw new Error('Failed to send OTP');
    }
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    return new Response(JSON.stringify({ error: 'OTP not sent' }), { status: 500 });
  }
}
