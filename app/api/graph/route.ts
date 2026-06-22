import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getGraphData } from "@/lib/neo4j";
import { getInsforgeServerClient } from "@/lib/insforge-server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { insforge } = await getInsforgeServerClient();
    const data = await getGraphData(userId, insforge);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in graph API route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}
