type DotCoord = [number, number];
type CartCoord = [number, number];


const EmptySpotStringVal = "__emptySpot";
type EmptySpot = typeof EmptySpotStringVal;

class Ball {
    color: number;
    isSelected: boolean;

    constructor(color: number, isSelected: boolean) {
        this.color = color;
        this.isSelected = isSelected;
    }
}

class Board {
    static EmptySpot: EmptySpot = EmptySpotStringVal;

    grid: Array<Array<Ball | EmptySpot>>;
    sizing: BoardSizing;

    constructor(gridSize: number, numBallVariants: number, sizing: BoardSizing) {
        this.grid = [];
        this.sizing = sizing;
        for (let r = 0; r < gridSize; r++) {
            this.grid[r] = [];
            for (let c = 0; c < gridSize; c++) {
                this.grid[r][c] = new Ball(Math.floor(Math.random() * numBallVariants), false);
            }
        }
    }

    removeSelectedBalls() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const ball = this.grid[r][c];
                if (ball !== Board.EmptySpot && ball.isSelected) {
                    this.grid[r][c] = Board.EmptySpot;
                }
            }
        }
    }

    get gridSize() {
        return this.grid.length;
    }

    get(row: number, column: number) {
        return this.grid[row][column];
    }

    [Symbol.iterator]() {
        let r = 0;
        let c = -1;
        const grid = this.grid;
        const gridSize = this.gridSize;
        return {
            next(): IteratorResult<{ball: Ball | EmptySpot, row: number, column: number}> {
                if (c === gridSize - 1) {
                    c = 0;
                    r++;
                } else {
                    c++
                }

                if (r === gridSize) {
                    return { value: null, done: true };
                } else {
                    return { value: { ball: grid[r][c], row: r, column: c }, done: false };
                }
            }
        };
    }

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

    cartesianCoordToRowColumn(x: number, y: number): DotCoord | null {
        let rowGuess = Math.floor(y / this.ballBoundingBoxSize);
        let colGuess = Math.floor(x / this.ballBoundingBoxSize);
        if (rowGuess < 0 || rowGuess >= this.numItems || colGuess < 0 || colGuess >= this.numItems) {
            return null;
        }
        return [rowGuess, colGuess];
    }

    rowColumnToCartesianCoord(r: number, c: number): CartCoord {
        const xCoord = this.edgeOffset + (c * this.ballBoundingBoxSize);
        const yCoord = this.edgeOffset + (r * this.ballBoundingBoxSize);
        return [xCoord, yCoord];
    }
}

export { Board, BoardSizing }
