import { getDownloadUrl } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(
    req: NextRequest,
): Promise<NextResponse | Response> {
    const url = new URL(req.url);
    if (url.pathname.endsWith("stockfish.js")) {
        const url = getDownloadUrl(
            "stockfish-BA9jx8uIypUFln1fuORbezRAxgrZpu.js",
        );
        return await fetch(url);
    }

    if (url.pathname.endsWith("stockfish.wasm")) {
        const url = getDownloadUrl(
            "stockfish-hEAs6R6rd0zNAPGWzV7jvNjVcUNIdx.wasm",
        );
        return await fetch(url);
    }

    return NextResponse.next();
}
