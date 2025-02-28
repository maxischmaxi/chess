import { getFullPieceName, isMouseOverCell } from "./utils";
import {
    ActivePiece,
    Board,
    CHESSBOARD_SIZE,
    ChessImages,
    palette,
} from "./definitions";
import { drawCircle, drawHorizontalLine, drawVerticalLine } from "./drawing";
import { Piece, Move } from "chess.js";
import {
    activePiece,
    boardSize,
    chess,
    getBoard,
    iAm,
    images,
    imagesReady,
    isFocused,
    mouseDown,
    mouseX,
    mouseY,
    selectedFields,
} from "@/components/chessboard";

let shouldStop = false;
let delta = 0;
let lastTimestamp = -1;
let baseCanvas: HTMLCanvasElement | null = null;
let eventCanvas: HTMLCanvasElement | null = null;
let moveCanvas: HTMLCanvasElement | null = null;
let baseContext: CanvasRenderingContext2D | null = null;
let eventContext: CanvasRenderingContext2D | null = null;
let moveContext: CanvasRenderingContext2D | null = null;

function clearCanvases() {
    if (!baseContext) return;
    if (!eventContext) return;
    if (!moveContext) return;

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

function renderPossibleMoves(props: RenderActivePieceParams): void {
    if (!moveContext) return;

    const isKing = props.piece.type === "k";

    if (isKing && props.moves.length === 0) {
        return;
    }

    for (const move of props.moves) {
        if (activePiece?.piece.square !== move.from) {
            continue;
        }

        const to = move.to;
        let toRow;
        let toCol;

        if (iAm === "w") {
            toRow = 8 - parseInt(to[1]);
            toCol = to.charCodeAt(0) - 97;
        } else {
            toRow = parseInt(to[1]) - 1;
            toCol = "h".charCodeAt(0) - to.charCodeAt(0);
        }

        const targetPiece = props.board[toRow][toCol];

        if (!targetPiece) {
            drawCircle(
                moveContext,
                toCol * props.cellSize,
                toRow * props.cellSize,
                props.cellSize,
                3,
            );
        } else {
            let color: string | null = null;
            let size = 3;

            if (activePiece) {
                if (activePiece.piece.color === targetPiece.color) {
                    color = "rgba(255, 255, 255, 0.5)";
                } else {
                    color = "rgba(220, 0, 0, 0.5)";
                    size = 5;
                }
            }

            if (color) {
                drawCircle(
                    moveContext,
                    toCol * props.cellSize,
                    toRow * props.cellSize,
                    props.cellSize,
                    size,
                    color,
                );
            }
        }

        const isOver = isMouseOverCell(
            toRow,
            toCol,
            props.cellSize,
            mouseX,
            mouseY,
        );

        if (isOver) {
            drawCircle(
                moveContext,
                toCol * props.cellSize,
                toRow * props.cellSize,
                props.cellSize,
                5,
            );
        }
    }
}

type RenderActivePieceParams = {
    board: Board;
    piece: Piece;
    cellSize: number;
    moves: Move[];
};

function renderActivePiece(props: RenderActivePieceParams) {
    if (!activePiece) return;

    const key =
        `${getFullPieceName(props.piece.type)}-${props.piece.color}` as keyof ChessImages;

    const image = images[key];
    if (!image) return;

    let x = mouseX;
    let y = mouseY;

    x = x - activePiece.grabPoint.x;
    y = y - activePiece.grabPoint.y;

    if (!eventContext) return;
    renderImage(eventContext, image, x, y, props.cellSize);
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

function prepare() {
    if (!baseCanvas) {
        baseCanvas = document.getElementById(
            "base-canvas",
        ) as HTMLCanvasElement;
    }
    if (!eventCanvas) {
        eventCanvas = document.getElementById(
            "event-canvas",
        ) as HTMLCanvasElement;
    }
    if (!moveCanvas) {
        moveCanvas = document.getElementById(
            "move-canvas",
        ) as HTMLCanvasElement;
    }

    if (!baseCanvas) return;
    if (!eventCanvas) return;
    if (!moveCanvas) return;

    baseCanvas.width = boardSize;
    baseCanvas.height = boardSize;
    eventCanvas.width = boardSize;
    eventCanvas.height = boardSize;
    moveCanvas.width = boardSize;
    moveCanvas.height = boardSize;

    if (!baseContext) {
        baseContext = baseCanvas.getContext("2d");
    }
    if (!eventContext) {
        eventContext = eventCanvas.getContext("2d");
    }
    if (!moveContext) {
        moveContext = moveCanvas.getContext("2d");
    }
}

type DrawCellParams = {
    row: number;
    col: number;
    cellSize: number;
    board: Board;
};

function renderCell(props: DrawCellParams): void {
    if (!baseContext) {
        return;
    }

    const { row, col, cellSize } = props;

    const isBlackField = (row + col) % 2 === 0;
    let fillstyle = isBlackField ? palette.dark : palette.light;

    if (activePiece) {
        if (activePiece.row === row && activePiece.col === col) {
            fillstyle = palette.active;
        }
    }

    if (
        selectedFields.some((field) => field.row === row && field.col === col)
    ) {
        fillstyle = palette.selected;
    }

    baseContext.fillStyle = fillstyle;
    baseContext.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

    baseContext.fillStyle = "rgba(255,255,255,0.5)";
    baseContext.font = "12px sans-serif";

    const field = props.board[row][col];

    if (field === null) {
        let colLabel;
        let rowLabel;

        if (iAm === "w") {
            colLabel = String.fromCharCode("a".charCodeAt(0) + col);
            rowLabel = 8 - row;
        } else {
            colLabel = String.fromCharCode("h".charCodeAt(0) - col);
            rowLabel = row + 1;
        }

        baseContext.fillText(
            `${colLabel}${rowLabel}`,
            col * cellSize + 5,
            row * cellSize + 15,
        );
    } else {
        baseContext.fillText(
            `${field?.square}`,
            col * cellSize + 5,
            row * cellSize + 15,
        );
    }
}

function renderLines(cellSize: number): void {
    if (!baseContext) {
        return;
    }

    for (let i = 0; i < CHESSBOARD_SIZE; i++) {
        drawVerticalLine(baseContext, cellSize, i);
        drawHorizontalLine(baseContext, cellSize, i);
    }
}

export function render(timestamp: number): void {
    if (isFocused) {
        delta = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
    } else {
        if (timestamp - lastTimestamp < 200) {
            requestAnimationFrame(render);
            return;
        }

        delta = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
    }

    if (delta === 0 || !imagesReady) {
        requestAnimationFrame(render);
        return;
    }

    prepare();
    clearCanvases();

    const cellSize = boardSize / CHESSBOARD_SIZE;

    const board = getBoard();

    const moves = chess.moves({ verbose: true });

    for (let r = 0; r < 8; r++) {
        const row = board[r];

        for (let c = 0; c < row.length; c++) {
            const piece = row[c];

            renderCell({
                board,
                row: r,
                col: c,
                cellSize: cellSize,
            });

            if (!piece) continue;

            const isActivePiece =
                activePiece?.row === r && activePiece?.col === c;

            if (activePiece) {
                renderPossibleMoves({
                    board,
                    piece: activePiece.piece,
                    cellSize,
                    moves,
                });
            }

            if (isActivePiece && mouseDown) {
                renderActivePiece({
                    board,
                    piece,
                    cellSize,
                    moves,
                });

                continue;
            }

            const key =
                `${getFullPieceName(piece.type)}-${piece.color}` as keyof ChessImages;
            const image = images[key];

            if (!image) {
                continue;
            }

            if (!moveContext) {
                return;
            }

            renderImage(
                moveContext,
                image,
                c * cellSize,
                r * cellSize,
                cellSize,
            );
        }
    }

    renderLines(cellSize);

    if (!shouldStop) {
        requestAnimationFrame(render);
    }
}

export function init() {
    shouldStop = false;
    requestAnimationFrame(render);
}

export function cleanup() {
    baseCanvas = null;
    eventCanvas = null;
    moveCanvas = null;
    baseContext = null;
    eventContext = null;
    moveContext = null;
    shouldStop = true;
}
