import { BoardSizing } from "./boardsizing";
import { Board } from "./board";

const k_GRID_SIZE = 15;

const selectionColor = "#f7f758";
const emptyBallColor = "#4e4e4e";
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

        const touchEventHandler = (e: TouchEvent) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                this.handleTouch(touch, e.type);
            }
        };
        canvas.addEventListener('touchstart', touchEventHandler);
        canvas.addEventListener('touchend', touchEventHandler);
        canvas.addEventListener('touchcancel', touchEventHandler);
        canvas.addEventListener('touchmove', touchEventHandler);
    }

    collapse() {
        /*
         * Idea is to
         * 1. remove balls with 'isSelected' === true
         * 2. Now there are empty spaces in the board
         * 3. "gravity" should pull down any balls above the empty spaces to fill in
         * 4. new balls should be fed in from a ball-feeder
         *
         */
        this.board.removeSelectedBalls();
    }

    handleTouch(touch: Touch, eventType: string) {
        if (eventType === "touchstart") {
            this.handleStartTouch(touch);
        } else if (eventType === "touchmove") {
            this.handleMoveTouch(touch);
        } else if (eventType === "touchend") {
            this.handleEndTouch(touch);
        } else if (eventType === "touchcancel") {
            this.handleCancelTouch(touch);
        } else {
            throw new Error("Unknown touch type");
        }
        console.log(`Processed touch ${touch.identifier}. activeTouch is now ${this.activeTouch !== null ? "not" : ""} null.`);
        if (this.activeTouch !== null) {
            console.log(`After touch. tailR ${this.activeTouch.tailRC[0]} tailC ${this.activeTouch.tailRC[1]}`);
        }
    }

    _touchToRC(touch: Touch) {
        const canvas = touch.target as HTMLCanvasElement;
        const canvasBounds = canvas.getBoundingClientRect();

        const canvasY = touch.pageY - canvasBounds.y;
        const canvasX = touch.pageX - canvasBounds.x;

        return this.board.sizing.cartesianCoordToRowColumn(canvasX, canvasY);
    };

    handleStartTouch(touch: Touch) {
        if (this.activeTouch !== null) {
            // Have an existing activeTouch, but this is a start touch,
            // so there must be a second finger
            console.log("Got start event, but had previously active touch. Must be second finger");
            return;
        }

        // New Touch
        const rowColumnCoord = this._touchToRC(touch);
        if (rowColumnCoord === null) {
            // Out of bounds, no valid ball at coordinate
            return;
        }
        const [r, c] = rowColumnCoord;
        console.log(`Start. r ${r} c ${c}`);
        this.activeTouch = {
            touchId: touch.identifier,
            startRC: [r, c],
            tailRC: [r, c],
        };
        const currentBall = this.board.get(r, c);
        if (currentBall !== Board.EmptySpot) {
            currentBall.isSelected = true;
        }
    }

    handleMoveTouch(touch: Touch) {
        const isImmediateNeighbor = (pointOne: [number, number], pointTwo: [number, number]) => {
            const [r1, c1] = pointOne;
            const [r2, c2] = pointTwo;

            const rowDistance = Math.abs(r1 - r2);
            const colDistance = Math.abs(c1 - c2);

            return rowDistance === 1 && colDistance === 0 || colDistance === 1 && rowDistance === 0;
        };

        if (this.activeTouch === null) {
            console.error("Got move event but there was no active touch, wtf");
            return;
        }
        if (this.activeTouch.touchId !== touch.identifier) {
            // This is a second touch that has moved, not the active one, ignore it
            console.log("Got move event, but for a non-active touch. Ignoring.");
            return;
        }
        // Continuation of existing touch
        const [ tailRow, tailColumn ] = this.activeTouch.tailRC;
        const tailBall = this.board.get(tailRow, tailColumn);
        if (tailBall === Board.EmptySpot) {
            throw new Error("Somehow tail ball is an empty spot!");
        }

        const rowColumnCoord = this._touchToRC(touch);
        if (rowColumnCoord === null) {
            // Out of bounds, no valid ball at coordinate
            return;
        }
        const [r, c] = rowColumnCoord;
        const currentBall = this.board.get(r, c);
        if (currentBall === Board.EmptySpot) {
            return;
        }

        console.log(`Move.\n\tTailR: ${tailRow} TailC: ${tailColumn} TailColor: ${tailBall.color}\n\tr: ${r} c: ${c} color: ${currentBall.color}`);

        if (currentBall.isSelected) {
            // No backtracking on path selections
            return;
        }

        if (tailBall.color !== currentBall.color) {
            // Invalid move, not going to record anything;
            console.log(`Current is diff color from tail, continuing...`);
            return;
        }
        if (isImmediateNeighbor([tailRow, tailColumn], [r, c])) {
            currentBall.isSelected = true;
            this.activeTouch.tailRC = [r, c];
        } else {
            console.log(`Current is not immediate neighbor, continueing...`);
        }
    }

    handleEndTouch(touch: Touch) {
        if (this.activeTouch === null) {
            // This can happen if the corresponding "start" event is out-of-bounds
            console.error("Got end event, but there was no active touch. Nothing to do.");
            return;
        }
        this.collapse();
        this.activeTouch = null;
    }

    handleCancelTouch(touch: Touch) {
        console.log("Cancelled touch");
        this.activeTouch = null;
    }

    gameLoop(timestamp: number) {
        this.ctx.clearRect(0, 0, this.board.sizing.size, this.board.sizing.size);
        //console.log(`Gameloop running at ${timestamp}`);
        const ballRadius = this.board.sizing.ballRadius;

        for (const { ball, row, column } of this.board) {
            const [xCoord, yCoord] = this.board.sizing.rowColumnToCartesianCoord(row, column);
            if (ball === Board.EmptySpot) {
                //console.log(`Dot at ${r}, ${c} is selected`);
                this.ctx.beginPath();
                this.ctx.strokeStyle = emptyBallColor;
                this.ctx.arc(xCoord, yCoord, ballRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            } else {
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
