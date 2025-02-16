"use client";

import { createContext, ReactNode, useEffect, useRef, useState } from "react";

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
    play(type: AudioType): void;
};

export const ChessAudioConext = createContext<IUseAudioContext>({
    ready: false,
    play() {},
});

export function AudioProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    const audioContext = useRef<AudioContext | null>(null);

    const captureData = useRef<AudioBuffer | null>(null);
    const castleData = useRef<AudioBuffer | null>(null);
    const gameEndData = useRef<AudioBuffer | null>(null);
    const gameStartData = useRef<AudioBuffer | null>(null);
    const illegalData = useRef<AudioBuffer | null>(null);
    const moveCheckData = useRef<AudioBuffer | null>(null);
    const moveOpponentData = useRef<AudioBuffer | null>(null);
    const moveSelfData = useRef<AudioBuffer | null>(null);
    const notifyData = useRef<AudioBuffer | null>(null);
    const premoveData = useRef<AudioBuffer | null>(null);
    const promotionData = useRef<AudioBuffer | null>(null);

    async function load() {
        const context = new AudioContext();
        audioContext.current = context;

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

            captureData.current = data.captureData;
            castleData.current = data.castleData;
            gameEndData.current = data.gameEndData;
            gameStartData.current = data.gameStartData;
            illegalData.current = data.illegalData;
            moveCheckData.current = data.moveCheckData;
            moveOpponentData.current = data.moveOpponentData;
            moveSelfData.current = data.moveSelfData;
            notifyData.current = data.notifyData;
            premoveData.current = data.premoveData;
            promotionData.current = data.promotionData;

            setReady(true);
        });

        return () => {
            cancel = true;
        };
    }, []);

    function play(type: AudioType): void {
        if (!audioContext.current) {
            return;
        }
        if (!ready) {
            return;
        }

        if (
            !moveSelfData.current ||
            !notifyData.current ||
            !captureData.current
        ) {
            return;
        }

        audioContext.current.resume();

        const source = audioContext.current.createBufferSource();
        switch (type) {
            case "capture":
                source.buffer = captureData.current;
                break;
            case "castle":
                source.buffer = castleData.current;
                break;
            case "game-end":
                source.buffer = gameEndData.current;
                break;
            case "game-start":
                source.buffer = gameStartData.current;
                break;
            case "illegal":
                source.buffer = illegalData.current;
                break;
            case "move-check":
                source.buffer = moveCheckData.current;
                break;
            case "move-opponent":
                source.buffer = moveOpponentData.current;
                break;
            case "move-self":
                source.buffer = moveSelfData.current;
                break;
            case "notify":
                source.buffer = notifyData.current;
                break;
            case "premove":
                source.buffer = premoveData.current;
                break;
            case "promotion":
                source.buffer = promotionData.current;
                break;
        }
        source.connect(audioContext.current.destination);
        source.start(0);
    }

    return (
        <ChessAudioConext.Provider value={{ ready, play }}>
            {children}
        </ChessAudioConext.Provider>
    );
}
