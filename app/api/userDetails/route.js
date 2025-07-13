
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';


export async function POST(req) {
  await connectToDatabase();
  
  try {
    const { id } = await req.json();
    console.log("User ID:", id);
    const userDetail = await User.findOne({ _id: id });

    console.log(userDetail)
    
   

    return new Response(JSON.stringify({ userDetail }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}