"use client";

import { useEffect, useRef, useState } from "react";
type Props = {
    score: number;
};

export function WinProbability({ score }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (!ref.current) return;
        const rectHeight = ref.current.getBoundingClientRect().height;
        setHeight(rectHeight * (1 - score));
    }, [score]);

    return (
        <div className="WinProbabilty" ref={ref}>
            <div className="Black" />
            <div className="Height" style={{ height }} />
        </div>
    );
}
