import { CHESSBOARD_SIZE } from "./definitions";
import { Chessfield } from "./field";
import { palette } from "./palette";
import { ActivePiece } from "./pieces";

// TODO: throw wird noch nicht gezeichnet, ka warum
export function drawThrow(
    context: CanvasRenderingContext2D,
    r: number,
    c: number,
    cellSize: number,
    lineWidth: number = 2,
): void {
    context.strokeStyle = "#ff0000";
    context.lineWidth = lineWidth;
    context.beginPath();

    const centerX = c * cellSize + cellSize / 2;
    const centerY = r * cellSize + cellSize / 2;

    context.moveTo(centerX - 50, centerY - 50);
    context.lineTo(centerX + 50, centerY + 50);

    context.moveTo(centerX + 50, centerY - 50);
    context.lineTo(centerX - 50, centerY + 50);

    context.stroke();
    context.closePath();
}

export function drawCell(
    context: CanvasRenderingContext2D,
    r: number,
    c: number,
    cellSize: number,
    field: Chessfield,
    activePiece: ActivePiece | null,
    lastMoves: { row: number; col: number }[] = [],
    debug: boolean = false,
    selectedFields: { row: number; col: number }[] = [],
): void {
    const isBlackField = (r + c) % 2 === 0;
    let fillstyle = isBlackField ? palette.dark : palette.light;

    if (activePiece && activePiece.row === r && activePiece.col === c) {
        fillstyle = palette.active;
    }

    if (
        lastMoves.length <= 2 &&
        lastMoves.some((move) => move.row === r && move.col === c)
    ) {
        fillstyle = palette.active;
    }

    if (selectedFields.some((field) => field.row === r && field.col === c)) {
        fillstyle = palette.selected;
    }

    context.fillStyle = fillstyle;
    context.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

    if (debug) {
        context.fillStyle = "rgba(255,255,255,0.5)";
        context.font = "12px sans-serif";
        context.fillText(`${c},${r}`, c * cellSize + 10, r * cellSize + 20);

        context.fillText(
            `${field.letterLabel}${field.numberLabel}`,
            c * cellSize + 10,
            r * cellSize + 35,
        );
    }
}

export function drawCircle(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellSize: number,
    lineWidth: number = 2,
    color: string = "rgba(255,255,255,0.5)",
) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.arc(
        x + cellSize / 2,
        y + cellSize / 2,
        cellSize / 3.5,
        0,
        2 * Math.PI,
    );
    context.stroke();
    context.closePath();
}

export function drawImage(
    context: CanvasRenderingContext2D,
    img: HTMLImageElement,
    mouseX: number,
    mouseY: number,
    cellSize: number,
    activePiece?: ActivePiece | undefined | null,
): void {
    context.drawImage(
        img,
        mouseX - (activePiece?.grabPoint.x || 0),
        mouseY - (activePiece?.grabPoint.y || 0),
        cellSize,
        cellSize,
    );
}

export function drawArrow(
    context: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
): void {
    context.beginPath();
    context.lineWidth = 3;
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.stroke();
    context.closePath();

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headlen = 10; // length of head in pixels
    const dx = headlen * Math.cos(angle);
    const dy = headlen * Math.sin(angle);
    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(toX - dx - dy, toY - dy + dx);
    context.lineTo(toX - dx + dy, toY - dy - dx);
    context.fill();
    context.closePath();
}

export function drawCastleCell(
    context: CanvasRenderingContext2D,
    r: number,
    c: number,
    cellSize: number,
): void {
    context.fillStyle = "rgba(0, 0, 255, 0.5)";
    context.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
}

export function drawVerticalLine(
    context: CanvasRenderingContext2D,
    cellSize: number,
    index: number,
): void {
    if (index === 0) return;
    const grad = context.createLinearGradient(
        index * cellSize,
        0,
        index * cellSize,
        cellSize * CHESSBOARD_SIZE,
    );
    grad.addColorStop(0, "rgba(255 255 255 / 0%)");
    grad.addColorStop(0.3, "rgba(255 255 255 / 80%)");
    grad.addColorStop(0.5, "rgba(255 255 255 / 100%)");
    grad.addColorStop(0.8, "rgba(255 255 255 / 80%)");
    grad.addColorStop(1, "rgba(255 255 255 / 0%)");

    context.strokeStyle = grad;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(index * cellSize, 0);
    context.lineTo(index * cellSize, cellSize * CHESSBOARD_SIZE);
    context.stroke();
}

export function drawHorizontalLine(
    context: CanvasRenderingContext2D,
    cellSize: number,
    index: number,
): void {
    if (index === 0) return;
    const grad = context.createLinearGradient(
        0,
        index * cellSize,
        cellSize * CHESSBOARD_SIZE,
        index * cellSize,
    );
    grad.addColorStop(0, "rgba(255 255 255 / 0%)");
    grad.addColorStop(0.3, "rgba(255 255 255 / 80%)");
    grad.addColorStop(0.5, "rgba(255 255 255 / 100%)");
    grad.addColorStop(0.8, "rgba(255 255 255 / 80%)");
    grad.addColorStop(1, "rgba(255 255 255 / 0%)");

    context.strokeStyle = grad;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, index * cellSize);
    context.lineTo(cellSize * CHESSBOARD_SIZE, index * cellSize);
    context.stroke();
}
