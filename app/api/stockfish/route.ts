import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse | Response> {
    // const res = await fetch(
    //     "https://wbqdeab3flejhx14.public.blob.vercel-storage.com/stockfish-hEAs6R6rd0zNAPGWzV7jvNjVcUNIdx.wasm",
    // );
    const res = await fetch(
        "https://wbqdeab3flejhx14.public.blob.vercel-storage.com/stockfish-BA9jx8uIypUFln1fuORbezRAxgrZpu.js",
    );

    const headers = new Headers();
    headers.set("Content-Type", "application/javascript");
    // headers.set("Content-Type", "application/wasm");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET");

    const data = await res.text();
    // const data = await res.arrayBuffer();

    return new NextResponse(data, {
        headers,
    });

    // return new Response(data, {
    //     status: res.status,
    //     statusText: res.statusText,
    //     headers,
    // });
}
