import { connectToDatabase } from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';
import mongoose from 'mongoose'; // Import mongoose to use ObjectId

export async function POST(req) {
  try {
    const { title, userId, image, messages } = await req.json();
    console.log(userId);
    await connectToDatabase();

    // Create and save the new message
    const newMg = new Message({ title, userId: userId, image, messages });
    await newMg.save();
    const MgId = newMg._id;

    // Find the user and update their chats
    const user = await User.findById(userId);
    const userchats = user.chats;
    // Push the new chat with the id cast to ObjectId
  // ...existing code...
    // Push the new chat with the id cast to ObjectId
    userchats.push({ title, id: new mongoose.Types.ObjectId(MgId) });
    console.log("new chat created with",title, userId);
    await user.save();


    // Push the new chat with the id cast to ObjectId
    // Push the new chat with the id cast to ObjectId
    // Push the new chat with the id directly (no need to cast again)


    return new Response(JSON.stringify({ message: 'Data saved successfully', id: MgId }), { status: 201 });
  } catch (error) {
    console.error('Error saving data:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}