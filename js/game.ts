import { Board, BoardSizing } from "./boardsizing";
interface Dot {
    color: number,
    isSelected: boolean
};

const k_GRID_SIZE = 15;

const selectionColor = "#f7f758";
const numToColor = ["#d73033", "#f98500", '#67f2c5', '#b5df19', '#27e046'];
const k_NUM_COLORS = numToColor.length;

interface CanvasDimensions {
    height: number,
    width: number,
};

class Game {
    ctx: CanvasRenderingContext2D;
    board: Board;

    constructor(canvas: HTMLCanvasElement, dimensions: CanvasDimensions) {
        const ctx: CanvasRenderingContext2D = <CanvasRenderingContext2D>(
            canvas.getContext("2d", { alpha: false })
        );
        this.ctx = ctx;
        const boardSizing = new BoardSizing(k_GRID_SIZE, Math.min(dimensions.height, dimensions.width), true);
        this.board = new Board(k_GRID_SIZE, k_NUM_COLORS, boardSizing);
        console.log(`canvas dimensions: ${JSON.stringify(dimensions)}`);

        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    }

    highlightTouch(changedTouches: Array<Touch>) {
        for(let i = 0; i < changedTouches.length; i++) {
            const touch = changedTouches[i];

            const canvas = touch.target as HTMLCanvasElement;
            const canvasBounds = canvas.getBoundingClientRect();

            const canvasY = touch.pageY - canvasBounds.y;
            const canvasX = touch.pageX - canvasBounds.x;
            const [r, c] = this.board.sizing.cartesianCoordToRowColumn(canvasX, canvasY);
            this.board.get(r, c).isSelected = true;
        }
    }

    handleTouchStart(e: TouchEvent) {
        e.preventDefault();
        console.log(`TouchEventStart. Changed Touches:`);
        this.highlightTouch([...e.changedTouches]);
    }

    handleTouchEnd(e: TouchEvent) {
        e.preventDefault();
        console.log(`TouchEventEnd. Changed Touches:`);
        this.highlightTouch([...e.changedTouches]);
    }

    handleTouchCancel(e: TouchEvent) {
        e.preventDefault();
        console.log(`TouchEventCancel. Changed Touches:`);
        this.highlightTouch([...e.changedTouches]);
    }

    handleTouchMove(e: TouchEvent) {
        e.preventDefault();
        console.log(`TouchEventMove. Changed Touches:`);
        this.highlightTouch([...e.changedTouches]);
    }

    gameLoop(timestamp: number) {
        //console.log(`Gameloop running at ${timestamp}`);
        const ballRadius = this.board.sizing.ballRadius;

        for (const { ball, row, column } of this.board) {
            const [xCoord, yCoord] = this.board.sizing.rowColumnToCartesianCoord(row, column);
            if (ball.isSelected) {
                //console.log(`Dot at ${r}, ${c} is selected`);
                this.ctx.beginPath();
                this.ctx.fillStyle = selectionColor;
                this.ctx.arc(xCoord, yCoord, ballRadius + 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.beginPath();
            this.ctx.fillStyle = numToColor[ball.color];
            this.ctx.arc(xCoord, yCoord, ballRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    run() {
        const cb = (timestamp: number) => {
            this.gameLoop(timestamp);
            window.requestAnimationFrame(cb);
        };
        cb(Date.now());
    }

}

export { Game };
