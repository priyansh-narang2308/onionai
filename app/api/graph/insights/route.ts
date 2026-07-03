/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { getGraphInsights } from "@/lib/neo4j";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { insforge } = await getInsforgeServerClient();
    const insights = await getGraphInsights(userId, insforge);

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error("Error fetching Neo4j Graph Insights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch graph insights" },
      { status: 500 },
    );
  }
}
