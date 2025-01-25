"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { convert } from "html-to-text"

export async function generateContent(topic: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Generate a short article about the following topic: ${topic}. The article should be informative and engaging, suitable for a general audience.`,
    })
    return { content: text, error: null }
  } catch (error) {
    console.error("Error generating content:", error)
    return { content: null, error: "Failed to generate content. Please try again." }
  }
}

export async function fetchWebsiteContent(url: string) {
  try {
    const response = await fetch(url)
    const html = await response.text()
    return convert(html, {
      wordwrap: 130,
    })
  } catch (error) {
    console.error("Error fetching website content:", error)
    return ""
  }
}

