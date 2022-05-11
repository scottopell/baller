import { Game } from "./game";
import { resizeCanvas } from "./canvasutils";

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
