import { NextRequest, NextResponse } from 'next/server';
import { Client } from "@gradio/client";
import { Prompt } from 'next/font/google';
import { model } from 'mongoose';

export async function POST(req) {
    try {

        const body = await req.json();
        const { prompt, imageBase64, lang } = body;
        const base64Data = imageBase64.split(',')[1];
        const mime = imageBase64.match(/data:(.*?);base64/)[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const file = new Blob([buffer], { type: mime });

        const client = await Client.connect("sjain283/vizai-nlp");
        const result = await client.predict("/predict", { text: prompt });
        console.log('Prediction result:', result);

        const dataValue = result.data;
        // Handle array format - get first element if it's an array
        const modelResult = Array.isArray(dataValue) ? dataValue[0] : dataValue;
        console.log('Model result:', modelResult);
        if (prompt && prompt.toLowerCase().includes('generate')) {
            const generationPrompt = prompt.replace(/generate an image/i, '').trim() || 'A beautiful landscape';
            const width = 1024;
            const height = 1024;
            const seed = 42; // Each seed generates a new image variation
            const model = 'flux'; // Using 'flux' as default if model is not provided

            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(generationPrompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}`;

            try {
                const imageResponse = await fetch(imageUrl);
                const imageBuffer = await imageResponse.arrayBuffer();
                const generatedImageBase64 = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;

                return NextResponse.json({
                    model: "Image Generation",
                    image: true,
                    imageUrl: generatedImageBase64,
                    prompt: generationPrompt
                });
            } catch (error) {
                console.error("Error generating image:", error);
                return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
            }
        }
        //blip captioning
        else if (modelResult == "BLIP Captioning") {
            const client = await Client.connect("sjain283/vizia-imgcap");

            const result = await client.predict("/predict", {
                input: file,
            });
            return NextResponse.json({
                model: "BLIP Captioning",
                text: result.data[0] || result.data,
                llm: false
            });
        }
        //BLIPQA
        else if (modelResult == "BLIPQA") {
            const client = await Client.connect('sjain283/vizai-qa');

            const result = await client.predict("/predict", {
                image: file,
                question: prompt || '',
            });
            return NextResponse.json({
                model: "BLIPQA",
                text: result.data[0] || result.data,
                llm: false
            });
        }
        //Grounding DINO
        else if (modelResult == "Grounding DINO") {
            const client = await Client.connect("sjain283/vizai-gd");
            const result = await client.predict("/predict", {
                input_image: file,
                grounding_caption: prompt,
                box_threshold: 0.25, // Default box threshold
                text_threshold: 0.25, // Default text threshold
            });
            console.log(result)
            const imageUrl = result.data[0].url;
            const imageResponse = await fetch(imageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const annotatedImageBase64 = `data:image/webp;base64,${Buffer.from(imageBuffer).toString('base64')}`;

            return NextResponse.json({
                model: "Grounding DINO",
                image: true,
                imageUrl: annotatedImageBase64,
            });
        }
        //LLaMA General QA
        else if (modelResult == "LLaMA General QA") {
            return NextResponse.json({
                model: "LLaMA General QA",
                llm: true,
                oc: false
            });
        }
        //PaddleOCR
        else if (modelResult == "PaddleOCR") {
            const client = await Client.connect("sjain283/vizai-ocr");
            const result = await client.predict("//predict", {
                img: file, lang: lang || "en",
            });
            return NextResponse.json({
                model: "PaddleOCR",
                text: result.data[0] || result.data,
                llm: false
            });
        }
        //PaddleOCR+LLaMA General QA
        else if (modelResult == "PaddleOCR+LLaMA General QA") {
            const client = await Client.connect("sjain283/vizai-ocr");
            const result = await client.predict("//predict", {
                img: file, lang: lang || "en",
            });
            return NextResponse.json({
                model: "PaddleOCR+LLaMA General QA",
                text: result.data[0] || result.data,
                llm: true,
                oc: true
            });
        }
        //PaddleOCR+Translator
        else if (modelResult == "PaddleOCR+Translator") {
            const client = await Client.connect("sjain283/vizai-ocr");
            const result = await client.predict("//predict", {
                img: file, lang: lang || "en",
            });
            const text = result.data[0] || result.data;
            const tclient = await Client.connect("sjain283/vizai-tr");
            const tresult = await tclient.predict("/translate", {
                input_text: text,
                source_lang: "English",
                target_lang: "Hindi",
            });
            return NextResponse.json({
                model: "PaddleOCR+Translator",
                text: tresult.data[0] || tresult.data,
                tf: text,
                llm: false
            });
        }
        //YOLO
        else if (modelResult == "YOLO") {
            const client = await Client.connect("sjain283/vizai-od");

            const result = await client.predict("/predict", {
                image: file,
            });
            const imageUrl = result.data[0].url;
            const imageResponse = await fetch(imageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const annotatedImageBase64 = `data:image/webp;base64,${Buffer.from(imageBuffer).toString('base64')}`;


            return NextResponse.json({
                model: "YOLO",
                image: true,
                text: result.data[1],
                imageUrl: annotatedImageBase64,
                detectedObjects: result.data[1] // Detection results array
            });
        }
        else if (modelResult == "YOLO+LLaMA") {
            const client = await Client.connect("sjain283/vizai-od");

            const result = await client.predict("/predict", {
                image: file,
            });
            const imageUrl = result.data[0].url;
            const imageResponse = await fetch(imageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const annotatedImageBase64 = `data:image/webp;base64,${Buffer.from(imageBuffer).toString('base64')}`;


            return NextResponse.json({
                model: "YOLO+LLaMA",
                image: true,
                imageUrl: annotatedImageBase64,
                detectedObjects: result.data[1],// Detection results array
                llm: true,
                oc: true
            });
        }
    
        // Image Generation

        else {
            return NextResponse.json({
                model: "not found",
                llm: true,
            });
        }
    }

    catch (err) {
        console.error("Error processing request:", err);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }

}