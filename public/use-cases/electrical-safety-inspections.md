---
title: "Electrical System Inspections"
category: "Site & Equipment Safety"
volume: "Large"
retention: "3-5 years (commercial wiring cycle)"
slug: "electrical-safety-inspections"
verificationMode: "clip"
tags: ["electrical-safety", "eawr", "nfpa-70e", "fixed-wire-test", "panel-inspection", "fire-prevention", "electrical-code"]
furtherDerivations: 1
---

## What is an Electrical System Inspection?

Fixed electrical installations (wiring, fuse boxes, panels) are a primary source of workplace fires. Under the **EAWR** (UK) and **NFPA 70E** (US), these systems must be periodically inspected by a qualified electrician to find loose connections, overloaded circuits, or degraded insulation.

**Inspection Certificates** or stickers placed on electrical panels provide the "Stamp of Safety" for the facility. "Pencil Whipping" is common here to avoid the cost of remedial wiring. Verified hashes bind the **Panel/Circuit ID, Test Result, and Electrician's License** to the contractor's or the city's domain.

<div style="max-width: 400px; margin: 24px auto; font-family: sans-serif; border: 3px solid #ff9800; border-radius: 8px; background: #fff; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
  <div style="background: #ff9800; color: #fff; padding: 12px; text-align: center; font-weight: bold;">
    ELECTRICAL SAFETY PASS
  </div>
  <div style="padding: 20px;">
    <div style="font-size: 0.9em; margin-bottom: 10px;">
      <strong><span verifiable-text="start" data-for="electric"></span>Panel ID:</strong> MAIN-DB-04<br>
      <strong>Location:</strong> Warehouse North Wall
    </div>
    <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 10px; margin: 15px 0;">
      <strong>Tested:</strong> 15 MAR 2026<br>
      <strong>Condition:</strong> SATISFACTORY<br>
      <strong>Electrician:</strong> Mike J. Miller (Lic #9922)
    </div>
    <div data-verify-line="electric" style="border-top: 1px dashed #999; padding-top: 10px; font-family: 'Courier New', monospace; font-size: 0.8em; color: #e65100; text-align: center; font-weight: bold;">
      <span data-verify-line="electric">verify:miller-electric.com/v</span> <span verifiable-text="end" data-for="electric"></span>
    </div>
  </div>
</div>

## Data Verified

Panel ID, Circuit number, test date, insulation resistance (MΩ), earth loop impedance (Ω), test result (Satisfactory/Unsatisfactory), electrician name/license, next inspection date, regulation reference (e.g., BS 7671 / NFPA 70).

## Data Visible After Verification

Shows the issuer domain (the Electrical Contractor) and the current safety standing.

**Status Indications:**
- **Satisfactory** — System is safe for continued use.
- **Unsatisfactory** — **CRITICAL:** Remedial work required; fire/shock risk detected.
- **Expired** — **ALERT:** Periodic inspection is overdue.

## Second-Party Use

The **Facility Manager / Landlord** benefits from verification.
- **Insurance Compliance:** Proving to a commercial property insurer that the building's wiring is verified safe, which is often a condition of fire coverage.

## Third-Party Use

**Fire Marshals / Safety Inspectors**
- **Rapid Vetting:** Scanning stickers on panels during a fire safety audit to ensure they aren't fake or expired.

**Maintenance Engineers**
- **Safe Working:** Verifying that a specific panel was recently vetted before opening it for maintenance.


## Authority Chain

**Pattern:** Regulated

NICEIC is an accredited UK electrical safety certification body.

```
✓ eicr.niceic.com — Issues electrical inspection certificates
  ✓ niceic.com — Certifies UK electrical safety inspections
    ✓ gov.uk/verifiers — UK government root namespace
```

See [Authority Chain Specification](../../docs/authority-chain-spec.md) for the full protocol.

## Jurisdictional Witnessing (Optional)

An independent witness layer may apply — see [Witnessing Third Parties](../../docs/WITNESSING-THIRD-PARTIES.md) for the full mechanism (what a witness receives, non-repudiation, optional public-blockchain rollups). For this use case: a witness would receive the electrical contractor's hashes and status changes plus structured metadata (panel IDs, test dates, insulation resistance values, test results, electrician licenses) — never facility addresses or identification details — providing non-repudiation of the inspection and an audit trail state regulators can inspect.
