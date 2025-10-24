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

/**
 * Build hash database as JSON for client-side verification
 * This creates a simple hashes.json file that can be fetched in the browser
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Helper function to normalize text
function normalizeText(text) {
    const lines = text.split('\n');
    const normalizedLines = lines.map(line => {
        line = line.replace(/^\s+/, '');  // Remove leading spaces
        line = line.replace(/\s+$/, '');  // Remove trailing spaces
        line = line.replace(/\s+/g, ' '); // Collapse multiple spaces
        return line;
    });
    return normalizedLines.join('\n');
}

// Helper function to generate SHA-256 hash
function sha256(text) {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// Helper function to add a certification
function addCertification(database, text, status = 'verified', message = '') {
    const normalized = normalizeText(text);
    const hash = sha256(normalized);
    const timestamp = new Date().toISOString();

    database[hash] = {
        status,
        message,
        timestamp
    };

    console.log(`Added: ${hash.substring(0, 16)}... [${status}]`);
    return hash;
}

// Main build function
function buildHashDatabase() {
    const database = {};

    console.log('Building hash database...\n');
    console.log('Adding certifications...\n');

    // Intertek certification from the blog post example
    addCertification(database,
        `This gown was certified by Intertek
on March 1, 2022 for MedPro Ltd of
Douglas, Isle of Man.
UK medical standards Abc123, Def456
apply. #SHA10664849l
Description of gown: one piece,
tie behind, neck loop, spunbond
polypropylene, spash resistant
sterile, double wrapped.`,
        'verified',
        'Intertek certification validated'
    );

    // Add more sample certifications
    addCertification(database,
        `Product: Medical Face Mask Type IIR
Manufacturer: SafetyFirst Ltd
Certification: EN 14683:2019
Batch: 2023-045-A
Expires: 2026-03-15
Certified by: BSI Group`,
        'verified',
        'BSI Group certification - Type IIR mask'
    );

    addCertification(database,
        `CE Mark Declaration
Product: Surgical Gloves
Standard: EN 455-1:2020
Notified Body: 0123
Manufacturer: GloveTech Industries
Valid until: 2025-12-31`,
        'verified',
        'CE marked surgical gloves'
    );

    // Training page certifications - Unseen University
    addCertification(database,
        `Unseen University
Ankh-Morpork
Bachelor of Thaumatology
Awarded to: Ponder Stibbons
Date: Grune 23, A.M. 2024
Archchancellor: Mustrum Ridcully
Registrar: Rincewind (Wizzard)`,
        'verified',
        'Training example: Bachelor of Thaumatology'
    );

    addCertification(database,
        `Unseen University
Faculty of Anthropics
Master of Applied Anthropics
Awarded to: Esk Weatherwax
Date: Offle 12, A.M. 2024
Dean of Anthropics: Modo
Seal of the Eight Orders`,
        'verified',
        'Training example: Master of Applied Anthropics'
    );

    addCertification(database,
        `Unseen University
College of High Energy Magic
Doctor of Philosophy
Specialization: Octarine Resonance
Awarded to: Adrian Turnipseed
Date: Ember 8, A.M. 2024
Chair of High Energy Magic: Hex
Thesis: "On theMalleability of L-Space"`,
        'verified',
        'Training example: Doctorate in High Energy Magic'
    );

    // Revoked example
    addCertification(database,
        `Product recalled by manufacturer
Original certification: ABC123456
Date: 2020-01-15
Recall date: 2023-06-20
Do not use this product.`,
        'revoked',
        'Product recalled due to safety concerns'
    );

    // Denied example
    addCertification(database,
        `Test certification for denial
This certification was not approved
by the certifying authority.
Status: Application denied`,
        'denied',
        'Certification application denied'
    );

    // Write to JSON file
    const outputPath = path.join(__dirname, 'public', 'hashes.json');
    const jsonOutput = JSON.stringify(database, null, 2);
    fs.writeFileSync(outputPath, jsonOutput, 'utf8');

    // Get statistics
    const statuses = {};
    Object.values(database).forEach(entry => {
        statuses[entry.status] = (statuses[entry.status] || 0) + 1;
    });

    console.log('\n=== Database Statistics ===');
    console.log(`Total certifications: ${Object.keys(database).length}`);
    Object.entries(statuses).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
    });

    // Get file size
    const stat = fs.statSync(outputPath);
    console.log(`\nJSON file size: ${Math.round(stat.size / 1024)}KB`);
    console.log(`File location: ${outputPath}`);

    console.log('\n✅ Hash database built successfully!');

    // Inject build timestamp into app-url-based.js
    const buildTimestamp = new Date().toISOString();
    const appJsPath = path.join(__dirname, 'public', 'app-url-based.js');
    let appJsContent = fs.readFileSync(appJsPath, 'utf8');

    // Replace the placeholder with actual timestamp
    appJsContent = appJsContent.replace(
        /const BUILD_TIMESTAMP = '[^']*';/,
        `const BUILD_TIMESTAMP = '${buildTimestamp}';`
    );

    fs.writeFileSync(appJsPath, appJsContent, 'utf8');
    console.log(`🕐 Build timestamp injected: ${buildTimestamp}`);

    return database;
}

// Run if called directly
if (require.main === module) {
    buildHashDatabase();
}

module.exports = { buildHashDatabase, normalizeText, sha256, addCertification };
