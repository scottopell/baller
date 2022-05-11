import { Game } from "./game";


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
        const d = new Date();
        const seed = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const game = new Game(canvas, dimensions, seed);
        game.run();
    } else {
        console.error("Couldn't find canvas element");
    }
});
