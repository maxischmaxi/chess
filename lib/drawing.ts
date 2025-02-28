import { mouseX, mouseY } from "@/components/chessboard";
import { CHESSBOARD_SIZE } from "./definitions";

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

function getGrad(
    index: number,
    context: CanvasRenderingContext2D,
    cellSize: number,
    align: "vertical" | "horizontal" = "horizontal",
) {
    let grad;
    if (align === "horizontal") {
        grad = context.createLinearGradient(
            0,
            index * cellSize,
            cellSize * CHESSBOARD_SIZE,
            index * cellSize,
        );
    } else {
        grad = context.createLinearGradient(
            index * cellSize,
            0,
            index * cellSize,
            cellSize * CHESSBOARD_SIZE,
        );
    }

    if (align === "horizontal") {
        const canvasWidth = context.canvas.width;
        let mousePercent = (mouseX / canvasWidth) * 100;
        mousePercent = Math.min(100, Math.max(0, mousePercent)) / 100;

        grad.addColorStop(mousePercent, `rgba(242 205 205 / 100%)`);

        let i = 0;
        while (i < mousePercent) {
            grad.addColorStop(
                i / 100,
                `rgba(242 205 205 / ${Math.abs(i - mousePercent) * 0.8}%)`,
            );
            i += 0.1;
        }

        i = 1;
        while (i < mousePercent) {
            grad.addColorStop(
                (mousePercent + i) / 100,
                `rgba(242 205 205 / ${Math.abs(i - mousePercent) * 0.8}%)`,
            );
            i -= 0.1;
        }
    } else {
        const canvasHeight = context.canvas.height;
        let mousePercent = (mouseY / canvasHeight) * 100;
        mousePercent = Math.min(100, Math.max(0, mousePercent)) / 100;

        grad.addColorStop(mousePercent, `rgba(242 205 205 / 100%)`);

        let i = 0;
        while (i < mousePercent) {
            grad.addColorStop(
                i / 100,
                `rgba(242 205 205 / ${Math.abs(i - mousePercent) * 0.8}%)`,
            );
            i += 0.1;
        }

        i = 1;
        while (i < mousePercent) {
            grad.addColorStop(
                (mousePercent + i) / 100,
                `rgba(242 205 205 / ${Math.abs(i - mousePercent) * 0.8}%)`,
            );
            i -= 0.1;
        }
    }

    return grad;
}

export function drawVerticalLine(
    context: CanvasRenderingContext2D,
    cellSize: number,
    index: number,
): void {
    if (index === 0) return;
    context.strokeStyle = getGrad(index, context, cellSize, "vertical");
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
    context.strokeStyle = getGrad(index, context, cellSize, "horizontal");
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, index * cellSize);
    context.lineTo(cellSize * CHESSBOARD_SIZE, index * cellSize);
    context.stroke();
}
