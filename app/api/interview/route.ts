import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const { question, apiKey, resumeText } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Initialize OpenAI client with user's API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Prepare system message based on whether resume is provided
    let systemMessage = "You are a helpful interview assistant that answers questions quickly and concisely. Keep answers brief but complete, ideally 1-3 sentences unless more detail is absolutely necessary.";
    
    if (resumeText) {
      systemMessage = `You are a helpful interview assistant that answers questions quickly and concisely, tailoring your responses based on the candidate's background. Here is the candidate's resume/CV information to reference:
      
${resumeText.substring(0, 3000)}
      
Keep answers brief but complete, ideally 1-3 sentences unless more detail is absolutely necessary. Personalize your responses based on the resume where relevant.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 250, // Increased for more complete personalized answers
    });

    const answer = completion.choices[0].message.content;
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error.message || 'Failed to process question';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 