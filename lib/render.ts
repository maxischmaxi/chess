import { RefObject } from "react";
import { getFullPieceName, isMouseOverCell } from "./utils";
import {
    ActivePiece,
    Board,
    CHESSBOARD_SIZE,
    ChessImages,
} from "./definitions";
import {
    drawCell,
    drawCircle,
    drawHorizontalLine,
    drawVerticalLine,
} from "./drawing";
import { Chess, Piece, Move } from "chess.js";

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

type RenderMoveCellParams = {
    context: CanvasRenderingContext2D;
    cellSize: number;
    activePiece: ActivePiece | null;
    board: Board;
    row: number;
    col: number;
};

function renderMoveCell({
    context,
    cellSize,
    activePiece,
    board,
    row,
    col,
}: RenderMoveCellParams) {
    const targetPiece = board[row][col];

    if (!targetPiece) {
        drawCircle(context, col * cellSize, row * cellSize, cellSize, 3);
        return;
    }

    let color: string | null = null;
    let size = 3;

    if (activePiece) {
        if (activePiece.piece.color === targetPiece.color) {
            color = "rgba(255, 255, 255, 0.5)";
        } else {
            color = "rgba(255, 0, 0, 0.5)";
            size = 5;
        }
    }

    if (color) {
        drawCircle(
            context,
            col * cellSize,
            row * cellSize,
            cellSize,
            size,
            color,
        );
    }
}

function renderPossibleMoves(props: RenderActivePieceParams): void {
    const isKing = props.piece.type === "k";

    if (isKing && props.moves.length === 0) {
        return;
    }

    for (const move of props.moves) {
        if (props.activePiece?.piece.square !== move.from) {
            continue;
        }

        const to = move.to;
        const toRow = 8 - parseInt(to[1]);
        const toCol = to.charCodeAt(0) - 97;
        const displayRow = !props.flip ? toRow : CHESSBOARD_SIZE - 1 - toRow;
        const displayCol = !props.flip ? toCol : CHESSBOARD_SIZE - 1 - toCol;

        renderMoveCell({
            context: props.moveContext,
            board: props.board,
            cellSize: props.cellSize,
            activePiece: props.activePiece,
            row: displayRow,
            col: displayCol,
        });

        const isOver = isMouseOverCell(
            displayRow,
            displayCol,
            props.cellSize,
            props.mouseX,
            props.mouseY,
        );

        if (isOver) {
            const targetRow = 8 - parseInt(move.to[1]);
            const targetCol = move.to.charCodeAt(0) - 97;

            const displayRow = !props.flip
                ? targetRow
                : CHESSBOARD_SIZE - 1 - targetRow;
            const displayCol = !props.flip
                ? targetCol
                : CHESSBOARD_SIZE - 1 - targetCol;

            drawCircle(
                props.moveContext,
                displayCol * props.cellSize,
                displayRow * props.cellSize,
                props.cellSize,
                5,
            );
        }
    }
}

type RenderActivePieceParams = {
    board: Board;
    eventContext: CanvasRenderingContext2D;
    moveContext: CanvasRenderingContext2D;
    piece: Piece;
    cellSize: number;
    activePiece: ActivePiece | null;
    mouseX: number;
    mouseY: number;
    images: ChessImages;
    moves: Move[];
    iAm: "w" | "b";
    flip: boolean;
};

function renderActivePiece(props: RenderActivePieceParams) {
    if (!props.activePiece) return;

    renderPossibleMoves(props);

    const key =
        `${getFullPieceName(props.piece.type)}-${props.piece.color}` as keyof ChessImages;

    const image = props.images[key];
    if (!image) return;

    let x = props.mouseX;
    let y = props.mouseY;

    x = x - props.activePiece.grabPoint.x;
    y = y - props.activePiece.grabPoint.y;

    renderImage(props.eventContext, image, x, y, props.cellSize);
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

export function render(
    chess: Chess,
    images: ChessImages,
    baseCanvas: RefObject<HTMLCanvasElement | null>,
    eventCanvas: RefObject<HTMLCanvasElement | null>,
    moveCanvas: RefObject<HTMLCanvasElement | null>,
    boardSize: number,
    activePiece: ActivePiece | null,
    mouseX: number,
    mouseY: number,
    selectedFields: { row: number; col: number }[],
    iAm: "w" | "b",
    flipped: boolean,
) {
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
    const flip = iAm === "b" || flipped;

    const board = chess.board();
    const moves = chess.moves({ verbose: true });

    for (let r = 0; r < 8; r++) {
        const row = board[r];

        for (let c = 0; c < row.length; c++) {
            const piece = row[c];

            const displayRow = !flip ? r : CHESSBOARD_SIZE - 1 - r;
            const displayCol = !flip ? c : CHESSBOARD_SIZE - 1 - c;

            drawCell({
                context: baseContext,
                board,
                row: r,
                col: c,
                cellSize: cellSize,
                activePiece: activePiece,
                selectedFields: selectedFields,
                flip,
            });

            if (!piece) continue;

            const isActivePiece =
                activePiece?.row === r && activePiece?.col === c;

            if (isActivePiece) {
                renderActivePiece({
                    board,
                    eventContext,
                    moveContext,
                    piece,
                    cellSize,
                    activePiece,
                    mouseX,
                    mouseY,
                    images,
                    moves,
                    iAm,
                    flip,
                });

                continue;
            }

            const key =
                `${getFullPieceName(piece.type)}-${piece.color}` as keyof ChessImages;
            const image = images[key];

            if (!image) {
                continue;
            }

            renderImage(
                moveContext,
                image,
                displayCol * cellSize,
                displayRow * cellSize,
                cellSize,
            );
        }
    }

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
