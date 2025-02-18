"use client";

import { createContext, ReactNode, useEffect, useState } from "react";

type AudioType =
    | "capture"
    | "castle"
    | "game-end"
    | "game-start"
    | "illegal"
    | "move-check"
    | "move-opponent"
    | "move-self"
    | "notify"
    | "premove"
    | "promotion";

export type IUseAudioContext = {
    ready: boolean;
};

export const ChessAudioConext = createContext<IUseAudioContext>({
    ready: false,
});

let captureData: AudioBuffer | null = null;
let castleData: AudioBuffer | null = null;
let gameEndData: AudioBuffer | null = null;
let gameStartData: AudioBuffer | null = null;
let illegalData: AudioBuffer | null = null;
let moveCheckData: AudioBuffer | null = null;
let moveOpponentData: AudioBuffer | null = null;
let moveSelfData: AudioBuffer | null = null;
let notifyData: AudioBuffer | null = null;
let premoveData: AudioBuffer | null = null;
let promotionData: AudioBuffer | null = null;
const audioContext = new window.AudioContext();

export function AudioProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);

    async function load() {
        const context = new AudioContext();

        const captureRes = await fetch("/sounds/capture.mp3");
        const castleRes = await fetch("/sounds/castle.webm");
        const gameEndRes = await fetch("/sounds/game-end.webm");
        const gameStartRes = await fetch("/sounds/game-start.webm");
        const illegalRes = await fetch("/sounds/illegal.webm");
        const moveCheckRes = await fetch("/sounds/move-check.webm");
        const moveOpponentRes = await fetch("/sounds/move-opponent.webm");
        const moveSelfRes = await fetch("/sounds/move-self.mp3");
        const notifyRes = await fetch("/sounds/notify.mp3");
        const premoveRes = await fetch("/sounds/premove.webm");
        const promotionRes = await fetch("/sounds/promote.webm");

        const captureArrayBuffer = await captureRes.arrayBuffer();
        const castleArrayBuffer = await castleRes.arrayBuffer();
        const gameEndArrayBuffer = await gameEndRes.arrayBuffer();
        const gameStartArrayBuffer = await gameStartRes.arrayBuffer();
        const illegalArrayBuffer = await illegalRes.arrayBuffer();
        const moveCheckArrayBuffer = await moveCheckRes.arrayBuffer();
        const moveOpponentArrayBuffer = await moveOpponentRes.arrayBuffer();
        const moveSelfArrayBuffer = await moveSelfRes.arrayBuffer();
        const notifyArrayBuffer = await notifyRes.arrayBuffer();
        const premoveArrayBuffer = await premoveRes.arrayBuffer();
        const promotionArrayBuffer = await promotionRes.arrayBuffer();

        const captureData = await context.decodeAudioData(captureArrayBuffer);
        const castleData = await context.decodeAudioData(castleArrayBuffer);
        const gameEndData = await context.decodeAudioData(gameEndArrayBuffer);
        const gameStartData =
            await context.decodeAudioData(gameStartArrayBuffer);
        const illegalData = await context.decodeAudioData(illegalArrayBuffer);
        const moveCheckData =
            await context.decodeAudioData(moveCheckArrayBuffer);
        const moveOpponentData = await context.decodeAudioData(
            moveOpponentArrayBuffer,
        );
        const moveSelfData = await context.decodeAudioData(moveSelfArrayBuffer);
        const notifyData = await context.decodeAudioData(notifyArrayBuffer);
        const premoveData = await context.decodeAudioData(premoveArrayBuffer);
        const promotionData =
            await context.decodeAudioData(promotionArrayBuffer);

        return {
            captureData,
            castleData,
            gameEndData,
            gameStartData,
            illegalData,
            moveCheckData,
            moveOpponentData,
            moveSelfData,
            notifyData,
            premoveData,
            promotionData,
        };
    }

    useEffect(() => {
        let cancel = false;

        load().then((data) => {
            if (cancel) return;

            captureData = data.captureData;
            castleData = data.castleData;
            gameEndData = data.gameEndData;
            gameStartData = data.gameStartData;
            illegalData = data.illegalData;
            moveCheckData = data.moveCheckData;
            moveOpponentData = data.moveOpponentData;
            moveSelfData = data.moveSelfData;
            notifyData = data.notifyData;
            premoveData = data.premoveData;
            promotionData = data.promotionData;

            setReady(true);
        });

        return () => {
            cancel = true;
        };
    }, []);

    return (
        <ChessAudioConext.Provider value={{ ready }}>
            {children}
        </ChessAudioConext.Provider>
    );
}

export function play(type: AudioType): void {
    if (
        !captureData ||
        !castleData ||
        !gameEndData ||
        !gameStartData ||
        !illegalData ||
        !moveCheckData ||
        !moveOpponentData ||
        !moveSelfData ||
        !notifyData ||
        !premoveData ||
        !promotionData
    ) {
        return;
    }

    audioContext.resume();

    const source = audioContext.createBufferSource();
    switch (type) {
        case "capture":
            source.buffer = captureData;
            break;
        case "castle":
            source.buffer = castleData;
            break;
        case "game-end":
            source.buffer = gameEndData;
            break;
        case "game-start":
            source.buffer = gameStartData;
            break;
        case "illegal":
            source.buffer = illegalData;
            break;
        case "move-check":
            source.buffer = moveCheckData;
            break;
        case "move-opponent":
            source.buffer = moveOpponentData;
            break;
        case "move-self":
            source.buffer = moveSelfData;
            break;
        case "notify":
            source.buffer = notifyData;
            break;
        case "premove":
            source.buffer = premoveData;
            break;
        case "promotion":
            source.buffer = promotionData;
            break;
    }
    source.connect(audioContext.destination);
    source.start(0);
}
