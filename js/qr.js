/*
 * qr.js - QR code reading utility
 * Author: Jake See
 * License: GPL v3
 * https://www.gnu.org/licenses/gpl-3.0.html
 */

// This script uses a pure JS QR code reader (jsQR)
// You must include jsQR library in your HTML for this to work
// https://github.com/cozmo/jsQR

class QRReader {
    constructor(videoElement, canvasElement) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.context = canvasElement.getContext('2d');
        this.active = false;
    }

    start(onResult) {
        this.active = true;
        const scan = () => {
            if (!this.active) return;
            this.context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
            const imageData = this.context.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
                onResult(code.data);
                this.stop();
            } else {
                requestAnimationFrame(scan);
            }
        };
        scan();
    }

    stop() {
        this.active = false;
    }
}

// Usage example:
// const qr = new QRReader(videoElem, canvasElem);
// qr.start(result => { console.log(result); });
// qr.stop();
