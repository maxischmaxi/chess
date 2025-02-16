"use client";

import { useEffect, useRef, useState } from "react";
type Props = {
    score: number;
};

export function WinProbability({ score }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState(0);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        function size() {
            setWidth(window.innerWidth);
        }

        size();

        window.addEventListener("resize", size);
        return () => window.removeEventListener("resize", size);
    }, []);

    useEffect(() => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        if (width >= 1024) {
            setSize(rect.height * (1 - score));
        } else {
            setSize(rect.width * score);
        }
    }, [score, width]);

    return (
        <div className="WinProbabilty" ref={ref}>
            <div className="Black" />
            <div className="White" style={{ height: size }} />
        </div>
    );
}
