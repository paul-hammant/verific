---
title: "Container Shipping Instructions"
category: "Chain of Custody & Logistics"
volume: "Large"
retention: "Shipment + 3-7 years"
slug: "container-shipping-instructions"
verificationMode: "clip"
tags: ["container", "shipping", "instructions", "logistics", "transportation", "booking-confirmation"]
furtherDerivations: 1
---

## What are Shipping Instructions?

Before a ship leaves, the exporter must send **Shipping Instructions (SI)** to the carrier (like Maersk or Hapag-Lloyd). This document tells the carrier exactly what to write on the final Bill of Lading.

It's the "Draft" of the most important paper in trade. It includes:
1.  **The Cargo:** "1,200 iPhones" vs "1,200 Books."
2.  **The Parties:** Who is sending and who is receiving.
3.  **The Route:** Which ports the ship will stop at.

Fraudsters often "mis-declare" cargo in the instructions (e.g., calling high-tax electronics "low-tax toys") to get a lower freight rate or bypass customs checks.

<div style="max-width: 600px; margin: 24px auto; font-family: 'Arial Narrow', sans-serif; border: 1px solid #000; background: #fff; padding: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <div style="background: #002d62; color: #fff; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-weight: bold; font-size: 1.1em;"><span verifiable-text="start" data-for="ship"></span>MAERSK LINE</div>
    <div style="font-size: 0.8em;">SHIPPING INSTRUCTIONS (DRAFT)</div>
  </div>
<div style="padding: 20px;">
    <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 20px;">
      <div>
        <strong>Shipper:</strong> Global Tech Exports, Inc.<br>
        <strong>Booking #:</strong> 99228877
      </div>
      <div style="text-align: right;">
        <strong>Vessel:</strong> MAERSK MC-KINNEY<br>
        <strong>Voyage:</strong> 2604W
      </div>
    </div>
<div style="font-size: 0.95em; line-height: 1.6; color: #333; border: 1px solid #000; padding: 15px; margin-bottom: 20px;">
      <p><strong>Cargo Description:</strong></p>
      <p>12 Pallets: Telecommunications Equipment<br>
      HS Code: 8517.62<br>
      Gross Weight: 4,500.00 KG</p>
    </div>
<div data-verify-line="ship" style="border-top: 1px dashed #999; margin-top: 25px; padding-top: 10px; font-family: 'Courier New', monospace; font-size: 0.8em; color: #555; text-align: center;"
      title="Demo only: Maersk doesn't yet offer verification&#10;endpoints, so this is illustrative">
      <span data-verify-line="ship">verify:maersk.com/si/v</span> <span verifiable-text="end" data-for="ship"></span>
    </div>
  </div>
</div>

## Data Verified

Shipper name, Booking number, Vessel name, Voyage number, Cargo description, HS Codes, Weight, Destination port.

## Data Visible After Verification

Shows the issuer domain (`maersk.com`) and current booking status.

**Status Indications:**
- **Draft Received** — Carrier has the instructions.
- **B/L Pending** — Instructions verified; final Bill of Lading being printed.
- **Mismatch Alert** — **ALERT:** Description on SI does not match the physical scan at the port.

## Second-Party Use

The **Exporter (Shipper)** benefits from verification.
- **Error Prevention:** Ensuring the carrier's final Bill of Lading exactly matches the verified instructions, preventing costly "Letter of Credit" rejections at the bank.
- **Draft Approval:** Instantly approving the digital draft from the carrier by verifying the hash against their own internal shipping system.

## Third-Party Use

**Customs Authorities**
**Pre-manifest Screening:** Customs can verify the Shipping Instructions *before* the ship sails. If the description on the SI doesn't match the carrier's verified data, the container can be flagged for inspection at the loading port.

**Logistics Aggregators (Flexport / Freightos)**
**Data Integrity:** Automatically ingesting verified shipping data from dozens of different carriers into a single dashboard without manual data entry errors.

## Authority Chain

**Pattern:** Commercial

Ocean carriers issue shipping instructions to confirm the parameters of cargo placement. Self-authorized by their operational control of container ships and booking authority.

```
✓ si.maersk.com/verify — Issues container shipping instructions and vessel instructions
```

Commercial issuer — self-authorized. Trust rests on the issuer's domain reputation.

See [Authority Chain Specification](../../docs/authority-chain-spec.md) for the full protocol.

## Jurisdictional Witnessing (Optional)

An independent witness layer may apply — see [Witnessing Third Parties](../../docs/WITNESSING-THIRD-PARTIES.md) for the full mechanism (what a witness receives, non-repudiation, optional public-blockchain rollups). For this use case: a witness would receive the shipper's or freight forwarder's hashes and status changes plus structured metadata (shipping instruction ID, booking reference, cargo type, port of loading, port of discharge, sailing date) — never cargo value or consignee customer contact details — providing non-repudiation of shipping instructions and an audit trail for customs and carrier liability disputes.


## Competition vs. EDI / Blockchain

| Feature | Live Verify | EDI (Shipping Standard) | GSBN Blockchain |
| :--- | :--- | :--- | :--- |
| **Trust** | **Cryptographic.** | **System-Bound.** | **Consensus-Bound.** |
| **Accessibility** | **Universal.** Any clerk can scan. | **Zero.** Requires heavy IT setup. | **Low.** Requires membership. |
| **Adoption** | **High.** Works with PDFs. | **Universal.** (For big ships). | **Low.** (Emerging). |

**Why Live Verify wins here:**
The "Silo" Problem. While big carriers use EDI, they don't share those logs with the exporter's local bank or a foreign customs agent. Live Verify turns the **Draft PDF** into a portable "Token of Intent" that anyone can trust.

