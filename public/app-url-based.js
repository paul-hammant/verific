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
const BUILD_TIMESTAMP = '2025-10-24T06:44:30.457Z';
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

let stream = null;

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
    captureBtn.disabled = true;
    stopCameraBtn.disabled = true;
    updateStatus('📷', 'Camera stopped - click Start Camera to resume', '#4a5568');
}

// Start Camera
startCameraBtn.addEventListener('click', async () => {
    try {
        updateStatus('📷', 'Starting camera...', '#667eea');

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        video.srcObject = stream;

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
        captureBtn.disabled = false;
        stopCameraBtn.disabled = false;

        updateStatus('✅', 'Camera active - position marks around text + URL', '#48bb78');
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

    resetCameraUI();
});

// Extract URLs from text
function extractUrls(text) {
    // Match http:// or https:// URLs
    const urlRegex = /https?:\/\/[^\s]+/gi;
    return text.match(urlRegex) || [];
}

// Extract text between registration marks (removing the URL line and blank line before it)
function extractTextWithoutUrl(fullText) {
    const lines = fullText.split('\n');
    const urlRegex = /https?:\/\//i;

    // Find the URL line index
    const urlLineIndex = lines.findIndex(line => urlRegex.test(line));

    if (urlLineIndex === -1) {
        // No URL found, return all text
        return fullText;
    }

    // Take all lines before the URL line
    let textLines = lines.slice(0, urlLineIndex);

    // Remove trailing blank line (the separator before the URL)
    while (textLines.length > 0 && textLines[textLines.length - 1].trim() === '') {
        textLines.pop();
    }

    return textLines.join('\n');
}

// Capture and process
captureBtn.addEventListener('click', async () => {
    try {
        captureBtn.disabled = true;
        updateStatus('⏳', 'Processing...', '#ed8936');
        progressBar.style.display = 'block';

        // Scroll to the processing section
        progressBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Hide previous results and reset to cropped image tab
        textResult.style.display = 'none';
        hashResult.style.display = 'none';
        verificationResult.style.display = 'none';

        // Reset tabs to show cropped image first
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelector('[data-tab="cropped"]').classList.add('active');
        document.getElementById('tab-cropped').classList.add('active');

        // Capture image from video within registration marks
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate the region within registration marks
        // These values MUST match the CSS in styles.css (.corner positions)
        const leftMargin = 0.10;    // 10% from left
        const rightMargin = 0.10;   // 10% from right
        const topMargin = 0.15;     // 15% from top
        const bottomMargin = 0.60;  // 60% from bottom (bottom marks at 40% from top)

        const sourceX = video.videoWidth * leftMargin;
        const sourceY = video.videoHeight * topMargin;
        const sourceWidth = video.videoWidth * (1 - leftMargin - rightMargin);
        const sourceHeight = video.videoHeight * (1 - topMargin - bottomMargin);

        canvas.width = sourceWidth;
        canvas.height = sourceHeight;

        ctx.drawImage(
            video,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Display the cropped image immediately
        croppedImage.src = canvas.toDataURL();
        textResult.style.display = 'block';

        // Perform OCR
        updateStatus('🔍', 'Performing OCR...', '#ed8936');
        const result = await Tesseract.recognize(
            canvas.toDataURL(),
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        const rawText = result.data.text;
        console.log('Raw OCR Text:', rawText);

        // Display extracted text
        extractedText.textContent = rawText;

        // Extract URLs from the text
        const urls = extractUrls(rawText);
        console.log('Found URLs:', urls);

        if (urls.length === 0) {
            throw new Error('No verification URL found in the scanned text. Make sure the URL is visible within the registration marks.');
        }

        // Use the first URL found and clean up trailing characters like ] or |
        const baseUrl = urls[0].trim().replace(/[\]|]+$/, '');
        console.log('Base URL:', baseUrl);

        // Extract the certification text (without the URL line)
        const certText = extractTextWithoutUrl(rawText);

        // Normalize text according to the rules
        updateStatus('🔧', 'Normalizing text...', '#ed8936');
        const normalized = normalizeText(certText);
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
        updateStatus('✅', 'Verification complete', '#48bb78');
        captureBtn.disabled = false;

        // Scroll to bottom to show verification result
        verificationResult.scrollIntoView({ behavior: 'smooth', block: 'end' });

    } catch (error) {
        console.error('Error processing image:', error);
        progressBar.style.display = 'none';
        updateStatus('❌', 'Processing failed: ' + error.message, '#f56565');
        alert(error.message);
        captureBtn.disabled = false;
    }
});

// Text normalization function (as per the document rules)
function normalizeText(text) {
    // Split into lines
    const lines = text.split('\n');

    // Apply normalization rules to each line
    const normalizedLines = lines.map(line => {
        // Remove leading spaces
        line = line.replace(/^\s+/, '');
        // Remove trailing spaces
        line = line.replace(/\s+$/, '');
        // Collapse multiple spaces into single space
        line = line.replace(/\s+/g, ' ');
        return line;
    });

    // Join back with newlines (preserve blank lines)
    return normalizedLines.join('\n');
}

// SHA-256 hash function
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Verify against the claimed URL
async function verifyAgainstClaimedUrl(claimedUrl, computedHash) {
    verificationResult.style.display = 'block';

    // Clear previous status classes
    verificationStatus.className = 'verification-status';

    // Check if the URL contains the hash
    if (!claimedUrl.includes(computedHash)) {
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
