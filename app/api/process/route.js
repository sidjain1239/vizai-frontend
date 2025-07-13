import axios from "axios"
export async function POST(request) {
    try {
        const data = await request.json()
        const prompt = data.prompt || "No prompt provided"
        // Handle data here
        await axios.post("https://sjain283-vizai.hf.space/predict", { "prompt": prompt }
        ).then((res) => {
            console.log(res.data);
            return new Response(JSON.stringify(res.data ), {
                status: 200,
            })
        }
        )
        }
     catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
        })
    }
}