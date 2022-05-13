type DotCoord = [number, number];
type CartCoord = [number, number];

class BoardSizing {
    numItems: number
    boardSizeInPixels: number
    hasStandardMargin: boolean

    constructor(numItems: number, sizeInPixels: number, hasStandardMargin: boolean) {
        this.numItems = numItems;
        this.boardSizeInPixels = sizeInPixels;
        this.hasStandardMargin = hasStandardMargin;
    }

    get ballBoundingBoxSize() {
        let boxItemCountForCalculations = this.numItems;
        if (this.hasStandardMargin) {
            boxItemCountForCalculations++;
        }

        const boxDimension = Math.floor(this.boardSizeInPixels / (boxItemCountForCalculations))
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

export { BoardSizing, DotCoord }
