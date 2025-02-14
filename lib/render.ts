import { IUseAudioContext } from "@/components/audio-provider";
import { RefObject } from "react";
import {
    createChessboard,
    getImageByPiece,
    getPieceColor,
    isMouseOverCell,
} from "./utils";
import { CHESSBOARD_SIZE } from "./definitions";
import {
    drawCell,
    drawCircle,
    drawHorizontalLine,
    drawImage,
    drawVerticalLine,
} from "./drawing";
import { Chessfield, Move } from "./field";
import { ActivePiece, Piece } from "./pieces";
import { getPossibleMoves } from "./moves";
import { IUseImages } from "@/components/useImages";

function clearCanvases(
    baseContext: CanvasRenderingContext2D,
    eventContext: CanvasRenderingContext2D,
    moveContext: CanvasRenderingContext2D,
) {
    baseContext.clearRect(
        0,
        0,
        baseContext.canvas.width,
        baseContext.canvas.height,
    );
    eventContext.clearRect(
        0,
        0,
        eventContext.canvas.width,
        eventContext.canvas.height,
    );
    moveContext.clearRect(
        0,
        0,
        moveContext.canvas.width,
        moveContext.canvas.height,
    );
}

function getLastMove(
    fens: string[],
    fenIndex: number,
): { row: number; col: number }[] | undefined {
    if (fenIndex === 0) return;

    const prevMoveFen = fens[fenIndex - 1];
    const currentFen = fens[fenIndex];

    if (!prevMoveFen) return undefined;
    if (!currentFen) return undefined;

    const movedPieces = [];

    const prevBoard = createChessboard(prevMoveFen);
    const currentBoard = createChessboard(currentFen);

    for (let row = 0; row < CHESSBOARD_SIZE; row++) {
        for (let col = 0; col < CHESSBOARD_SIZE; col++) {
            if (prevBoard[row][col].piece !== currentBoard[row][col].piece) {
                movedPieces.push({ row, col });
            }
        }
    }

    return movedPieces;
}

function renderStaticPiece(
    context: CanvasRenderingContext2D,
    piece: Piece,
    row: number,
    col: number,
    cellSize: number,
    images: IUseImages,
) {
    const image = getImageByPiece(piece, images);
    drawImage(context, image!, col * cellSize, row * cellSize, cellSize);
}

function renderMoveCell(
    context: CanvasRenderingContext2D,
    row: number,
    col: number,
    cellSize: number,
    fields: Chessfield[][],
    activePiece: ActivePiece | null,
) {
    const targetPiece = fields[row][col].piece;
    if (!targetPiece) {
        drawCircle(context, col * cellSize, row * cellSize, cellSize, 3);
        return;
    }

    if (activePiece) {
        const activePieceColor = getPieceColor(activePiece.piece);
        const targetPieceColor = getPieceColor(targetPiece);

        if (activePieceColor === targetPieceColor) {
            drawCircle(context, col * cellSize, row * cellSize, cellSize, 3);
        } else {
            drawCircle(
                context,
                col * cellSize,
                row * cellSize,
                cellSize,
                5,
                "rgba(255,0,0,0.5)",
            );
        }
    }
}

function renderPossibleMoves(
    context: CanvasRenderingContext2D,
    piece: Piece,
    row: number,
    col: number,
    cellSize: number,
    fields: Chessfield[][],
    fens: string[],
    activePiece: ActivePiece | null,
    mouseX: number,
    mouseY: number,
): Move | false {
    const possibleMoves = getPossibleMoves(piece, row, col, fields, fens);

    if (
        piece === Piece.BlackKing ||
        (piece === Piece.WhiteKing && possibleMoves.length === 0)
    ) {
        return false;
    }

    let nearest: Move = { targetRow: -1, targetCol: -1 };

    for (const { targetRow, targetCol } of possibleMoves) {
        renderMoveCell(
            context,
            targetRow,
            targetCol,
            cellSize,
            fields,
            activePiece,
        );

        if (isMouseOverCell(targetRow, targetCol, cellSize, mouseX, mouseY)) {
            nearest = { targetRow, targetCol };
        }
    }

    return nearest;
}

