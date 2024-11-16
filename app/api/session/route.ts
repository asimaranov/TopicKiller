import clientPromise from "@/app/lib/mongodb";

export async function GET(request: Request) {

  if (!clientPromise) {
    return Response.json({
      status: "no-db",
    });
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const session = await db.collection("conversations").findOne({});

  return Response.json({
    session
  });
}