"use client";

import { createContext, ReactNode, useEffect, useRef, useState } from "react";

export type IUseAudioContext = {
    ready: boolean;
    play(type: "move" | "notify" | "capture"): void;
};

export const ChessAudioConext = createContext<IUseAudioContext>({
    ready: false,
    play() {},
});

export function AudioProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    const audioContext = useRef<AudioContext | null>(null);
    const [moveData, setMoveData] = useState<AudioBuffer | null>(null);
    const [notifyData, setNotifyData] = useState<AudioBuffer | null>(null);
    const [captureData, setCaptureData] = useState<AudioBuffer | null>(null);

    async function load() {
        const context = new AudioContext();
        audioContext.current = context;

        const moveSelfRes = await fetch(
            "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3",
        );
        const notifyRes = await fetch(
            "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/notify.mp3",
        );
        const captureRes = await fetch(
            "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3",
        );

        const moveSelfArrayBuffer = await moveSelfRes.arrayBuffer();
        const notifyArrayBuffer = await notifyRes.arrayBuffer();
        const captureArrayBuffer = await captureRes.arrayBuffer();

        const moveData =
            await audioContext.current.decodeAudioData(moveSelfArrayBuffer);
        const notifyData =
            await audioContext.current.decodeAudioData(notifyArrayBuffer);
        const captureData =
            await audioContext.current.decodeAudioData(captureArrayBuffer);

        return {
            moveData,
            notifyData,
            captureData,
        };
    }

    useEffect(() => {
        let cancel = false;

        load()
            .then((data) => {
                if (cancel) return;

                setMoveData(data.moveData);
                setNotifyData(data.notifyData);
                setCaptureData(data.captureData);
            })
            .catch(() => {
                console.error("Failed to load audio");
            })
            .finally(() => {
                if (cancel) return;

                setReady(true);
            });

        return () => {
            cancel = true;
        };
    }, []);

    function play(type: "move" | "notify" | "capture"): void {
        if (!audioContext.current) return;
        if (!ready) return;

        const source = audioContext.current.createBufferSource();
        source.buffer =
            type === "move"
                ? moveData
                : type === "notify"
                  ? notifyData
                  : captureData;

        source.connect(audioContext.current.destination);
        source.start();
    }

    return (
        <ChessAudioConext.Provider value={{ ready, play }}>
            {children}
        </ChessAudioConext.Provider>
    );
}
