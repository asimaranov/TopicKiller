import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const args = await req.json()

    const response = await fetch("https://app.topichunter.io/api/getRows", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "getRows",
        args,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch topics")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching topics:", error)
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 })
  }
}

