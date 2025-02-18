"use client";

import { ChessImages, defaultChessImages } from "./definitions";

export let images: ChessImages = defaultChessImages;

let listeners: (() => void)[] = [];

const pieces = ["pawn", "knight", "bishop", "rook", "queen", "king"];
const colors = ["w", "b"];

let imagesToLoad = pieces.length * colors.length;

for (let i = 0; i < pieces.length; i++) {
    for (let x = 0; x < colors.length; x++) {
        const img = new Image();
        img.src = `/pieces/${pieces[i]}-${colors[x]}.svg`;

        img.onload = () => {
            imagesToLoad--;
            const key = `${pieces[i]}-${colors[x]}` as keyof ChessImages;
            images = { ...images, [key]: img };

            if (imagesToLoad === 0) {
                listeners.forEach((l) => l());
            }
        };
    }
}

export function addImagesListener(listener: () => void): void {
    listeners.push(listener);
}

export function removeImagesListener(listener: () => void): void {
    listeners = listeners.filter((l) => l !== listener);
}
