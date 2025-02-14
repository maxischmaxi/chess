"use client";

import { RefObject, useEffect, useState } from "react";

export function useSize(ref: RefObject<HTMLElement | null>) {
    const [rect, setRect] = useState<DOMRectReadOnly>({
        width: 0,
        bottom: 0,
        toJSON: () => "",
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        x: 0,
        y: 0,
    });

    useEffect(() => {
        function size() {
            if (ref.current) {
                setRect(ref.current.getBoundingClientRect());
            }
        }

        size();

        window.addEventListener("resize", size);
        window.addEventListener("load", size);
        window.addEventListener("scroll", size);
        window.addEventListener("orientationchange", size);

        return () => {
            window.removeEventListener("resize", size);
            window.removeEventListener("load", size);
            window.removeEventListener("scroll", size);
            window.removeEventListener("orientationchange", size);
        };
    }, [ref]);

    return rect;
}
