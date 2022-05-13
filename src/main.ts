import { Game } from "./game";
import { resizeCanvas } from "./canvasutils";

document.addEventListener("DOMContentLoaded", () => {
    let element = document.getElementById("canvas");
    if (!element) {
        throw new Error("Couldn't find canvas element");
    }
    const canvas = element as HTMLCanvasElement;
    const dimensions = resizeCanvas(canvas, undefined);
    const d = new Date();
    const seed = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let game = new Game(canvas, dimensions, seed);
    game.run();

    const newGameBtn = document.getElementById("newGameBtn");
    if (!newGameBtn) {
        throw new Error("No new game btn found");
    }
    const seedElement = document.getElementById("gameSeedInput");
    if (!seedElement) {
        throw new Error("No game seed input found");
    }

    newGameBtn.addEventListener("click", (e) => {
        e.preventDefault();
        let seed = (seedElement as HTMLInputElement).value;
        if (seed.trim().length === 0) {
            seed = Math.random().toString();
        }

        game.stop();

        game = new Game(canvas, dimensions, seed);
        game.run();
    });
});

