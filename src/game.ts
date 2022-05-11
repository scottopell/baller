import { Board, BoardSizing } from "./boardsizing";
interface Dot {
    color: number,
    isSelected: boolean
};

const k_GRID_SIZE = 15;

const selectionColor = "#f7f758";
const numToColor = ["#d73033", "#f98500", '#420ed2', '#df19ae', '#27e046'];
const k_NUM_COLORS = numToColor.length;

interface CanvasDimensions {
    height: number,
    width: number,
};

interface ActiveTouch {
    touchId: number,
    startRC: [number, number],
    tailRC: [number, number],
}

class Game {
    ctx: CanvasRenderingContext2D;
    board: Board;
    activeTouch: ActiveTouch | null;
    currentTouches: Map<number, ActiveTouch>;

    constructor(canvas: HTMLCanvasElement, dimensions: CanvasDimensions) {
        console.log(`canvas dimensions: ${JSON.stringify(dimensions)}`);
        const ctx: CanvasRenderingContext2D = <CanvasRenderingContext2D>(
            canvas.getContext("2d", { alpha: false })
        );
        this.ctx = ctx;

        const boardSizing = new BoardSizing(k_GRID_SIZE, Math.min(dimensions.height, dimensions.width), true);
        this.board = new Board(k_GRID_SIZE, k_NUM_COLORS, boardSizing);

        this.currentTouches = new Map();
        this.activeTouch = null;

        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    }

    collapse() {
    }

    highlightTouch(changedTouches: Array<Touch>, eventType: "start" | "move" | "end" | "cancel") {
        const touchToRC = (touch: Touch) => {
            const canvas = touch.target as HTMLCanvasElement;
            const canvasBounds = canvas.getBoundingClientRect();

            const canvasY = touch.pageY - canvasBounds.y;
            const canvasX = touch.pageX - canvasBounds.x;

            return this.board.sizing.cartesianCoordToRowColumn(canvasX, canvasY);
        };

        const isImmediateNeighbor = (pointOne: [number, number], pointTwo: [number, number]) => {
            const [r1, c1] = pointOne;
            const [r2, c2] = pointTwo;

            const rowDistance = Math.abs(r1 - r2);
            const colDistance = Math.abs(c1 - c2);

            return rowDistance === 1 && colDistance === 0 || colDistance === 1 && rowDistance === 0;
        };

        for(let i = 0; i < changedTouches.length; i++) {
            const touch = changedTouches[i];
            if (eventType === "start") {
                if (this.activeTouch !== null) {
                    // Have an existing activeTouch, but this is a start touch,
                    // so there must be a second finger
                    console.log("Got start event, but had previously active touch. Must be second finger");
                    continue;
                }

                // New Touch
                const rowColumnCoord = touchToRC(touch);
                if (rowColumnCoord === null) {
                    // Out of bounds, no valid ball at coordinate
                    continue;
                }
                const [r, c] = rowColumnCoord;
                console.log(`Start. r ${r} c ${c}`);
                this.activeTouch = {
                    touchId: touch.identifier,
                    startRC: [r, c],
                    tailRC: [r, c],
                };
                const currentBall = this.board.get(r, c);
                currentBall.isSelected = true;
            } else if (eventType === "move") {
                if (this.activeTouch === null) {
                    console.error("Got move event but there was no active touch, wtf");
                    continue;
                }
                if (this.activeTouch.touchId !== touch.identifier) {
                    // This is a second touch that has moved, not the active one, ignore it
                    console.log("Got move event, but for a non-active touch. Ignoring.");
                    continue;
                }
                // Continuation of existing touch
                const [ tailRow, tailColumn ] = this.activeTouch.tailRC;
                const tailBall = this.board.get(tailRow, tailColumn);
                const rowColumnCoord = touchToRC(touch);
                if (rowColumnCoord === null) {
                    // Out of bounds, no valid ball at coordinate
                    continue;
                }
                const [r, c] = rowColumnCoord;
                const currentBall = this.board.get(r, c);
                console.log(`Move.\n\tTailR: ${tailRow} TailC: ${tailColumn} TailColor: ${tailBall.color}\n\tr: ${r} c: ${c} color: ${currentBall.color}`);

                if (currentBall.isSelected) {
                    // No backtracking on path selections
                    continue;
                }

                // if currentball is one to left/right/down/up
                // and currentball is same color

                if (tailBall.color !== currentBall.color) {
                    // Invalid move, not going to record anything;
                    console.log(`Current is diff color from tail, continuing...`);
                    continue;
                }
                if (isImmediateNeighbor([tailRow, tailColumn], [r, c])) {
                    currentBall.isSelected = true;
                    this.activeTouch.tailRC = [r, c];
                } else {
                    console.log(`Current is not immediate neighbor, continueing...`);
                }
            } else if (eventType === "end") {
                if (this.activeTouch === null) {
                    console.error("Got end event, but there was no active touch. Nothing to do.");
                    continue;
                }
                this.collapse();
                this.activeTouch = null;
            } else if (eventType === "cancel") {
                console.log("Cancelled touch");
                this.activeTouch = null;
            }
            console.log(`After touch. activeTouch is ${this.activeTouch !== null ? "not" : ""} null.`);
            if (this.activeTouch !== null) {
                console.log(`After touch. tailR ${this.activeTouch.tailRC[0]} tailC ${this.activeTouch.tailRC[1]}`);
            }
        }

    }

    handleTouchStart(e: TouchEvent) {
        e.preventDefault();
        this.highlightTouch([...e.changedTouches], "start");
    }

    handleTouchEnd(e: TouchEvent) {
        e.preventDefault();
        this.highlightTouch([...e.changedTouches], "end");
    }

    handleTouchCancel(e: TouchEvent) {
        e.preventDefault();
        this.highlightTouch([...e.changedTouches], "cancel");
    }

    handleTouchMove(e: TouchEvent) {
        e.preventDefault();
        this.highlightTouch([...e.changedTouches], "move");
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