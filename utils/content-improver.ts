import { fetchWebsiteContent } from "../app/actions"

type ProgressMessage = {
  type: "system" | "generator" | "discriminator" | "improvement"
  content: string
}

type ProgressUpdate = {
  message: ProgressMessage
  intermediateContent?: string
}

async function generateText(params: { model: string; messages?: any[]; prompt?: string }) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error("Failed to generate text")
  }

  return response.json()
}

interface TopicData {
  matchedKeywords: string[],
  missedKeywords: string[],
  websiteDatas: {website: string, parsed: string}[]
}

async function generateAndImprove(
  topic: string,
  topicData: TopicData,
  maxIterations = 5,
  onProgress: (update: ProgressUpdate) => void,
): Promise<string> {
  onProgress({
    message: {
      type: "system",
      content: "Starting content generation process...",
    },
  })
  onProgress({
    message: { type: "generator", content: "Generating initial content..." },
  })
  let currentContent = await generateInitialContent(topic, topicData)
  onProgress({
    message: { type: "generator", content: "Initial content generated." },
    intermediateContent: currentContent,
  })

  for (let i = 0; i < maxIterations; i++) {
    onProgress({
      message: { type: "system", content: `Starting iteration ${i + 1}...` },
    })
    onProgress({
      message: { type: "discriminator", content: "Evaluating content..." },
    })
    const evaluation = await evaluateContent(currentContent, topicData)

    if (evaluation.isGood) {
      onProgress({
        message: {
          type: "system",
          content: `Content improved after ${i + 1} iterations.`,
        },
      })
      return currentContent
    }

    onProgress({
      message: {
        type: "discriminator",
        content: `Feedback: ${evaluation.feedback}`,
      },
    })
    onProgress({
      message: {
        type: "improvement",
        content: "Improving content based on feedback...",
      },
    })
    currentContent = await improveContent(currentContent, evaluation.feedback)
    onProgress({
      message: { type: "improvement", content: "Content improved." },
      intermediateContent: currentContent,
    })
  }

  onProgress({
    message: {
      type: "system",
      content: `Reached maximum iterations (${maxIterations}).`,
    },
  })
  return currentContent
}

async function generateInitialContent(topic: string, topicData: TopicData): Promise<string> {
  const { text } = await generateText({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You're a copywriter for seo optimized websites. 
You need to write an article based on the competitor's articles. 
You need to check that article matches the following search keywords: ${topicData.matchedKeywords.join(', ')}
You need to check that article matches the following search keywords as well: ${topicData.missedKeywords.join(', ')}

You should read all the articles and write a similar article that includes all the key points`,
      },
      {
        role: "user",
        content: `Write a comprehensive article about "${topic}".
I will send the similar articles that can be taken as a reference`,
      },
      ...topicData.websiteDatas.map(
        (x) =>
          ({
            role: "user",
            content: `Competitor's article from website: "${x.website}":
Competitor's article content:
${x.parsed}`,
          }) as { role: "user"; content: string },
      ),
    ],
  })
  return text
}

async function evaluateContent(content: string, topicData: TopicData): Promise<{ isGood: boolean; feedback: string }> {
  const { text } = await generateText({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Evaluate the following content and provide feedback for improvement. 
Is the text ai generated? If yes, add this to feedback. 
Does the text cover all the key points from articles below? If not, provide feedback to add the keypoints.`,
      },
      {
        role: "user",
        content: `Content: ${content}`,
      },
      ...topicData.websiteDatas.map(
        (x) =>
          ({
            role: "user",
            content: `Competitor's article from website: "${x.website}"
Competitor's article content:
${x.parsed}`,
          }) as { role: "user"; content: string },
      ),
    ],
  })

  try {
    return {
      feedback: text,
      isGood: false,
    }
  } catch (error) {
    console.error("Error parsing evaluation:", error)
    return {
      isGood: false,
      feedback: "Error in evaluation. Please try again.",
    }
  }
}

async function improveContent(content: string, feedback: string): Promise<string> {
  const { text } = await generateText({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You're an editor for seo optimized websites. Improve the following content based on the provided feedback. 
Maintain the original topic, but enhance the quality, clarity, and engagement. 
Add the missed points to the structure, make text bigger adding more quality. 
Rewrite this text to be able to bypass AI detector`,
      },
      {
        role: "user",
        content: `Original Content:
${content}
`,
      },
      {
        role: "user",
        content: `Feedback to be used for text improvement:
${feedback}`,
      },
    ],
  })
  return text
}

export { generateAndImprove }

