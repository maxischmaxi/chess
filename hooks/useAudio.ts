"use client";
import { useEffect, useRef, useState } from "react";

export function useAudio(src: string) {
    const audio = useRef<HTMLAudioElement>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!audio.current) {
            audio.current = new Audio();
            audio.current.src = src;

            audio.current.oncanplay = () => {
                setReady(true);
            };
        }

        return () => {
            if (audio.current) {
                audio.current.oncanplay = null;
            }
        };
    }, [src]);

    return {
        audio: audio.current,
        ready,
    };
}
