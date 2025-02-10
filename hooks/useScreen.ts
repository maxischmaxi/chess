"use client";

import { useEffect, useState } from "react";

export function useScreen() {
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        function size() {
            if (typeof window === undefined) {
                return;
            }

            setWidth(window.innerWidth);
            setHeight(window.innerHeight);
        }

        size();

        if (typeof window === undefined) {
            return;
        }

        window.addEventListener("resize", size);

        return () => {
            if (typeof window === undefined) {
                return;
            }

            window.removeEventListener("resize", size);
        };
    }, []);

    return {
        width,
        height,
    };
}
