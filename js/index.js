/*
 * index.js - UI logic for main page
 * Author: Jake See
 * License: GPL v3
 * https://www.gnu.org/licenses/gpl-3.0.html
 */

$.ready(() => {
    const scanWidget = $('#scanWidget');
    const qrVideo = $('#qrVideo');
    const qrCanvas = $('#qrCanvas');
    const qrFrame = $('#qrFrame');
    const inputText = $('#inputText');
    const inputX = $('#inputX');
    const inputY = $('#inputY');
    const submitBtn = $('#submitBtn');
    const resultDiv = $('#result');
    const inputParts = $('#inputParts');
    const reconstructBtn = $('#reconstructBtn');
    const reconstructResult = $('#reconstructResult');

    // Error message div is now in index.html at design time
    const errorMsg = $('#inputErrorMsg');

    $.click(submitBtn, () => {
        errorMsg.style.display = 'none';
        resultDiv.innerHTML = '';
        const data = inputText.value.trim();
        const x = parseInt(inputX.value, 10);
        const y = parseInt(inputY.value, 10);

        // Validation
        if (!data) {
            errorMsg.textContent = 'Please enter some data.';
            errorMsg.style.display = 'block';
            inputText.focus();
            return;
        }
        if (isNaN(x) || x < 2) {
            errorMsg.textContent = 'x must be at least 2.';
            errorMsg.style.display = 'block';
            inputX.focus();
            return;
        }
        if (isNaN(y) || y < 2) {
            errorMsg.textContent = 'y must be at least 2.';
            errorMsg.style.display = 'block';
            inputY.focus();
            return;
        }
        if (x > y) {
            errorMsg.textContent = 'x cannot be greater than y.';
            errorMsg.style.display = 'block';
            inputX.focus();
            return;
        }
        // Use window.secrets
        try {
            const hexSecret = secrets.str2hex(data);
            const parts = secrets.share(hexSecret, y, x);
            let html = `<div class="app-result__title">Split Result:</div>`;
            html += `<div class="app-result__desc" style="margin-bottom:0.5em;color:#555;font-size:1em;">Below are your secret parts. Safekeep each hex string securely.</div>`;
            html += '<div class="app-result__parts">';
            parts.forEach((part, idx) => {
                html += `
                <div class="app-result__part-row" style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:1em;background:#f5f5f5;border-radius:6px;cursor:pointer;" data-part="${part}" tabindex="0" aria-label="Copy part ${idx+1}">
                    <div class="app-result__part-text" style="flex:1;word-break:break-all;padding:1em 0.5em;">
                        <span class="app-result__label">Part ${idx+1}:</span> <span class="app-result__value">${part}</span>
                    </div>
                    <div class="app-result__part-qr" style="margin-left:1em;padding:0.5em 1em 0.5em 0;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(part)}" alt="QR code for part ${idx+1}" style="width:80px;height:80px;" />
                    </div>
                </div>`;
            });
            html += '</div>';
            resultDiv.innerHTML = html;
            // Add click-to-copy for each part row
            const partRows = $$('.app-result__part-row', resultDiv);
            partRows.forEach(row => {
                row.addEventListener('click', function() {
                    const part = this.getAttribute('data-part');
                    $.copyToClipboard(part, () => {
                        this.style.background = '#d0ffd6';
                        setTimeout(() => { this.style.background = '#f5f5f5'; }, 700);
                    });
                });
                row.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.click();
                    }
                });
            });
        } catch (err) {
            errorMsg.textContent = 'Error: ' + err.message;
            errorMsg.style.display = 'block';
        }
    });
    // Inline error for each part
    const partErrorDiv = document.createElement('div');
    partErrorDiv.className = 'app-error';
    partErrorDiv.setAttribute('role', 'alert');
    partErrorDiv.style.display = 'none'; // Only display toggled, all other styles in CSS
    inputParts.parentNode.insertBefore(partErrorDiv, inputParts);

    function validatePartsInput() {
        partErrorDiv.style.display = 'none';
        reconstructResult.innerHTML = '';
        const lines = inputParts.value.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        if (lines.length === 0) return;
        let errorMsg = '';
        lines.forEach((part, idx) => {
            try {
                secrets.processShare(part);
            } catch (err) {
                errorMsg += `Line ${idx+1}: ${err.message}<br>`;
            }
        });
        if (errorMsg) {
            partErrorDiv.innerHTML = errorMsg;
            partErrorDiv.style.display = 'block';
        }
    }

    inputParts.addEventListener('input', validatePartsInput);
    inputParts.addEventListener('change', validatePartsInput);

    reconstructBtn.addEventListener('click', () => {
        reconstructResult.innerHTML = '';
        const lines = inputParts.value.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        if (lines.length < 2) {
            reconstructResult.innerHTML = '<div class="app-error" role="alert">Please enter at least 2 hex parts.</div>';
            inputParts.focus();
            return;
        }
        // Validate all parts before combining
        let errorMsg = '';
        lines.forEach((part, idx) => {
            try {
                secrets.processShare(part);
            } catch (err) {
                errorMsg += `Line ${idx+1}: ${err.message}<br>`;
            }
        });
        if (errorMsg) {
            reconstructResult.innerHTML = `<div class="app-error" role="alert">${errorMsg}</div>`;
            return;
        }
        try {
            const data = secrets.hex2str(secrets.combine(lines));
            reconstructResult.innerHTML = `<div class="app-result__title">Reconstructed Secret:</div><div class="app-result__value">${data}</div>`;
        } catch (err) {
            console.log('[Debug] Reconstruction error:', err);
            reconstructResult.innerHTML = `<div class="app-error" role="alert">Error: ${err.message}</div>`;
        }
    });
    // Camera & QR scan logic
    const activateCameraBtn = $('#activateCameraBtn');
    const cameraContainer = $('#cameraContainer');
    const scanResult = $('#scanResult');
    let videoElem, canvasElem, cameraStream, scanActive = false, scanAnimationId;

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        if (videoElem) {
            videoElem.pause();
            videoElem.srcObject = null;
        }
        // Hide scan widget (hides all child elements)
        $.hide(scanWidget);
        scanActive = false;
        if (scanAnimationId) cancelAnimationFrame(scanAnimationId);
    }

    function scanFrame() {
        if (!scanActive || !videoElem || videoElem.readyState !== videoElem.HAVE_ENOUGH_DATA) {
            scanAnimationId = requestAnimationFrame(scanFrame);
            return;
        }
        canvasElem.width = videoElem.videoWidth;
        canvasElem.height = videoElem.videoHeight;
        const ctx = canvasElem.getContext('2d');
        ctx.drawImage(videoElem, 0, 0, canvasElem.width, canvasElem.height);
        const imageData = ctx.getImageData(0, 0, canvasElem.width, canvasElem.height);
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
            scanResult.innerHTML = `<span style='color:green;'>QR code detected:</span> <span style='font-weight:bold;'>${code.data}</span>`;
            // Append to #inputParts as a new line
            if (inputParts.value.length > 0 && !inputParts.value.endsWith('\n')) {
                inputParts.value += '\n';
            }
            inputParts.value += code.data + '\n';
            validatePartsInput();
            // Turn QR frame green for 2 seconds
            const qrFrame = cameraContainer.querySelector('.qr-frame');
            if (qrFrame) qrFrame.classList.add('qr-frame--active');
            scanActive = false;
            setTimeout(() => {
                scanResult.innerHTML = '';
                if (qrFrame) qrFrame.classList.remove('qr-frame--active');
                scanActive = true;
                scanAnimationId = requestAnimationFrame(scanFrame);
            }, 2000);
        } else {
            scanResult.innerHTML = '<span style="color:#888;">Scanning for QR code...</span>';
            scanAnimationId = requestAnimationFrame(scanFrame);
        }
    }

    let cameraActive = false;
    $.click(activateCameraBtn, async () => {
        if (!cameraActive) {
            stopCamera();
            scanResult.innerHTML = '';
            // Show scan widget (shows all child elements)
            $.show(scanWidget);
            qrFrame.classList.remove('qr-frame--active');
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                qrVideo.srcObject = cameraStream;
                await qrVideo.play();
                videoElem = qrVideo;
                canvasElem = qrCanvas;
                scanActive = true;
                cameraActive = true;
                activateCameraBtn.textContent = 'Stop Camera';
                scanFrame();
            } catch (err) {
                scanResult.innerHTML = `<span style='color:red;'>Camera error: ${err.message}</span>`;
                stopCamera();
                cameraActive = false;
                activateCameraBtn.textContent = 'Activate Camera & Scan QR';
            }
        } else {
            stopCamera();
            cameraActive = false;
            activateCameraBtn.textContent = 'Activate Camera & Scan QR';
        }
    });
    // Attach click listener for unit tests
    $.click('#runTestsBtn', () => {
        const runUnitTestsFn = window.runUnitTests || runUnitTests;
        const testResults = $('#testResults');
        if (typeof runUnitTestsFn === 'function') {
            const results = runUnitTestsFn();
            testResults.innerHTML = '';
            results.forEach((test, idx) => {
                const testDiv = document.createElement('div');
                testDiv.className = test.status === 'PASS' ? 'test-pass' : (test.status === 'FAIL' ? 'test-fail' : 'test-info');
                const titleDiv = document.createElement('div');
                titleDiv.className = 'test-title';
                titleDiv.setAttribute('tabindex', '0');
                const titleText = document.createElement('span');
                titleText.textContent = `${test.title}: ${test.status}`;
                const arrowSpan = document.createElement('span');
                arrowSpan.className = 'test-arrow';
                arrowSpan.innerHTML = (test.status === 'FAIL') ? '&#x25BC;' : '&#x25B2;';
                arrowSpan.style.marginLeft = '8px';
                const debugDiv = document.createElement('div');
                debugDiv.className = 'test-debug';
                debugDiv.style.display = (test.status === 'FAIL') ? 'block' : 'none';
                debugDiv.innerHTML = test.debug.map(d => `<div>${d}</div>`).join('');
                titleDiv.onclick = () => {
                    if (debugDiv.style.display === 'none') {
                        debugDiv.style.display = 'block';
                        arrowSpan.innerHTML = '&#x25BC;';
                    } else {
                        debugDiv.style.display = 'none';
                        arrowSpan.innerHTML = '&#x25B2;';
                    }
                };
                titleDiv.appendChild(titleText);
                if (test.debug.length > 0) {
                    titleDiv.appendChild(arrowSpan);
                }
                testDiv.appendChild(titleDiv);
                testDiv.appendChild(debugDiv);
                testResults.appendChild(testDiv);
            });
        } else {
            testResults.innerHTML = '<div class="test-fail">Unit test function not found.</div>';
        }
    });
});
