"use client";

import { createContext, ReactNode, useEffect, useRef, useState } from "react";

type AudioType = "move" | "notify" | "capture";

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
    const moveData = useRef<AudioBuffer | null>(null);
    const notifyData = useRef<AudioBuffer | null>(null);
    const captureData = useRef<AudioBuffer | null>(null);
    const buffer = useRef<AudioType[]>([]);

    async function load() {
        const context = new AudioContext();
        audioContext.current = context;

        const moveSelfRes = await fetch("/move-self.mp3");
        const notifyRes = await fetch("/notify.mp3");
        const captureRes = await fetch("/capture.mp3");

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

                moveData.current = data.moveData;
                notifyData.current = data.notifyData;
                captureData.current = data.captureData;
                setReady(true);

                if (audioContext.current) {
                    for (const type of buffer.current) {
                        const source =
                            audioContext.current.createBufferSource();
                        source.buffer =
                            type === "move"
                                ? data.moveData
                                : type === "notify"
                                  ? data.notifyData
                                  : data.captureData;
                        source.connect(audioContext.current.destination);
                        source.start(0);
                    }
                }

                buffer.current = [];
            })
            .catch(() => {
                console.error("Failed to load audio");
            });

        return () => {
            cancel = true;
        };
    }, []);

    function play(type: AudioType): void {
        if (!audioContext.current) {
            buffer.current = [...buffer.current, type];
            console.log("buffering, audio context not ready");
            return;
        }
        if (!ready) {
            buffer.current = [...buffer.current, type];
            console.log("buffering, audio not ready");
            return;
        }

        if (!moveData.current || !notifyData.current || !captureData.current) {
            console.log("error, audio data not ready");
            return;
        }

        console.log("play", type);
        audioContext.current.resume();

        const source = audioContext.current.createBufferSource();
        source.buffer =
            type === "move"
                ? moveData.current
                : type === "notify"
                  ? notifyData.current
                  : captureData.current;
        source.connect(audioContext.current.destination);
        source.start(0);
    }

    return (
        <ChessAudioConext.Provider value={{ ready, play }}>
            {children}
        </ChessAudioConext.Provider>
    );
}
