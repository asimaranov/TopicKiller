import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: NextRequest) {
  try {
    const { model, messages, prompt } = await req.json()

    console.log('Messages', messages);

    const result = await generateText({
      model: openai(model),
      messages,
      prompt,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error generating text:", error)
    return NextResponse.json({ error: "Failed to generate text" }, { status: 500 })
  }
}

