import { BoardSizing } from "./boardsizing";

const EmptySpotStringVal = "__emptySpot";
type EmptySpot = typeof EmptySpotStringVal;

type SeedRandomInstance = () => number;

// TODO, this and the attempted interface-merge below don't work
type SeedRandomConstructor = {
    new(seed: string): SeedRandomInstance,
}

interface Math {
    seedrandom: SeedRandomConstructor,
}


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
    numBallVariants: number;
    sizing: BoardSizing;
    seededRngs: Array<SeedRandomInstance>

    constructor(gridSize: number, numBallVariants: number, sizing: BoardSizing, seed: string) {
        this.grid = [];
        this.sizing = sizing;
        this.numBallVariants = numBallVariants;
        this.seededRngs = [];
        for (let c = 0; c < gridSize; c++) {
            // @ts-expect-error
            this.seededRngs[c] = new Math.seedrandom(`${seed}-${c}`);
        }
        for (let r = 0; r < gridSize; r++) {
            this.grid[r] = [];
            for (let c = 0; c < gridSize; c++) {
                this.grid[r][c] = new Ball(Math.floor(this.seededRngs[c]() * numBallVariants), false);
            }
        }
    }

    ballFeeder(column: number) {
        return new Ball(Math.floor(this.seededRngs[column]() * this.numBallVariants), false);
    }

    isSquareSelected() {
        const isSelected = (row: number, column: number) => {
            if (row >= this.gridSize || column >= this.gridSize) {
                return false;
            }

            const ball = this.grid[row][column];
            return ball !== Board.EmptySpot && ball.isSelected;
        }

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const ball = this.grid[r][c];
                if (ball !== Board.EmptySpot && ball.isSelected) {
                    if (isSelected(r + 1, c) && isSelected(r, c + 1) && isSelected(r + 1, c + 1)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }


    removeSelectedBalls() {
        let numRemoved = 0;
        for (const { ball, row, column } of this) {
            if (ball !== Board.EmptySpot && ball.isSelected) {
                this.grid[row][column] = Board.EmptySpot;
                numRemoved++;
            }
        }

        return numRemoved;
    }

    selectAllOfColor(color: number) {
        for (const { ball, row, column } of this) {
            if (ball !== Board.EmptySpot && ball.color === color) {
                ball.isSelected = true;
            }
        }
    }

    deselectAllBalls() {
        for (const {ball, row, column} of this) {
            if (ball !== Board.EmptySpot) {
                ball.isSelected = false;
            }
        }
    }

    feedNewBalls() {
        // Currently requires board to only have empty spots at the top
        // ie, call gravitationallyPullDownBalls before calling this function
        for (let c = 0; c < this.gridSize; c++) {
            for (let r = this.gridSize - 1; r >= 0; r--) {
                const ball = this.grid[r][c];
                if (ball === Board.EmptySpot) {
                    // Fill in with random ball from column's ball-feeder
                    const newBall = this.ballFeeder(c);
                    this.grid[r][c] = newBall;
                }
            }
        }
    }

    gravitationallyPullDownBalls() {
        console.log("Pulling balls down to fill empty spots");
        for (let c = 0; c < this.gridSize; c++) {
            let firstEmptyRow = null;
            let numEmpties = 0;
            for (let r = this.gridSize - 1; r >= 0; r--) {
                const ball = this.grid[r][c];
                if (ball === Board.EmptySpot) {
                    // Found an empty spot in this column
                    // Record empty spot, cascade down once we find a ball
                    if (firstEmptyRow !== null) {
                        // more than one empty spot
                        numEmpties++;
                    } else {
                        firstEmptyRow = r;
                        numEmpties = 1;
                    }

                } else {
                    // Found a ball, fill in empty spots
                    if (numEmpties > 0 && firstEmptyRow !== null) {
                        // Cascade these balls down
                        this.grid[firstEmptyRow][c] = ball;
                        this.grid[r][c] = Board.EmptySpot;
                        firstEmptyRow--;
                    }
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

export { Board };
