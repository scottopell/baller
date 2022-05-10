interface CanvasDimensions {
    height: number,
    width: number,
};

type DotCoord = [number, number];
type CartCoord = [number, number];

interface Dot {
    color: number,
    isSelected: boolean
};

interface BoardSpecs {
    numItems: number
    size: number
    hasStandardMargin: boolean
}

class BoardSizing {
    numItems: number
    size: number
    hasStandardMargin: boolean

    constructor(numItems: number, size: number, hasStandardMargin: boolean) {
        this.numItems = numItems;
        this.size = size;
        this.hasStandardMargin = hasStandardMargin;
    }

    get ballBoundingBoxSize() {
        let boxItemCountForCalculations = this.numItems;
        if (this.hasStandardMargin) {
            boxItemCountForCalculations++;
        }

        const boxDimension = Math.floor(this.size / (boxItemCountForCalculations))
        return boxDimension;
    }

    get ballDiameter() {
        return Math.round(this.ballBoundingBoxSize * 0.75);
    }

    get ballRadius() {
        return this.ballDiameter / 2;
    }

    get edgeOffset() {
        if (this.hasStandardMargin) {
            return this.ballBoundingBoxSize / 2;
        }
        return 0;
    }

    cartesianCoordToRowColumn(x: number, y: number): DotCoord {
        console.log(`Tapped on ${x}, ${y}`);
        let rowGuess = Math.floor(y / this.ballBoundingBoxSize);
        let colGuess = Math.floor(x / this.ballBoundingBoxSize);
        return [rowGuess, colGuess];
    }

    rowColumnToCartesianCoord(r: number, c: number): CartCoord {
        const xCoord = this.edgeOffset + (c * this.ballBoundingBoxSize);
        const yCoord = this.edgeOffset + (r * this.ballBoundingBoxSize);
        return [xCoord, yCoord];
    }
}

const k_GRID_SIZE = 15;

const selectionColor = "#f7f758";
const numToColor = ["#d73033", "#f98500", '#67f2c5', '#b5df19', '#27e046'];
const k_NUM_COLORS = numToColor.length;

function logTouch(touch: Touch) {
    console.log(`touch id=${touch.identifier}, x: ${touch.pageX} y: ${touch.pageY}`);
}

class Game {
    ctx: CanvasRenderingContext2D;
    board: Array<Array<Dot>>;
    boardSizing: BoardSizing;


    constructor(canvas: HTMLCanvasElement, dimensions: CanvasDimensions) {
        const ctx: CanvasRenderingContext2D = <CanvasRenderingContext2D>(
            canvas.getContext("2d", { alpha: false })
        );
        this.ctx = ctx;
        this.boardSizing = new BoardSizing(k_GRID_SIZE, Math.min(dimensions.height, dimensions.width), true);
        this.board = [];
        console.log(`canvas dimensions: ${JSON.stringify(dimensions)}`);
        for (let r = 0; r < k_GRID_SIZE; r++) {
            this.board[r] = [];
            for (let c = 0; c < k_GRID_SIZE; c++) {
                this.board[r][c] = {
                    color: Math.round(Math.random() * k_NUM_COLORS),
                    isSelected: false,
                };
            }
        }

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
            const [r, c] = this.boardSizing.cartesianCoordToRowColumn(canvasX, canvasY);
            this.board[r][c].isSelected = true;
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
        const boxDimension = this.boardSizing.ballBoundingBoxSize;
        const ballRadius = this.boardSizing.ballRadius;

        const edgeOffset = this.boardSizing.edgeOffset;
        for (let r = 0; r < k_GRID_SIZE; r++) {
            for (let c = 0; c < k_GRID_SIZE; c++) {
                const dot = this.board[r][c];
                const [xCoord, yCoord] = this.boardSizing.rowColumnToCartesianCoord(r, c);
                if (dot.isSelected) {
                    //console.log(`Dot at ${r}, ${c} is selected`);
                    this.ctx.beginPath();
                    this.ctx.fillStyle = selectionColor;
                    this.ctx.arc(xCoord, yCoord, ballRadius + 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.beginPath();
                this.ctx.fillStyle = numToColor[dot.color];
                this.ctx.arc(xCoord, yCoord, ballRadius, 0, Math.PI * 2);
                this.ctx.fill();
                //console.log(`Drawing circle ${r},${c} at ${xCoord} ${yCoord} with radius ${ballRadius}`);
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

function resizeCanvas(canvas: HTMLCanvasElement) {
    canvas.width = window.innerWidth * 0.98; // room for scrollbar
    canvas.height = window.innerHeight * 0.8;

    const dimensions = scaleCanvas(canvas);
    const ctx: CanvasRenderingContext2D = <CanvasRenderingContext2D>(
        canvas.getContext("2d", { alpha: false })
    );
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return dimensions;
}

function backingScale() {
    if ("devicePixelRatio" in window) {
        if (window.devicePixelRatio > 1) {
            return window.devicePixelRatio;
        }
    }
    return 1;
};

function scaleCanvas(canvas: HTMLCanvasElement) {
    const scaleFactor = backingScale();
    const realWidth = canvas.width;
    const realHeight = canvas.height;
    if (scaleFactor > 1) {
        canvas.width = canvas.width * scaleFactor;
        canvas.height = canvas.height * scaleFactor;
        // update the context for the new canvas scale
        const ctx: CanvasRenderingContext2D = <CanvasRenderingContext2D>(
            canvas.getContext("2d", { alpha: false })
        );
        ctx.scale(scaleFactor, scaleFactor);
        canvas.style.width = realWidth + "px";
        canvas.style.height = realHeight + "px";
    }
    return {
        height: realHeight,
        width: realWidth,
    }
};
document.addEventListener("DOMContentLoaded", () => {
    const element = document.getElementById("canvas");
    if (element) {
        const canvas = element as HTMLCanvasElement;
        const dimensions = resizeCanvas(canvas);
        const game = new Game(canvas, dimensions);
        game.run();
    } else {
        console.error("Couldn't find canvas element");
    }
});
