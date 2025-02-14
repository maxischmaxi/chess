"use client";

import { Piece } from "@/lib/pieces";
import { useImage } from "../hooks/useImage";
import { createContext, useEffect, useState } from "react";

export type IUseImages = {
    ready: boolean;
    bishopB: { image: HTMLImageElement | null; ready: boolean };
    bishopW: { image: HTMLImageElement | null; ready: boolean };
    kingB: { image: HTMLImageElement | null; ready: boolean };
    kingW: { image: HTMLImageElement | null; ready: boolean };
    knightB: { image: HTMLImageElement | null; ready: boolean };
    knightW: { image: HTMLImageElement | null; ready: boolean };
    pawnB: { image: HTMLImageElement | null; ready: boolean };
    pawnW: { image: HTMLImageElement | null; ready: boolean };
    queenB: { image: HTMLImageElement | null; ready: boolean };
    queenW: { image: HTMLImageElement | null; ready: boolean };
    rookB: { image: HTMLImageElement | null; ready: boolean };
    rookW: { image: HTMLImageElement | null; ready: boolean };
};

export const ImagesContext = createContext<IUseImages>({
    ready: false,
    bishopB: { image: null, ready: false },
    bishopW: { image: null, ready: false },
    kingB: { image: null, ready: false },
    kingW: { image: null, ready: false },
    knightB: { image: null, ready: false },
    knightW: { image: null, ready: false },
    pawnB: { image: null, ready: false },
    pawnW: { image: null, ready: false },
    queenB: { image: null, ready: false },
    queenW: { image: null, ready: false },
    rookB: { image: null, ready: false },
    rookW: { image: null, ready: false },
});

export function ImagesProvider({ children }: { children: React.ReactNode }) {
    const bishopB = useImage({ piece: Piece.BlackBishop });
    const bishopW = useImage({ piece: Piece.WhiteBishop });
    const kingB = useImage({ piece: Piece.BlackKing });
    const kingW = useImage({ piece: Piece.WhiteKing });
    const knightB = useImage({ piece: Piece.BlackKnight });
    const knightW = useImage({ piece: Piece.WhiteKnight });
    const pawnB = useImage({ piece: Piece.BlackPawn });
    const pawnW = useImage({ piece: Piece.WhitePawn });
    const queenB = useImage({ piece: Piece.BlackQueen });
    const queenW = useImage({ piece: Piece.WhiteQueen });
    const rookB = useImage({ piece: Piece.BlackRook });
    const rookW = useImage({ piece: Piece.WhiteRook });

    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (
            bishopB.ready &&
            bishopW.ready &&
            kingB.ready &&
            kingW.ready &&
            knightB.ready &&
            knightW.ready &&
            pawnB.ready &&
            pawnW.ready &&
            queenB.ready &&
            queenW.ready &&
            rookB.ready &&
            rookW.ready
        ) {
            setReady(true);
        } else {
            setReady(false);
        }
    }, [
        bishopB.ready,
        bishopW.ready,
        kingB.ready,
        kingW.ready,
        knightB.ready,
        knightW.ready,
        pawnB.ready,
        pawnW.ready,
        queenB.ready,
        queenW.ready,
        rookB.ready,
        rookW.ready,
    ]);

    return (
        <ImagesContext.Provider
            value={{
                ready,
                bishopB,
                bishopW,
                kingB,
                kingW,
                knightB,
                knightW,
                pawnB,
                pawnW,
                queenB,
                queenW,
                rookB,
                rookW,
            }}
        >
            {children}
        </ImagesContext.Provider>
    );
}
