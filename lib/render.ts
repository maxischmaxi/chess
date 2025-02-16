import { IUseAudioContext } from "@/components/audio-provider";
import { RefObject } from "react";
import {
    createChessboard,
    getImageByPiece,
    getPieceColor,
    isMouseOverCell,
} from "./utils";
import {
    ActivePiece,
    CHESSBOARD_SIZE,
    Chessfield,
    Move,
    Piece,
} from "./definitions";
import {
    drawCell,
    drawCircle,
    drawHorizontalLine,
    drawVerticalLine,
} from "./drawing";
import { IUseImages } from "@/components/images-provider";

export function clear(
    baseCanvas: RefObject<HTMLCanvasElement | null>,
    eventCanvas: RefObject<HTMLCanvasElement | null>,
    moveCanvas: RefObject<HTMLCanvasElement | null>,
): void {
    if (!baseCanvas.current) return;
    if (!eventCanvas.current) return;
    if (!moveCanvas.current) return;

    const baseContext = baseCanvas.current.getContext("2d");
    const eventContext = eventCanvas.current.getContext("2d");
    const moveContext = moveCanvas.current.getContext("2d");

    if (!baseContext) return;
    if (!eventContext) return;
    if (!moveContext) return;

    clearCanvases(baseContext, eventContext, moveContext);
}

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
    renderImage(context, image!, col * cellSize, row * cellSize, cellSize);
}

function renderMoveCell(
    context: CanvasRenderingContext2D,
    row: number,
    col: number,
    cellSize: number,
    fields: Chessfield[][],
    activePiece: ActivePiece | null,
    iAm: "w" | "b",
    flipped: boolean,
) {
    const flip = iAm === "b" || flipped;
    const displayRow = !flip ? row : CHESSBOARD_SIZE - 1 - row;
    const displayCol = !flip ? col : CHESSBOARD_SIZE - 1 - col;

    const targetPiece = fields[row][col].piece;

    if (!targetPiece) {
        drawCircle(
            context,
            displayCol * cellSize,
            displayRow * cellSize,
            cellSize,
            3,
        );
        return;
    }

    if (activePiece) {
        const activePieceColor = getPieceColor(activePiece.piece);
        const targetPieceColor = getPieceColor(targetPiece);

        if (activePieceColor === targetPieceColor) {
            drawCircle(
                context,
                displayCol * cellSize,
                displayRow * cellSize,
                cellSize,
                3,
            );
        } else {
            drawCircle(
                context,
                displayCol * cellSize,
                displayRow * cellSize,
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
    cellSize: number,
    fields: Chessfield[][],
    activePiece: ActivePiece | null,
    mouseX: number,
    mouseY: number,
    possibleMoves: string[],
    iAm: "w" | "b",
    flipped: boolean,
): Move | false {
    const isKing = piece === Piece.BlackKing || piece === Piece.WhiteKing;

    if (isKing && possibleMoves.length === 0) {
        return false;
    }

    let nearest: Move = { targetRow: -1, targetCol: -1 };

    for (const move of possibleMoves) {
        const fromCol = move.charCodeAt(0) - 97;
        const fromRow = 8 - parseInt(move[1]);

        if (activePiece?.row !== fromRow || activePiece?.col !== fromCol) {
            continue;
        }

        const toCol = move.charCodeAt(2) - 97;
        const toRow = 8 - parseInt(move[3]);

        renderMoveCell(
            context,
            toRow,
            toCol,
            cellSize,
            fields,
            activePiece,
            iAm,
            flipped,
        );

        const flip = iAm === "b" || flipped;
        const displayRow = !flip ? toRow : CHESSBOARD_SIZE - 1 - toRow;
        const displayCol = !flip ? toCol : CHESSBOARD_SIZE - 1 - toCol;

        if (isMouseOverCell(displayRow, displayCol, cellSize, mouseX, mouseY)) {
            nearest = { targetRow: toRow, targetCol: toCol };
        }
    }

    return nearest;
}

function renderActivePiece(
    eventContext: CanvasRenderingContext2D,
    moveContext: CanvasRenderingContext2D,
    piece: Piece,
    cellSize: number,
    fields: Chessfield[][],
    activePiece: ActivePiece | null,
    mouseX: number,
    mouseY: number,
    images: IUseImages,
    possibleMoves: string[],
    iAm: "w" | "b",
    flipped: boolean,
) {
    const nearest = renderPossibleMoves(
        moveContext,
        piece,
        cellSize,
        fields,
        activePiece,
        mouseX,
        mouseY,
        possibleMoves,
        iAm,
        flipped,
    );

    if (
        nearest !== false &&
        nearest.targetRow !== -1 &&
        nearest.targetCol !== -1
    ) {
        const flip = iAm === "b" || flipped;
        const displayRow = !flip
            ? nearest.targetRow
            : CHESSBOARD_SIZE - 1 - nearest.targetRow;
        const displayCol = !flip
            ? nearest.targetCol
            : CHESSBOARD_SIZE - 1 - nearest.targetCol;

        drawCircle(
            moveContext,
            displayCol * cellSize,
            displayRow * cellSize,
            cellSize,
            5,
        );
    }

    const image = getImageByPiece(piece, images);
    renderImage(eventContext, image!, mouseX, mouseY, cellSize);
}

function renderImage(
    context: CanvasRenderingContext2D,
    img: HTMLImageElement,
    mouseX: number,
    mouseY: number,
    cellSize: number,
    activePiece?: ActivePiece | undefined | null,
): void {
    let x = mouseX;
    let y = mouseY;

    if (activePiece) {
        x -= activePiece.grabPoint.x;
        y -= activePiece.grabPoint.y;
    }

    context.drawImage(img, x, y, cellSize, cellSize);
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
    activePiece: ActivePiece | null,
    mouseX: number,
    mouseY: number,
    images: IUseImages,
    selectedFields: { row: number; col: number }[],
    possibleMoves: string[],
    iAm: "w" | "b",
    flipped: boolean,
) {
    const piece = fields[row][col].piece;
    const flip = iAm === "b" || flipped;
    const displayRow = !flip ? row : CHESSBOARD_SIZE - 1 - row;
    const displayCol = !flip ? col : CHESSBOARD_SIZE - 1 - col;

    drawCell(
        baseContext,
        displayRow,
        displayCol,
        cellSize,
        fields[row][col],
        activePiece,
        lastMoves,
        true,
        selectedFields,
        iAm,
        flipped,
    );

    if (!piece) return;

    const isActivePiece = activePiece?.row === row && activePiece?.col === col;

    if (isActivePiece) {
        renderActivePiece(
            eventContext,
            moveContext,
            piece,
            cellSize,
            fields,
            activePiece,
            mouseX,
            mouseY,
            images,
            possibleMoves,
            iAm,
            flipped,
        );
    } else {
        renderStaticPiece(
            baseContext,
            piece,
            displayRow,
            displayCol,
            cellSize,
            images,
        );
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
    iAm: "w" | "b",
    possibleMoves: string[],
    flipped: boolean,
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
                activePiece,
                mouseX,
                mouseY,
                images,
                selectedFields,
                possibleMoves,
                iAm,
                flipped,
            );
        }
    }
}

export function render(
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
    iAm: "w" | "b",
    possibleMoves: string[],
    flipped: boolean,
) {
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
        iAm,
        possibleMoves,
        flipped,
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
