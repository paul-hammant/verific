/*
    Copyright (C) 2025, Paul Hammant

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// Camera and UI Elements
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const startCameraBtn = document.getElementById('startCamera');
const captureBtn = document.getElementById('captureBtn');
const stopCameraBtn = document.getElementById('stopCamera');
const statusIndicator = document.getElementById('statusIndicator');
const progressBar = document.getElementById('progressBar');

// Build timestamp easter egg
const BUILD_TIMESTAMP = '2025-10-25T16:45:43.080Z';
const appTitle = document.getElementById('appTitle');
const buildTimestamp = document.getElementById('buildTimestamp');

appTitle.style.cursor = 'pointer';
appTitle.addEventListener('click', () => {
    // Format timestamp to be human-friendly and local
    const date = new Date(BUILD_TIMESTAMP);
    const formatted = date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    buildTimestamp.textContent = `Build: ${formatted}`;
    buildTimestamp.style.display = 'block';
    setTimeout(() => {
        buildTimestamp.style.display = 'none';
    }, 2000);
});

// Result Elements
const textResult = document.getElementById('textResult');
const croppedImage = document.getElementById('croppedImage');
const extractedText = document.getElementById('extractedText');
const normalizedText = document.getElementById('normalizedText');
const hashResult = document.getElementById('hashResult');
const hashValue = document.getElementById('hashValue');
const copyHashBtn = document.getElementById('copyHash');
const verificationResult = document.getElementById('verificationResult');
const verificationStatus = document.getElementById('verificationStatus');
const verificationUrl = document.getElementById('verificationUrl');
// Capture info elements (for user-facing diagnostics)
const captureInfo = document.getElementById('captureInfo');
const captureMethodEl = document.getElementById('captureMethod');
const captureResolutionEl = document.getElementById('captureResolution');

let stream = null;
let deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };

// Debug console for mobile
const debugConsole = document.getElementById('debugConsole');
const debugLogs = [];
function debugLog(msg) {
    const timestamp = new Date().toLocaleTimeString();
    debugLogs.push(`${timestamp}: ${msg}`);
    if (debugLogs.length > 10) debugLogs.shift();
    debugConsole.textContent = debugLogs.join('\n');
    debugConsole.style.display = 'block';
    console.log(msg); // Also log to real console
}

async function startStreamWithConstraintsSequence() {
    const attempts = [
        {
            label: '4K',
            constraints: {
                video: {
                    facingMode: { exact: 'environment' },
                    width: { exact: 3840 },
                    height: { exact: 2160 },
                    frameRate: { ideal: 30, max: 60 }
                }
            }
        },
        {
            label: '1080p',
            constraints: {
                video: {
                    facingMode: { exact: 'environment' },
                    width: { exact: 1920 },
                    height: { exact: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                }
            }
        },
        {
            label: '720p',
            constraints: {
                video: {
                    facingMode: { exact: 'environment' },
                    width: { exact: 1280 },
                    height: { exact: 720 },
                    frameRate: { ideal: 30, max: 60 }
                }
            }
        }
    ];

    let lastError = null;
    for (const attempt of attempts) {
        try {
            console.log(`Requesting camera at ${attempt.label}...`);
            const s = await navigator.mediaDevices.getUserMedia(attempt.constraints);
            return s;
        } catch (e) {
            console.warn(`Failed ${attempt.label} constraints`, e);
            lastError = e;
        }
    }
    throw lastError || new Error('Unable to access camera with provided constraints');
}

// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        // Remove active class from all buttons and panes
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        // Add active class to clicked button and corresponding pane
        btn.classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    });
});

// Update status indicator
function updateStatus(icon, text, color = '#4a5568') {
    statusIndicator.querySelector('.status-icon').textContent = icon;
    statusIndicator.querySelector('.status-text').textContent = text;
    statusIndicator.querySelector('.status-text').style.color = color;
}

// Reset UI when camera stops (called when stream ends)
function resetCameraUI() {
    startCameraBtn.style.display = '';
    startCameraBtn.disabled = false;
    captureBtn.style.display = 'none';
    captureBtn.disabled = true;
    stopCameraBtn.disabled = true;
    updateStatus('📷', 'Ready to scan', '#4a5568');
}

// Track device orientation for rotation detection
if (window.DeviceOrientationEvent) {
    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Don't request yet - will request when camera starts
    } else {
        window.addEventListener('deviceorientation', (event) => {
            deviceOrientation = {
                alpha: event.alpha || 0,
                beta: event.beta || 0,
                gamma: event.gamma || 0
            };
        });
    }
}

// Start Camera
startCameraBtn.addEventListener('click', async () => {
    try {
        updateStatus('📷', 'Enabling camera...', '#667eea');

        stream = await startStreamWithConstraintsSequence();

        // Request DeviceOrientation permission on iOS 13+
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', (event) => {
                        deviceOrientation = {
                            alpha: event.alpha || 0,
                            beta: event.beta || 0,
                            gamma: event.gamma || 0
                        };
                    });
                    console.log('DeviceOrientation permission granted');
                } else {
                    console.warn('DeviceOrientation permission denied');
                }
            } catch (e) {
                console.warn('DeviceOrientation permission request failed:', e);
            }
        }

        // Attach stream to video (viewfinder), but treat it as optional UI now
        video.srcObject = stream;

        // Diagnostics and guidance
        const settings = stream.getVideoTracks()[0].getSettings?.() || {};
        console.log('Actual camera settings (preview track):', settings);
        updateStatus('✅', 'Camera active - fill the frame; marks just off-screen', '#48bb78');
        captureInfo.style.display = 'block';
        captureMethodEl.textContent = 'Capture method: Preview (waiting for capture)';
        const width = settings.width || video.videoWidth || '-';
        const height = settings.height || video.videoHeight || '-';
        captureResolutionEl.textContent = `Resolution: ${width} x ${height} (preview)`;

        // Listen for when the stream ends (e.g., iOS stops camera when page loses focus)
        stream.getTracks().forEach(track => {
            track.addEventListener('ended', () => {
                console.log('Camera track ended (likely due to browser/OS stopping it)');
                video.srcObject = null;
                stream = null;
                resetCameraUI();
            });
        });

        startCameraBtn.style.display = 'none';
        captureBtn.style.display = 'flex';
        captureBtn.disabled = false;
        stopCameraBtn.disabled = false;

        updateStatus('✅', 'Camera active - fill the frame; marks just off-screen', '#48bb78');
    } catch (error) {
        console.error('Error accessing camera:', error);
        updateStatus('❌', 'Camera access denied', '#f56565');
        alert('Unable to access camera. Please grant camera permissions.');
    }
});

// Stop Camera
stopCameraBtn.addEventListener('click', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    }

    // Hide results when stopping camera
    textResult.style.display = 'none';
    hashResult.style.display = 'none';
    verificationResult.style.display = 'none';
    debugConsole.style.display = 'none';

    resetCameraUI();
});

// Capture and process
captureBtn.addEventListener('click', async () => {
    try {
        captureBtn.style.display = 'none'; // Hide button during processing

        // Hide previous results and reset to cropped image tab
        textResult.style.display = 'none';
        hashResult.style.display = 'none';
        verificationResult.style.display = 'none';

        // Reset tabs to show captured image first
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelector('[data-tab="captured"]').classList.add('active');
        document.getElementById('tab-captured').classList.add('active');

        // Capture the image FIRST (shutter action)
        updateStatus('📸', 'Capturing...', '#667eea');

        // Prefer high-res still photo via ImageCapture API
        const track = stream.getVideoTracks()[0];
        let imageBitmap = null;
        let usedMethod = 'Video frame';
        if ('ImageCapture' in window) {
            try {
                const ic = new ImageCapture(track);
                const photo = await ic.takePhoto(); // Blob
                imageBitmap = await createImageBitmap(photo);
                console.log('Captured still via ImageCapture:', photo.type, photo.size, photo);
                usedMethod = 'ImageCapture.takePhoto()';
            } catch (e) {
                console.warn('ImageCapture.takePhoto failed, falling back to canvas frame', e);
            }
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (imageBitmap) {
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            ctx.drawImage(imageBitmap, 0, 0);
        } else {
            // Fallback to current video frame
            const vw = video.videoWidth || (video.srcObject ? (stream.getVideoTracks()[0].getSettings().width || 1280) : 1280);
            const vh = video.videoHeight || (video.srcObject ? (stream.getVideoTracks()[0].getSettings().height || 720) : 720);
            canvas.width = vw;
            canvas.height = vh;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Update capture diagnostics visible to user
        captureInfo.style.display = 'block';
        captureMethodEl.textContent = `Capture method: ${usedMethod}`;
        captureResolutionEl.textContent = `Resolution: ${canvas.width} x ${canvas.height}`;

        // NOW show processing status and progress bar
        updateStatus('⏳', 'Processing...', '#ed8936');
        progressBar.style.display = 'block';

        // Scroll to the processing section
        progressBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Run OpenCV-based detection (always-on, no silent fallback)
        updateStatus('🧭', 'Detecting registration square...', '#ed8936');
        await (window.cvReady || Promise.reject(new Error('Computer vision not ready')));
        const detection = await window.detectSquaresFromCanvas(canvas);

        if (!detection.ok) {
            // Show the full captured image even if detection failed
            croppedImage.src = canvas.toDataURL();
            textResult.style.display = 'block';
            throw new Error('Could not detect framing rectangle; adjust framing and retry.');
        }

        let cropped = detection.croppedCanvas;

        // Try OCR at multiple orientations and pick the best one
        // Order by likelihood: 0° most common, 90°/270° sideways, 180° very unlikely
        updateStatus('🔄', 'Detecting text orientation...', '#ed8936');
        debugLog('Trying orientations (0°, 90°, 270°, 180°)...');

        const orientations = [
            { rotation: 0, canvas: cropped },
            { rotation: 90, canvas: rotateCanvas(cropped, 90) },
            { rotation: 270, canvas: rotateCanvas(cropped, 270) },
            { rotation: 180, canvas: rotateCanvas(cropped, 180) }
        ];

        let bestResult = null;
        let bestConfidence = 0;
        let bestRotation = 0;

        for (const { rotation, canvas } of orientations) {
            try {
                const result = await Tesseract.recognize(canvas.toDataURL(), 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            debugLog(`OCR ${rotation}°: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                });

                const confidence = result.data.confidence || 0;
                debugLog(`${rotation}°: confidence ${confidence.toFixed(1)}`);

                if (confidence > bestConfidence) {
                    bestConfidence = confidence;
                    bestResult = result;
                    bestRotation = rotation;
                }
            } catch (e) {
                debugLog(`${rotation}° failed: ${e.message}`);
            }
        }

        if (!bestResult) {
            throw new Error('OCR failed at all orientations');
        }

        debugLog(`Best: ${bestRotation}° (conf: ${bestConfidence.toFixed(1)})`);

        // Use the best orientation
        if (bestRotation !== 0) {
            cropped = rotateCanvas(cropped, bestRotation);
        }

        // Display the correctly oriented cropped image
        croppedImage.src = cropped.toDataURL();
        textResult.style.display = 'block';

        const rawText = bestResult.data.text;
        console.log('Raw OCR Text:', rawText);

        // Display extracted text
        extractedText.textContent = rawText;

        // Extract verification URL (using app-logic.js)
        const { url: baseUrl, urlLineIndex } = extractVerificationUrl(rawText);
        debugLog(`Base URL: ${baseUrl.substring(0, 40)}...`);
        console.log('Base URL:', baseUrl);

        // Extract certification text (using app-logic.js)
        const certText = extractCertText(rawText, urlLineIndex);
        debugLog(`Cert text: ${certText.substring(0, 50)}...`);

        // Normalize text according to the rules
        updateStatus('🔧', 'Normalizing text...', '#ed8936');
        const normalized = normalizeText(certText);
        debugLog(`Normalized: ${normalized.length} chars`);
        console.log('Normalized Text:', normalized);

        normalizedText.textContent = normalized;

        // Generate SHA-256 hash
        updateStatus('🔐', 'Generating hash...', '#ed8936');
        const hash = await sha256(normalized);
        console.log('SHA-256 Hash:', hash);

        hashValue.textContent = hash;
        hashResult.style.display = 'block';

        // Build full verification URL by appending hash to base URL
        const fullVerificationUrl = `${baseUrl}/${hash}`;
        console.log('Full Verification URL:', fullVerificationUrl);

        // Verify against the full URL
        updateStatus('🌐', 'Verifying against claimed URL...', '#ed8936');
        await verifyAgainstClaimedUrl(fullVerificationUrl, hash);

        progressBar.style.display = 'none';
        updateStatus('✅', 'Verification complete - tap Stop Camera to capture again', '#48bb78');

        // Scroll to bottom to show verification result
        verificationResult.scrollIntoView({ behavior: 'smooth', block: 'end' });

    } catch (error) {
        console.error('Error processing image:', error);
        progressBar.style.display = 'none';
        updateStatus('❌', 'Processing failed: ' + error.message, '#f56565');
        alert(error.message);
        // Don't show button - user needs to stop/restart camera
    }
});

// rotateCanvas(), extractVerificationUrl(), extractCertText(), hashMatchesUrl() are loaded from app-logic.js
// normalizeText() and sha256() are loaded from normalize.js

// Verify against the claimed URL
async function verifyAgainstClaimedUrl(claimedUrl, computedHash) {
    verificationResult.style.display = 'block';

    // Clear previous status classes
    verificationStatus.className = 'verification-status';

    // Check if the URL contains the hash (using app-logic.js)
    if (!hashMatchesUrl(claimedUrl, computedHash)) {
        verificationStatus.textContent = `❌ Hash not found at claimed URL: ${claimedUrl}`;
        verificationUrl.textContent = '';
        verificationStatus.classList.add('not-found');
        console.log('Hash mismatch: computed hash not in claimed URL');

        // Show visual overlay on video
        showOverlay('red', 'FAILS VERIFICATION');
        return;
    }

    verificationUrl.textContent = `Claimed URL: ${claimedUrl}`;

    // Fetch the URL and verify response
    try {
        const response = await fetch(claimedUrl);

        // Check for 200 status
        if (response.status !== 200) {
            verificationStatus.textContent = `❌ NOT FOUND - URL returned status ${response.status}`;
            verificationStatus.classList.add('not-found');
            console.log(`Verification failed: HTTP ${response.status}`);
            showOverlay('red', 'FAILS VERIFICATION');
            return;
        }

        // Read response body
        const body = await response.text();

        // Check body contains "OK"
        if (!body.includes('OK')) {
            verificationStatus.textContent = '❌ INVALID - URL does not contain "OK"';
            verificationStatus.classList.add('not-found');
            console.log('Verification failed: response does not contain "OK"');
            showOverlay('red', 'FAILS VERIFICATION');
            return;
        }

        // Success: 200 status + "OK" in body
        verificationStatus.textContent = '✅ VERIFIED - Certification confirmed';
        verificationStatus.classList.add('verified');
        showOverlay('green', 'VERIFIED');

    } catch (error) {
        // Network error or CORS issue
        console.error('Could not fetch URL:', error);
        verificationStatus.textContent = `❌ CANNOT VERIFY - Network error or CORS restriction`;
        verificationStatus.classList.add('not-found');
        showOverlay('red', 'FAILS VERIFICATION');
    }
}

// Show overlay on video
function showOverlay(color, text) {
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Set canvas size to match video display dimensions
    overlay.width = video.clientWidth;
    overlay.height = video.clientHeight;

    // Semi-transparent background
    ctx.fillStyle = color === 'green' ? 'rgba(72, 187, 120, 0.3)' : 'rgba(245, 101, 101, 0.3)';
    ctx.fillRect(0, 0, overlay.width, overlay.height);

    // Bold text
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = color === 'green' ? '#22543d' : '#742a2a';
    ctx.fillText(text, overlay.width / 2, overlay.height / 2);

    // Clear overlay after 3 seconds
    setTimeout(() => {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
    }, 3000);
}

// Copy hash to clipboard
copyHashBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(hashValue.textContent);
        const originalText = copyHashBtn.textContent;
        copyHashBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyHashBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('Failed to copy:', error);
        alert('Failed to copy hash to clipboard');
    }
});

// Copy image to clipboard
const copyImageBtn = document.getElementById('copyImage');
copyImageBtn.addEventListener('click', async () => {
    try {
        const img = document.getElementById('croppedImage');

        // Convert data URL to blob
        const response = await fetch(img.src);
        const blob = await response.blob();

        // Copy to clipboard
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);

        const originalText = copyImageBtn.textContent;
        copyImageBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            copyImageBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('Failed to copy image:', error);
        alert('Failed to copy image to clipboard. Try downloading instead.');
    }
});
