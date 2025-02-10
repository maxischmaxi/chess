import { NextResponse } from "next/server";
import { promises as fs } from "fs";

export async function GET(): Promise<NextResponse | Response> {
    const headers = new Headers();
    headers.set("Content-Type", "application/javascript");
    headers.set("Access-Control-Allow-Methods", "GET");

    try {
        const data = await fs
            .readFile(process.cwd() + "/stockfish.js")
            .then((buffer) => buffer.toString());

        return new NextResponse(data, {
            headers,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json(
            {
                error: error.message,
            },
            { status: 500 },
        );
    }
}
