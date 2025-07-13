import { connectToDatabase } from '@/lib/mongodb';
import Message from '@/models/Message';

import mongoose from 'mongoose';

export async function POST(req) {
  try {
    console.log('Request received');
    await connectToDatabase();
    console.log('Connected to database');

    const { id } = await req.json();
    console.log('Received ID:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ID format');
      return new Response(JSON.stringify({ message: 'Invalid ID format' }), { status: 400 });
    }

    const messages = await Message.findOne({ _id: id });
    if (!messages) {
      console.log('Messages not found');
      return new Response(JSON.stringify({ error: 'Messages not found' }), { status: 404 });
    }

    console.log('Messages found:', messages);
    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}