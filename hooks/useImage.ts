import { Piece } from "@/lib/pieces";
import { getPieceImage } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type Props = {
    piece: Piece;
};

export function useImage({ piece }: Props) {
    const image = useRef<HTMLImageElement>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!image.current) {
            image.current = new Image();
            image.current.src = getPieceImage(piece);

            image.current.onload = () => {
                setReady(true);
            };
        }

        return () => {
            if (image.current) {
                image.current.onload = null;
            }
        };
    }, [piece]);

    return { image: image.current, ready };
}
