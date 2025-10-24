#!/usr/bin/env node
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

const { normalizeText, sha256 } = require('./build-hashes.js');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://paul-hammant.github.io/verific/c';

// Three training certifications
const certifications = [
    {
        name: 'bachelor-thaumatology',
        title: 'Bachelor of Thaumatology',
        text: `Unseen University
Ankh-Morpork
Bachelor of Thaumatology
Awarded to: Ponder Stibbons
Date: Grune 23, A.M. 2024
Archchancellor: Mustrum Ridcully
Registrar: Rincewind (Wizzard)`
    },
    {
        name: 'master-applied-anthropics',
        title: 'Master of Applied Anthropics',
        text: `Unseen University
Faculty of Anthropics
Master of Applied Anthropics
Awarded to: Esk Weatherwax
Date: Offle 12, A.M. 2024
Dean of Anthropics: Modo
Seal of the Eight Orders`
    },
    {
        name: 'doctorate-high-energy-magic',
        title: 'Doctorate in High Energy Magic',
        text: `Unseen University
College of High Energy Magic
Doctor of Philosophy
Specialization: Octarine Resonance
Awarded to: Adrian Turnipseed
Date: Ember 8, A.M. 2024
Chair of High Energy Magic: Hex
Thesis: "On theMalleability of L-Space"`
    }
];

console.log('Generating training pages...\n');

certifications.forEach(cert => {
    // Normalize and compute hash
    const normalized = normalizeText(cert.text);
    const hash = sha256(normalized);

    console.log(`\n${cert.title}`);
    console.log(`  Filename: ${cert.name}.html`);
    console.log(`  Hash: ${hash}`);
    console.log(`  URL: ${BASE_URL}/${hash}`);

    // Create training page HTML
    const trainingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cert.title} - Training Page</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            padding: 40px 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
        }

        .instructions {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #2196f3;
        }

        .instructions h2 {
            color: #1976d2;
            margin-bottom: 10px;
            font-size: 1.2rem;
        }

        .instructions ol {
            margin-left: 20px;
            line-height: 1.8;
        }

        .certification-box {
            position: relative;
            padding: 40px;
            background: white;
            margin: 30px 0;
        }

        .registration-marks {
            position: absolute;
            top: 8%;
            left: 2%;
            right: 10%;
            bottom: 5%;
            pointer-events: none;
        }

        .corner {
            position: absolute;
            background: black;
        }

        .corner.top-left {
            top: 0;
            left: 0;
            width: 15px;
            height: 15px;
        }

        .corner.top-right {
            top: 0;
            right: 0;
            width: 18px;
            height: 15px;
        }

        .corner.bottom-left {
            bottom: 0;
            left: 0;
            width: 15px;
            height: 18px;
        }

        .corner.bottom-right {
            bottom: 0;
            right: 0;
            width: 18px;
            height: 18px;
        }

        .cert-content {
            font-size: 18px;
            line-height: 1.6;
            white-space: pre-line;
            margin-bottom: 20px;
        }

        .verify-url {
            font-family: monospace;
            font-size: 14px;
            color: #666;
            word-break: break-all;
        }

        .info {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border-left: 4px solid #ffc107;
        }

        .info strong {
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${cert.title}</h1>

        <div class="instructions">
            <h2>📱 How to Use This Training Page</h2>
            <ol>
                <li>Open the <a href="https://paul-hammant.github.io/verific/" target="_blank">Verific webapp</a> on your phone</li>
                <li>Display this page on your computer screen</li>
                <li>Use your phone camera to scan the certification box below</li>
                <li>Align the registration marks (black squares) on your phone with the marks in the box</li>
                <li>Click "Capture & Verify" to verify the certification</li>
            </ol>
        </div>

        <div class="certification-box">
            <div class="registration-marks">
                <div class="corner top-left"></div>
                <div class="corner top-right"></div>
                <div class="corner bottom-left"></div>
                <div class="corner bottom-right"></div>
            </div>

            <div class="cert-content">${cert.text}</div>

            <div class="verify-url">${BASE_URL}</div>
        </div>

        <div class="info">
            <strong>Expected Result:</strong> When scanned correctly, the app should compute hash
            <code>${hash.substring(0, 16)}...</code> and verify it against the certification database.
        </div>
    </div>
</body>
</html>
`;

    // Write training page
    const trainingPath = path.join(__dirname, 'public', 'training-pages', `${cert.name}.html`);
    fs.writeFileSync(trainingPath, trainingHtml, 'utf8');
    console.log(`  Created: ${trainingPath}`);

    // Create simple verification HTML page
    const verificationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification - Verific</title>
</head>
<body>
OK
</body>
</html>
`;

    // Create directory and index.html
    const verificationDir = path.join(__dirname, 'public', 'c', hash);
    if (!fs.existsSync(verificationDir)) {
        fs.mkdirSync(verificationDir, { recursive: true });
    }
    const verificationPath = path.join(verificationDir, 'index.html');
    fs.writeFileSync(verificationPath, verificationHtml, 'utf8');
    console.log(`  Created: ${verificationPath}`);
});

console.log('\n✅ Training pages generated successfully!\n');
console.log('Training pages: public/training-pages/');
console.log('Verification pages: public/c/\n');
