/*
 * camera.js - Camera access utility
 * Author: Jake See
 * License: GPL v3
 * https://www.gnu.org/licenses/gpl-3.0.html
 */

class Camera {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.stream = null;
    }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.videoElement.srcObject = this.stream;
            this.videoElement.play();
        } catch (err) {
            throw new Error('Camera access denied or not available.');
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.videoElement.srcObject = null;
            this.stream = null;
        }
    }
}

// Usage example:
// const cam = new Camera(document.querySelector('video'));
// cam.start();
// cam.stop();
