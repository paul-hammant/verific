// Camera and UI Elements
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const startCameraBtn = document.getElementById('startCamera');
const captureBtn = document.getElementById('captureBtn');
const stopCameraBtn = document.getElementById('stopCamera');
const statusIndicator = document.getElementById('statusIndicator');
const progressBar = document.getElementById('progressBar');

// Result Elements
const ocrResult = document.getElementById('ocrResult');
const extractedText = document.getElementById('extractedText');
const normalizedResult = document.getElementById('normalizedResult');
const normalizedText = document.getElementById('normalizedText');
const hashResult = document.getElementById('hashResult');
const hashValue = document.getElementById('hashValue');
const copyHashBtn = document.getElementById('copyHash');
const verificationResult = document.getElementById('verificationResult');
const verificationStatus = document.getElementById('verificationStatus');
const verificationUrl = document.getElementById('verificationUrl');

let stream = null;

// Hardcoded hash database - no server or JSON file needed!
// To add new hashes: Run build-hashes.js and copy the output here
const HASH_DATABASE = {
  "e6200eead4c2ec90f6393eb1559d4b24c3dcbdc54e6fd610014bb9f668cc8710": {
    "status": "verified",
    "message": "Intertek certification validated",
    "timestamp": "2025-10-23T12:15:33.749Z"
  },
  "110524636eb2bf65af643bfe7c2823de7628d2c5969cd699249896475f3b5808": {
    "status": "verified",
    "message": "BSI Group certification - Type IIR mask",
    "timestamp": "2025-10-23T12:15:33.750Z"
  },
  "9899d75881c02c5aa3fb84b1fc3cbe63a4a6831b0e3c918947113a200fb89a77": {
    "status": "verified",
    "message": "CE marked surgical gloves",
    "timestamp": "2025-10-23T12:15:33.750Z"
  },
  "d8f402889929a49d489d30ca9991989111c4bd0e3bdac15791d95c81269c31a5": {
    "status": "revoked",
    "message": "Product recalled due to safety concerns",
    "timestamp": "2025-10-23T12:15:33.750Z"
  },
  "fe59b91b97619ae831e895bd38a123d3500a393778d0ab58c2fffb894e0704be": {
    "status": "denied",
    "message": "Certification application denied",
    "timestamp": "2025-10-23T12:15:33.750Z"
  }
};

// Update status indicator
function updateStatus(icon, text, color = '#4a5568') {
    statusIndicator.querySelector('.status-icon').textContent = icon;
    statusIndicator.querySelector('.status-text').textContent = text;
    statusIndicator.querySelector('.status-text').style.color = color;
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

        startCameraBtn.disabled = true;
        captureBtn.disabled = false;
        stopCameraBtn.disabled = false;

        updateStatus('✅', 'Camera active - position marks around text', '#48bb78');
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

    startCameraBtn.disabled = false;
    captureBtn.disabled = true;
    stopCameraBtn.disabled = true;

    updateStatus('📷', 'Ready to scan', '#4a5568');
});

// Capture and process
captureBtn.addEventListener('click', async () => {
    try {
        captureBtn.disabled = true;
        updateStatus('⏳', 'Processing...', '#ed8936');
        progressBar.style.display = 'block';

        // Hide previous results
        ocrResult.style.display = 'none';
        normalizedResult.style.display = 'none';
        hashResult.style.display = 'none';
        verificationResult.style.display = 'none';

        // Capture image from video within registration marks
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate the region within registration marks
        const videoRect = video.getBoundingClientRect();
        const markArea = {
            x: videoRect.width * 0.10,  // 10% from left
            y: videoRect.height * 0.15,  // 15% from top
            width: videoRect.width * 0.80,  // 80% of width
            height: videoRect.height * 0.70  // 70% of height
        };

        canvas.width = video.videoWidth * 0.80;
        canvas.height = video.videoHeight * 0.70;

        ctx.drawImage(
            video,
            video.videoWidth * 0.10,
            video.videoHeight * 0.15,
            canvas.width,
            canvas.height,
            0,
            0,
            canvas.width,
            canvas.height
        );

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
        ocrResult.style.display = 'block';

        // Normalize text according to the rules
        updateStatus('🔧', 'Normalizing text...', '#ed8936');
        const normalized = normalizeText(rawText);
        console.log('Normalized Text:', normalized);

        normalizedText.textContent = normalized;
        normalizedResult.style.display = 'block';

        // Generate SHA-256 hash
        updateStatus('🔐', 'Generating hash...', '#ed8936');
        const hash = await sha256(normalized);
        console.log('SHA-256 Hash:', hash);

        hashValue.textContent = hash;
        hashResult.style.display = 'block';

        // Verify against local database
        updateStatus('🔍', 'Verifying hash...', '#ed8936');
        verifyHashLocal(hash);

        progressBar.style.display = 'none';
        updateStatus('✅', 'Verification complete', '#48bb78');
        captureBtn.disabled = false;

    } catch (error) {
        console.error('Error processing image:', error);
        progressBar.style.display = 'none';
        updateStatus('❌', 'Processing failed: ' + error.message, '#f56565');
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

// Verify hash against local hardcoded database
function verifyHashLocal(hash) {
    verificationResult.style.display = 'block';
    verificationUrl.textContent = `Hash lookup: Local database (${Object.keys(HASH_DATABASE).length} entries) - Works offline!`;

    // Clear previous status classes
    verificationStatus.className = 'verification-status';

    const record = HASH_DATABASE[hash];

    if (!record) {
        verificationStatus.textContent = '❌ NOT FOUND - Hash not in database';
        verificationStatus.classList.add('not-found');
        console.log('Hash not found in database');
        return;
    }

    console.log(`Hash found - Status: ${record.status}`);

    if (record.status === 'verified') {
        verificationStatus.textContent = '✅ VERIFIED - Document is authentic';
        if (record.message) {
            verificationStatus.textContent += ` - ${record.message}`;
        }
        verificationStatus.classList.add('verified');
    } else if (record.status === 'denied') {
        verificationStatus.textContent = '⚠️ DENIED - Check OCR accuracy and retry';
        if (record.message) {
            verificationStatus.textContent += ` - ${record.message}`;
        }
        verificationStatus.classList.add('denied');
    } else if (record.status === 'revoked') {
        verificationStatus.textContent = '🚫 REVOKED - Product recalled or certification revoked';
        if (record.message) {
            verificationStatus.textContent += ` - ${record.message}`;
        }
        verificationStatus.classList.add('revoked');
    } else {
        verificationStatus.textContent = `❓ UNKNOWN STATUS - ${record.status}`;
        verificationStatus.classList.add('not-found');
    }

    if (record.timestamp) {
        const date = new Date(record.timestamp).toLocaleString();
        verificationUrl.textContent += ` | Registered: ${date}`;
    }
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
