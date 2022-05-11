const k_WIDTH_PERCENTAGE = 0.90;


function resizeCanvas(canvas: HTMLCanvasElement, newSizeInPixels: number) {
    if (newSizeInPixels !== undefined) {
        canvas.width = newSizeInPixels;
        canvas.height = newSizeInPixels;
    } else {
        canvas.width = window.innerWidth * k_WIDTH_PERCENTAGE; // room for scrollbar
        canvas.height = window.innerHeight * 0.8;
    }

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

export { resizeCanvas };
