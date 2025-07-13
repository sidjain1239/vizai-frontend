import { connectToDatabase } from '@/lib/mongodb';
import Message from '@/models/Message';
export async function POST(req) {
  await connectToDatabase();
  const { id, type, content } = await req.json();
  console.log("Updating message with ID:", id);
  try {
    const msg = await Message.findById(id);
    let msgArray = msg.messages;
    console.log("Current messages:", msgArray);
    msgArray.push({ type, content });
    await msg.save();
    console.log("chat updated:", msg);
    return new Response(JSON.stringify({ message: 'Chat updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}