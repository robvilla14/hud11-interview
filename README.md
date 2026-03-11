# HUD-11 Employee Interview Tool

A digital implementation of the **U.S. Department of Housing and Urban Development Form HUD-11 — Record of Employee Interview**, used for conducting Labor Compliance employee interviews per Federal prevailing wage requirements under the Davis-Bacon and Related Acts (DBRA).

**Live tool:** `https://robvilla14.github.io/hud11-interview/`

---

## Purpose

Federal law requires that laborers and mechanics employed on HUD-assisted construction projects be paid prevailing wages as determined by the U.S. Department of Labor. The HUD-11 form is the official instrument used by HUD staff, fee construction inspectors, and local agency labor standards contract monitors to conduct on-site interviews and verify that workers are being paid correctly.

This tool digitalizes that process — allowing interviewers to complete the form on a tablet or computer in the field, capture signatures, and produce a print-ready PDF that matches the official HUD-11 layout exactly.

---

## Features

- **Bilingual** — full English and Spanish support; toggle per interview, prints in the selected language
- **Signature capture** — canvas-based finger/stylus pad for employee (12a) and interviewer (15b) signatures, stored as images and printed inline
- **Smart PDF filename** — browser PDF export is automatically named `Doe,John_Villa Construction-Employee Interview-20260309`
- **Copy Forward** — carry Project Name, Project Number, Interviewer Name, Signature, and Interview Date across multiple interviews at the same project
- **Dashboard** — lists all saved interviews with employee name, project, date, and timestamps
- **In-app Instructions** — full HUD-11 guidance text in English and Spanish, accessible via the Instructions button
- **Export / Import** — full JSON backup and restore of all saved interview data
- **localStorage storage meter** — visual indicator of storage usage
- **Print layout** — matches the official HUD-11 (03/2025) grid exactly: two-column header, Y/N checkbox fields, fringe/frequency layout, blank Payroll Examination section for examiner sign-off, Additional Remarks on page 3

---

## Form Version

This tool follows the official HUD form:

| Field | Value |
|---|---|
| Form | HUD-11 |
| Version | 03/2025 |
| OMB Approval No. | 2501-0009 |
| OMB Expiration | 03/31/2028 |
| Issuing Office | HUD Office of Davis-Bacon and Labor Standards |

> **Note:** When the OMB approval expires (March 2028), HUD will likely issue an updated version of the form. Review and update this tool at that time to reflect any field changes.

The form text and layout are reproduced from a U.S. federal government publication and are in the public domain (17 U.S.C. § 105). The software implementation is original work owned by Labor Compliance Solutions.

---

## Workflow

### Conducting an Interview

1. Open the tool and tap **+ New Interview**
2. If returning to the same project, use **⎘ Copy Forward** to pre-fill project and interviewer fields
3. Fill out sections 1–12 with the employee during the interview
4. Complete sections 13–15 with your own observations after or during the interview
5. Tap **Save**, then **Print / Save PDF** to generate the official document
6. The Payroll Examination section (16–17b) is intentionally left blank — the payroll examiner completes and signs this section separately after comparing the form against certified payroll records for that week

### Printing / Saving as PDF

When printing, the browser will open its print dialog. For the cleanest output:

- **Uncheck "Headers and Footers"** in the print dialog (the tool shows a reminder the first time)
- Confirm **Paper Size: Letter**
- Confirm **Margins: Default** or **None**
- Use **Save as PDF** to produce a digital file

The tool sets the document title to the smart filename automatically before the print dialog opens, so your PDF will be named correctly without any manual renaming.

---

## Data Storage

Interview data is stored in **localStorage** in your browser under the key `hud11_v1`. This means:

- Data persists across sessions as long as you use the same browser at the same URL
- **Opening the file locally** (e.g., double-clicking `index.html`) creates a separate storage context from the GitHub Pages URL — always use the live URL to maintain continuity
- Clearing browser data or cache will erase all saved interviews — use **Export Backup** regularly to save a `.json` file
- Data is stored only on your device — nothing is sent to any server

### Recommended Backup Practice

Export a JSON backup at the end of each field day. Store backups alongside the corresponding PDF exports for each project week.

---

## Deployment

This tool is a single `index.html` file with no dependencies, build steps, or server requirements.

### Initial Setup

1. Create a new GitHub repository (e.g., `hud11-interview`)
2. Go to **Settings → Pages → Source: Deploy from branch → main / (root)**
3. Add a new file named `index.html`
4. Paste the full tool code and commit

### Updating

1. Navigate to `index.html` in the GitHub repo
2. Click the pencil (Edit) icon
3. Replace the full contents with the updated code
4. Commit with a descriptive message (e.g., `Add instructions view EN/ES`)
5. GitHub Pages redeploys automatically in about 1 minute

---

## Privacy & Confidentiality

Per HUD policy, the information collected on Form HUD-11 is considered **sensitive** and is protected by the Privacy Act. Interview data stored in this tool should be treated accordingly:

- Do not use shared or public computers to conduct interviews
- Export and store backup files in a secure location
- PDF exports containing signatures and personal information should be stored and transmitted securely
- The employee's participation in the interview is voluntary and their responses are confidential

---

## Tech Notes

- Single-file HTML — no framework, no build pipeline, no external dependencies
- Signatures use HTML5 Canvas API with touch event support for iPad/stylus
- Signature data stored as base64 PNG in localStorage
- Print layout uses CSS `@page` with letter size; page footer text set via DOM elements for cross-browser compatibility
- Language switching is handled entirely client-side; all strings for both languages are compiled into the single file
- `localStorage` is the only storage mechanism; migrating to a backend requires only replacing the `getAll()` and `saveAll()` functions

---

## License

Software: © Labor Compliance Solutions. All rights reserved.  
Form HUD-11 content: U.S. Department of Housing and Urban Development — public domain.

---

*Labor Compliance Solutions · https://github.com/robvilla14*