function renderActivePiece(
    eventContext: CanvasRenderingContext2D,
    moveContext: CanvasRenderingContext2D,
    piece: Piece,
    row: number,
    col: number,
    cellSize: number,
    fields: Chessfield[][],
    fens: string[],
    activePiece: ActivePiece | null,
    mouseX: number,
    mouseY: number,
    images: IUseImages,
) {
    const nearest = renderPossibleMoves(
        moveContext,
        piece,
        row,
        col,
        cellSize,
        fields,
        fens,
        activePiece,
        mouseX,
        mouseY,
    );

    if (nearest === false) {
        return;
    }

    if (nearest.targetRow !== -1 && nearest.targetCol !== -1) {
        drawCircle(
            moveContext,
            nearest.targetCol * cellSize,
            nearest.targetRow * cellSize,
            cellSize,
            5,
        );
    }

    const image = getImageByPiece(piece, images);
    drawImage(eventContext, image!, mouseX, mouseY, cellSize, activePiece);
}

function renderCell(
    baseContext: CanvasRenderingContext2D,
    eventContext: CanvasRenderingContext2D,
    moveContext: CanvasRenderingContext2D,
    row: number,
    col: number,
    cellSize: number,
    lastMoves: { row: number; col: number }[] | undefined,
    fields: Chessfield[][],
    fens: string[],
    activePiece: ActivePiece | null,
    mouseX: number,
    mouseY: number,
    images: IUseImages,
    selectedFields: { row: number; col: number }[],
) {
    const piece = fields[row][col].piece;

    drawCell(
        baseContext,
        row,
        col,
        cellSize,
        fields[row][col],
        activePiece,
        lastMoves,
        true,
        selectedFields,
    );

    if (!piece) return;

    const isActivePiece = activePiece?.row === row && activePiece?.col === col;

    if (isActivePiece) {
        renderActivePiece(
            eventContext,
            moveContext,
            piece,
            row,
            col,
            cellSize,
            fields,
            fens,
            activePiece,
            mouseX,
            mouseY,
            images,
        );
    } else {
        renderStaticPiece(eventContext, piece, row, col, cellSize, images);
    }
}

function renderBoard(
    baseContext: CanvasRenderingContext2D,
    eventContext: CanvasRenderingContext2D,
    moveContext: CanvasRenderingContext2D,
    cellSize: number,
    fields: Chessfield[][],
    fens: string[],
    fenIndex: number,
    activePiece: ActivePiece | null,
    mouseX: number,
    mouseY: number,
    images: IUseImages,
    selectedFields: { row: number; col: number }[],
) {
    const lastMoves = getLastMove(fens, fenIndex);

    for (let row = 0; row < CHESSBOARD_SIZE; row++) {
        for (let col = 0; col < CHESSBOARD_SIZE; col++) {
            renderCell(
                baseContext,
                eventContext,
                moveContext,
                row,
                col,
                cellSize,
                lastMoves,
                fields,
                fens,
                activePiece,
                mouseX,
                mouseY,
                images,
                selectedFields,
            );
        }
    }
}

export function render(
    stockfishReady: boolean,
    images: IUseImages,
    audio: IUseAudioContext,
    baseCanvas: RefObject<HTMLCanvasElement | null>,
    eventCanvas: RefObject<HTMLCanvasElement | null>,
    moveCanvas: RefObject<HTMLCanvasElement | null>,
    boardSize: number,
    fens: string[],
    fenIndex: number,
    activePiece: ActivePiece | null,
    mouseX: number,
    mouseY: number,
    selectedFields: { row: number; col: number }[],
) {
    if (!stockfishReady) return;
    if (!images.ready) return;
    if (!audio.ready) return;
    if (!baseCanvas.current) return;
    if (!eventCanvas.current) return;
    if (!moveCanvas.current) return;

    baseCanvas.current.width = boardSize;
    baseCanvas.current.height = boardSize;
    eventCanvas.current.width = boardSize;
    eventCanvas.current.height = boardSize;
    moveCanvas.current.width = boardSize;
    moveCanvas.current.height = boardSize;
    const baseContext = baseCanvas.current.getContext("2d");
    const eventContext = eventCanvas.current.getContext("2d");
    const moveContext = moveCanvas.current.getContext("2d");

    if (!baseContext) return;
    if (!eventContext) return;
    if (!moveContext) return;

    const cellSize = boardSize / CHESSBOARD_SIZE;
    clearCanvases(baseContext, eventContext, moveContext);
    renderBoard(
        baseContext,
        eventContext,
        moveContext,
        cellSize,
        createChessboard(fens[fenIndex]),
        fens,
        fenIndex,
        activePiece,
        mouseX,
        mouseY,
        images,
        selectedFields,
    );
    renderLines(baseContext, cellSize);
}

function renderLines(
    context: CanvasRenderingContext2D,
    cellSize: number,
): void {
    for (let i = 0; i < CHESSBOARD_SIZE; i++) {
        drawVerticalLine(context, cellSize, i);
        drawHorizontalLine(context, cellSize, i);
    }
}
