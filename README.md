# HUD-11 Employee Interview Tool

A digital implementation of the **U.S. Department of Housing and Urban Development Form HUD-11 — Record of Employee Interview**, used for conducting Labor Compliance employee interviews per Federal prevailing wage requirements under the Davis-Bacon and Related Acts (DBRA).

**Live tool:** `https://robvilla14.github.io/hud11-interview/`

---

## Purpose

Federal law requires that laborers and mechanics employed on HUD-assisted construction projects be paid prevailing wages as determined by the U.S. Department of Labor. The HUD-11 form is the official instrument used by HUD staff, fee construction inspectors, and local agency labor standards contract monitors to conduct on-site interviews and verify that workers are being paid correctly.

This tool digitalizes that process — allowing interviewers to complete the form on a tablet or computer in the field, capture signatures, and produce a print-ready PDF that matches the official HUD-11 layout exactly.

---

## Features

- **Bilingual** — full English and Spanish support; toggle per interview, generates the PDF in the selected language
- **Signature capture** — tap-to-enlarge finger/stylus pad for employee (12a) and interviewer (15b) signatures, with explicit Submit and Cancel controls
- **Smart PDF filename** — direct PDF output is automatically named `Doe,John_Villa Construction-Employee Interview-20260309.pdf`
- **Copy Forward** — carry Project Name, Project Number, Interviewer Name, Signature, and Interview Date across multiple interviews at the same project
- **Dashboard** — lists all saved interviews with employee name, project, date, and timestamps
- **In-app Instructions** — full HUD-11 guidance text in English and Spanish, accessible via the Instructions button
- **Export / Import** — full JSON backup and restore of all saved interview data
- **localStorage storage meter** — visual indicator of storage usage
- **Fixed PDF layout** — matches the official HUD-11 (03/2025) grid: fixed Items 1–17 on PDF Page 1, blank Payroll Examination section for examiner sign-off, and Item 18 on PDF Page 2 with explicit continuation pages when needed

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
5. Tap **Generate PDF** to save the current interview and produce the official document
6. The Payroll Examination section (16–17b) is intentionally left blank — the payroll examiner completes and signs this section separately after comparing the form against certified payroll records for that week

### Generating the PDF (v2.7.0)

Tap **Generate PDF** to produce the official document directly - no print
dialog, no browser headers or footers, and the file is named automatically
using the smart filename. If direct download misbehaves on a device, use
**Open in Browser** and save from the PDF viewer or share sheet. Legacy
browser-print code remains in the source as a rollback path but is not part of
the normal v2.7.0 user workflow; it is scheduled for removal in v2.8.0.

Long entries in Items 5, 6, 7, 13, and 14 automatically continue in Item 18
with continuation markers; the entry form shows length guidance as you type.

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

This tool is a small set of static files with no build steps or server requirements:

| File | Purpose |
|---|---|
| `index.html` | The application |
| `build-hud11-doc.js` | PDF layout module (official HUD-11 reconstruction) |
| `pdfmake.min.js` | PDF engine (pinned 0.2.23, vendored) |
| `arimo-vfs.js` | Arimo Regular/Bold fonts (SIL OFL 1.1, vendored) |
| `LICENSE-Arimo.txt` | Font license |
| `CHANGELOG.md`, `PROJECT.md` | History and maintainer primer |
| `DEVICE_TEST_PROTOCOL.md` | Four-device validation and regression checklist |
| `HUD11_User_Support_Guide_v2.7.0.docx` | End-user workflow and troubleshooting guide |

All files must be deployed together in the repository root. The tool remains
fully offline-capable once loaded.

### Initial Setup

1. Create a new GitHub repository (e.g., `hud11-interview`)
2. Go to **Settings → Pages → Source: Deploy from branch → main / (root)**
3. Upload all files listed above to the repository root
4. Commit

### Updating

1. Retain a ZIP of the currently deployed files for rollback
2. Upload the complete release file set to the repository root
3. Commit with a descriptive release message
4. Wait for GitHub Pages to redeploy
5. Run a hosted smoke test on Windows and iPad

---

## Privacy & Confidentiality

Per HUD policy, the information collected on Form HUD-11 is considered **sensitive** and is protected by the Privacy Act. Interview data stored in this tool should be treated accordingly:

- Do not use shared or public computers to conduct interviews
- Export and store backup files in a secure location
- PDF exports containing signatures and personal information should be stored and transmitted securely
- The employee's participation in the interview is voluntary and their responses are confidential

---

## Roadmap

- [ ] Multi-project management (filter interviews by project)
- [ ] Week summary export (all interviews for a given payroll week)
- [ ] SaaS migration to DreamHost with PHP/MySQL backend and user login
- [ ] Payroll Examiner sign-off flow (separate access link or PIN)

---

## Tech Notes

- Multi-file static application — no framework or build pipeline; pdfmake and Arimo are pinned and vendored locally
- Signatures use HTML5 Canvas API with touch event support for iPad/stylus
- Signature data stored as base64 PNG in localStorage
- Direct PDF layout is defined in `build-hud11-doc.js`; legacy CSS/browser-print code remains only as a rollback path pending removal in v2.8.0
- Language switching is handled entirely client-side; English and Spanish application strings are stored in `index.html`, with official PDF strings in the PDF builder
- `localStorage` is the only storage mechanism; migrating to a backend requires only replacing the `getAll()` and `saveAll()` functions

---

## License

Software: © Labor Compliance Solutions. All rights reserved.  
Form HUD-11 content: U.S. Department of Housing and Urban Development — public domain.

---

*Labor Compliance Solutions · https://github.com/robvilla14*
