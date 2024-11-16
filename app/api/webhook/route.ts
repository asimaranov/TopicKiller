import clientPromise from "@/app/lib/mongodb";

export async function POST(request: Request) {
  const data = await request.json();

  if (!clientPromise) {
    return Response.json({
      status: "no-db",
    });
  }

  const { segments, session_id } = data;

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const sessionInfo = await db.collection("conversations").findOne({sessionId: session_id});

  let conversations = sessionInfo ? [sessionInfo.conversation] : [];

  for (const segment of segments) {
    const text = segment.text;
    const speaker = segment.speaker;
    const speakerId = segment.speaker_id;
    const isUser = segment.is_user;
    const personId = segment.person_id;
    const start = segment.start;
    const end = segment.end;
    conversations.push(text);
  }

  await db.collection("conversations").findOneAndUpdate(
    { sessionId: session_id },
    {
      $set: {
        conversation: conversations.join(" "),
      },
    },
    {
      upsert: true,
    }
  );

  return Response.json({
    status: "ok",
  });
}

export async function GET(request: Request) {
  return Response.json({
    status: "ok",
    webhook: "true"
  });
}