import { api } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
    const { player1, player2, preferredColor } = await req.json();
    if (!player1 || !player2 || !preferredColor) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const id = await api.createGame(player1, player2, preferredColor);
    return NextResponse.json({ gameId: id }, { status: 200 });
}
