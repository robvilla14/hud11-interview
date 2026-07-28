/* =============================================================================
   build-hud11-doc.js  --  HUD-11 PDF document builder (pdfmake layout module)
   Version: v2.7.0
   =============================================================================

   WHAT THIS FILE IS
   -----------------
   This file builds the pdfmake "document definition" for the HUD-11 Record of
   Employee Interview, reconstructing the official Form HUD-11 (03/2025) in
   English and Spanish. It is the single source of truth for the printed form
   layout. The main application (index.html) collects the interview data; this
   file turns one interview record into a PDF.

   It is written for a non-developer maintainer. Every section explains what it
   does and why. If HUD revises the form (OMB expiration 03/31/2028), the
   sections you will need to touch are GEOMETRY (measurements) and STRINGS
   (label wording). The procedure is documented in PROJECT.md.

   HOW THE LAYOUT WORKS (important design decision)
   ------------------------------------------------
   Page 1 of the HUD-11 is a fixed federal grid. Instead of asking pdfmake's
   table engine to approximate it (tables grow with content, which is exactly
   what we must never allow), this builder draws the page ABSOLUTELY:

     - All borders, rules and checkboxes are drawn as vector shapes ("canvas"
       items in pdfmake) at exact measured coordinates.
     - All text is pre-wrapped by our own fitting engine (section FIT below)
       and placed line by line at exact coordinates.

   Because nothing on page 1 is laid out by pdfmake's flow engine, page 1
   geometry is fixed BY CONSTRUCTION. Long content cannot move a border by
   even a point: the fitting engine either shrinks the text one approved step
   (8pt -> 7pt -> 6.5pt for short fields) or carries the remainder to Item 18.

   WHERE THE NUMBERS COME FROM
   ---------------------------
   Every coordinate in GEOMETRY was measured from the two official PDFs
   supplied by Rob on 2026-07-17 (vector extraction + 150 dpi raster
   verification; see tools/official-geometry-reference.json for the raw
   extraction). Units are PDF points; 72 points = 1 inch; page is US Letter,
   612 x 792. The origin is the TOP-LEFT corner (pdfmake convention).

   The English and Spanish official editions have DIFFERENT vertical geometry
   (the Spanish burden statement is longer, so its grid starts 13.8 pt lower
   and Items 16-17 are compressed). That is why GEOMETRY has one complete
   block per language.

   ============================================================================= */

(function (root, factory) {
  /* Loader shim: in the browser this attaches window.HUD11DOC;
     in Node (used by the PoC verification tooling) it exports a module. */
  if (typeof module === "object" && module.exports) { module.exports = factory(); }
  else { root.HUD11DOC = factory(); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ===========================================================================
     SECTION: GEOMETRY
     Measured constants from the official 03/2025 editions. Do not edit these
     without remeasuring an official PDF (procedure in PROJECT.md).
     =========================================================================== */

  var PAGE = { width: 612, height: 792 };     /* US Letter, points            */
  var GRID = { left: 18, right: 594 };        /* both editions, both margins  */
  var MID  = 284.8;                           /* main vertical divider x      */
  var RULE_W = 0.5;                           /* measured stroke width        */
  var BOX = 10.3;                             /* standard checkbox side       */
  var BOX_2D = 11.5;                          /* Item 2d checkbox side (larger
                                                 on the official form)        */

  var GEOMETRY = {
    EN: {
      /* --- header zone ----------------------------------------------------- */
      titleBand: { top: 30.6, bottom: 63.4,
                   cells: [18, 178.3, 442.4, 593.5] }, /* title|agency|OMB   */
      burdenTop: 66.5,          /* first baseline-top of the burden statement */
      noteTop:   132.9,         /* "Note:" legibility line                    */
      gridTop:   143.9,

      /* --- row boundaries (top edge of each rule), page-top coordinates ---- */
      rows: {
        r1:   143.9,   /* 1a | 2a                                            */
        r2:   172.0,   /* 1b | 2b                                            */
        r3:   200.0,   /* 1c (spans to r4 bottom) | 2c                       */
        r2d:  246.6,   /* right side only: 2d                                */
        rD:   274.9,   /* 3a 3b 3c 4a 4b 4c                                  */
        r5:   336.6,
        r6:   364.8,
        r7:   392.9,
        band: 429.0,   /* open band: 8 8a 9 | 10 11 (NO internal rules)      */
        r12:  514.3,   /* 12a | 12b                                          */
        r13:  542.4,
        r14:  577.5,
        r15:  610.1,   /* 15a | 15b | 15c                                    */
        rPay: 638.3,   /* "Payroll Examination" heading band                 */
        r16:  662.8,
        r17:  711.5,   /* 17a | 17b                                          */
        gridBottom: 738.5
      },

      /* --- column x-boundaries for the multi-column rows ------------------- */
      colsD:  [18, 104.2, 194.2, 284.2, 383.2, 518.2, 594], /* 3a 3b 3c 4a 4b 4c */
      cols15: [18, 248.2, 443.9, 594],                      /* 15a 15b 15c       */
      div17:  308.5,                                        /* 17a | 17b         */

      /* --- checkbox positions [x, top] ------------------------------------- */
      cb: {
        d2:   [[307.4, 257.7], [352.5, 257.7]],             /* 2d Yes / No       */
        med:  [[450.8, 294.8], [493.2, 294.8]],             /* 4b Medical Y / N  */
        pen:  [[450.8, 307.3], [493.2, 307.3]],             /* 4b Pension Y / N  */
        i8:   [[175.7, 444.8], [202.7, 444.8]],             /* 8   Y / N         */
        i8a:  [[175.7, 470.4], [203.6, 470.3]],             /* 8a  Y / N         */
        i9:   [[175.7, 490.7], [202.7, 490.7]],             /* 9   Y / N         */
        i10:  [[549.1, 444.8], [580.7, 444.8]],             /* 10  Y / N         */
        i11:  [[549.1, 490.7], [580.7, 490.7]]              /* 11  Y / N         */
      },
      /* 4b / 4c interior anchors, measured from the official EN edition:
         Yes/No WORDS sit at fixed x columns with their boxes after them.    */
      fourB: { labelX: 388.8, yesX: 433.8, noX: 478.8,
               medTops: [297.6], penTop: 310.1 },
      fourC: { labelX: 523.8, optTops: [295.6, 306.2, 316.7, 327.3] },
      ynHeaderTop: 432.6,       /* "Y   N" mini-headers above the band boxes  */

      /* --- band question label tops (open band, whitespace separated) ------ */
      bandLabels: { i8: 444.9, i8a: 469.2, i9: 490.7, i10: 444.9, i11: 490.7,
                    rightX: 226.8 },

      footerTop: 740.1
    },

    SP: {
      titleBand: { top: 26.0, bottom: 61.1,
                   cells: [18, 178.3, 442.4, 593.5] },
      burdenTop: 64.2,
      noteTop:   146.7,
      gridTop:   157.7,
      rows: {
        r1:   157.7,
        r2:   185.8,
        r3:   213.8,
        r2d:  260.4,
        rD:   288.7,
        r5:   353.6,
        r6:   381.7,
        r7:   409.8,
        band: 445.9,
        r12:  528.4,
        r13:  556.4,
        r14:  591.4,
        r15:  624.1,
        rPay: 652.3,
        r16:  676.7,
        r17:  719.8,
        gridBottom: 746.8
      },
      colsD:  [18, 104.2, 194.2, 284.2, 383.2, 518.2, 594],
      cols15: [18, 248.2, 443.9, 594],
      div17:  308.5,
      cb: {
        d2:   [[301.3, 271.5], [346.3, 271.5]],
        med:  [[444.7, 308.6], [493.2, 308.6]],
        pen:  [[444.7, 333.1], [493.2, 333.1]],
        i8:   [[175.7, 461.9], [202.7, 461.9]],
        i8a:  [[175.7, 487.5], [203.6, 487.3]],
        i9:   [[175.7, 504.7], [202.7, 504.7]],
        i10:  [[549.1, 461.9], [580.7, 461.9]],
        i11:  [[549.1, 504.7], [580.7, 504.7]]
      },
      /* SP edition: "Seguro medico" wraps to TWO lines on the official form;
         Si/No word columns share the EN x positions.                        */
      fourB: { labelX: 388.8, yesX: 433.8, noX: 478.8,
               medTops: [311.4, 323.4], penTop: 335.9 },
      fourC: { labelX: 523.8, optTops: [309.4, 320.0, 330.5, 341.1] },
      ynHeaderTop: 449.7,       /* SP prints "Si / No" beside boxes; kept for
                                   the band header line position              */
      bandLabels: { i8: 461.9, i8a: 483.3, i9: 504.6, i10: 461.9, i11: 504.6,
                    rightX: 226.8 },
      footerTop: 749.8
    }
  };

  /* Typography: measured from the official form (Arial there, Arimo here;
     the two are metrically compatible). */
  var FONT = {
    title: 14,        /* form title, bold                                     */
    agency: 10,       /* agency block in the title band                       */
    omb: 9,           /* OMB approval block                                   */
    burden: 7,        /* burden / Privacy Act statement                       */
    label: 7,         /* field labels, bold                                   */
    value: 8,         /* entry values (normal size, fallback ladder below)    */
    payband: 10,      /* "Payroll Examination" heading, bold                  */
    footer: 8
  };
  var LINE_H = { 8: 9.2, 7: 8.1, 6.5: 7.5 };  /* line heights per size        */

  /* Approved fallback ladders (Phase A scope, micro-decision d):
     narrative fields stop at 7 pt; short fields may go to 6.5 pt;
     after the floor, the remainder is carried to Item 18. */
  var LADDER = { narrative: [8, 7], short: [8, 7, 6.5] };

  /* ===========================================================================
     SECTION: STRINGS
     Label wording is locked VERBATIM to the supplied official PDFs.
     Do not re-word without a new official edition.
     =========================================================================== */

  var STRINGS = {
    EN: {
      titleLines: ["Record of", "Employee Interview"],
      agency: ["U.S. Department of Housing and Urban Development",
               "Office of Davis-Bacon and Labor Standards"],
      omb: ["OMB Approval No. 2501-0009", "(exp. 03/31/2028)"],
      burden: "Public reporting burden for this collection of information is estimated to average 15 minutes per response, including the time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and completing and reviewing the collection of information. This agency may not collect this information, and you are not required to complete this form, unless it displays a currently valid OMB control number. The information is collected to ensure compliance with the Federal labor standards by recording interviews with construction workers. The information collected will assist HUD in the conduct of compliance monitoring; the information will be used to test the veracity of certified payroll reports submitted by the employer. Sensitive Information. The information collected on this form is considered sensitive and is protected by the Privacy Act. The Privacy Act requires that these records be maintained with appropriate administrative, technical, and physical safeguards to ensure their security and confidentiality. In addition, these records should be protected against any anticipated threats or hazards to their security or integrity that could result in substantial harm, embarrassment, inconvenience, or unfairness to any individual on whom the information is maintained. The information collected herein is voluntary, and any information provided shall be kept confidential.",
      sensitiveLeadIn: "Sensitive Information.",   /* underlined run          */
      note: "Note: Please ensure responses are legible and easy to read.",
      labels: {
        f1a: "1a. Project Name",
        f1b: "1b. Project Number",
        f1c: "1c. Contractor or Subcontractor (Employer\u2014not individual\u2019s name or supervisor\u2019s name)",
        f2a: "2a. Employee\u2019s Full Name",
        f2b: "2b. Employee\u2019s Phone Number (including area code) and Email Address",
        f2c: "2c. Employee\u2019s Home Address & Zip Code",
        f2d: "2d. Verification of identification?",
        f3a: "3a. How long on this job and average weekly hours worked?",
        f3b: "3b. Last date on this job before today?",
        f3c: "3c. Number of hours last day on this job?",
        f4a: "4a. Hourly Rate of Pay",
        f4b: "4b. Fringe benefits?",
        f4c: "4c.  Frequency of Pay:",
        f5:  "5. Your Job Classification(s) (list all and continue on a separate sheet if necessary):",
        f6:  "6. Your Duties:",
        f7:  "7. Tools or Equipment Used:",
        f8:  "8. Are you an apprentice or trainee?",
        f8a: "8a. Have you provided a copy of your apprenticeship certificate?",
        f9:  "9. Are you paid for all hours worked?",
        f10: "10. Are you paid at least time and \u00bd (1.5x regular hourly rate) for all hours worked in excess of 40 in a week?",
        f11: "11. Have you ever been threatened or coerced into giving up any part of your pay?",
        f12a: "12a. Employee Signature",
        f12b: "12b. Date",
        f13: "13. Duties Observed by the Interviewer (Please be specific):",
        f14: "14. Remarks",
        f15a: "15a. Interviewer Name (please print)",
        f15b: "15b. Signature of Interviewer",
        f15c: "15c. Date of Interview",
        payband: "Payroll Examination",
        f16: "16. Remarks",
        f17a: "17a. Signature of Payroll Examiner",
        f17b: "17b. Date",
        f18: "18. Additional Remarks",
        f18cont: "18. Additional Remarks (continued)"
      },
      yes: "Yes", no: "No", yHdr: "Y", nHdr: "N",
      medical: "Medical", pension: "Pension",
      freq: ["Weekly", "Biweekly", "Semi-monthly", "Other"],
      footerLeft: "Previous editions are obsolete",
      footerRight: "Form HUD-11 (03/2025)",
      contMarker: "(continued in Item 18)",
      contPrefix: function (n) { return "Item " + n + " (continued):"; },
      addlHeading: "Additional Remarks",
      attachLabel: "8a. Apprenticeship Certificate \u2014 Attachment",
      seeAttach: "(see attachment)",
      docTitle: "Record of Employee Interview",
      fileLabel: "Employee Interview"   /* production filename label, preserved */
    },

    SP: {
      titleLines: ["Historial de Entrevista", "del Empleado"],
      agency: ["Departamento de Vivienda y Desarrollo Urbano de",
               "los EE. UU.",
               "Oficina de Davis-Bacon y Normas Laborales"],
      omb: ["N\u00fam. de Aprobaci\u00f3n de la OMB", "2501-0009", "(exp. 03/31/2028)"],
      burden: "Se estima que la carga del p\u00fablico para reportar datos para esta recopilaci\u00f3n de informaci\u00f3n es de un promedio de 15 minutos por respuesta. Esto incluye el tiempo para revisar las instrucciones, buscar en las fuentes de datos existentes, recopilar y mantener los datos requeridos, as\u00ed como completar y revisar la recopilaci\u00f3n de informaci\u00f3n. Esta agencia no puede recopilar esta informaci\u00f3n, ni est\u00e1 usted obligado a completar este formulario, a menos que muestre un n\u00famero de control v\u00e1lido de la Oficina de Gesti\u00f3n y Presupuesto (OMB, por sus siglas en ingl\u00e9s). Se recopila la informaci\u00f3n para garantizar el cumplimiento de las normas laborales federales mediante la grabaci\u00f3n de entrevistas realizadas con los trabajadores de la construcci\u00f3n. La informaci\u00f3n recopilada ayudar\u00e1 a HUD en la monitorizaci\u00f3n de cumplimiento; la informaci\u00f3n ser\u00e1 utilizada para examinar la veracidad de los informes de n\u00f3mina certificados presentados por el empleador. Informaci\u00f3n confidencial. La informaci\u00f3n recopilada en este formulario se considera confidencial y est\u00e1 protegida por La Ley de Privacidad. La Ley de Privacidad exige que se mantenga esta informaci\u00f3n con las protecciones administrativas, t\u00e9cnicas y f\u00edsicas apropiadas para garantizar su seguridad y confidencialidad. Adem\u00e1s, se debe proteger esta informaci\u00f3n contra cualquier amenaza o da\u00f1o anticipado a su seguridad o integridad que pueda resultar en el da\u00f1o, verg\u00fcenza, inconveniencia, o injusticia sustancial de cualquier individuo cuya informaci\u00f3n se conserve. La informaci\u00f3n recopilada aqu\u00ed es voluntaria y cualquier dato proporcionado ser\u00e1 tratado de manera confidencial.",
      sensitiveLeadIn: "Informaci\u00f3n confidencial.",
      note: "Aviso: Por favor, aseg\u00farese de que sus respuestas sean legibles y f\u00e1ciles para leer.",
      labels: {
        f1a: "1a. Nombre del proyecto",
        f1b: "1b. N\u00famero del proyecto",
        f1c: "1c. Contratista o subcontratista (Patr\u00f3n \u2013 no el nombre del individuo ni del supervisor)",
        f2a: "2a. Nombre completo del empleado",
        f2b: "2b. N\u00famero de tel\u00e9fono (incluido el prefijo local) y direcci\u00f3n de correo electr\u00f3nico del empleado",
        f2c: "2c. Direcci\u00f3n residencial y c\u00f3digo postal del empleado",
        f2d: "2d. \u00bfVerificaci\u00f3n de identificaci\u00f3n?",
        f3a: "3a. \u00bfCu\u00e1nto tiempo lleva en este trabajo y cu\u00e1l es el promedio de las horas trabajadas por semana?",
        f3b: "3b. \u00bf\u00daltima fecha en este trabajo antes de hoy?",
        f3c: "3c. \u00bfCu\u00e1ntas horas trabajadas en su \u00faltimo d\u00eda en este trabajo?",
        f4a: "4a. Salario por hora",
        f4b: "4b. \u00bfBeneficios complementarios?",
        f4c: "4c. Frecuencia de pago:",
        f5:  "5. La(s) clasificaci\u00f3n(es) de su trabajo (enumere todas y contin\u00fae en hoja separada si es necesario):",
        f6:  "6. Sus deberes:",
        f7:  "7. Herramientas o equipo utilizados:",
        f8:  "8. \u00bfEs aprendiz o est\u00e1 en capacitaci\u00f3n?",
        f8a: "8a. \u00bfHa proporcionado una copia de su certificado de aprendizaje?",
        f9:  "9. \u00bfLe pagan todas las horas que trabaja?",
        f10: "10. \u00bfLe pagan al menos tiempo y medio (1.5 veces su salario regular por hora) por todas las horas trabajadas que exceden las 40 horas semanales?",
        f11: "11. \u00bfAlguna vez le han amenazado o coaccionado a entregar parte de su paga?",
        f12a: "12a. Firma del empleado",
        f12b: "12b. Fecha",
        f13: "13. Deberes observados por el entrevistador (Por favor sea espec\u00edfico):",
        f14: "14. Comentarios",
        f15a: "15a. Nombre del entrevistador (use letra de molde)",
        f15b: "15b. Firma del entrevistador",
        f15c: "15c. Fecha de la entrevista",
        payband: "Examinaci\u00f3n de N\u00f3mina",
        f16: "16. Comentarios",
        f17a: "17a. Firma del examinador de n\u00f3mina",
        f17b: "17b. Fecha",
        f18: "18. Comentarios adicionales",
        f18cont: "18. Comentarios adicionales (continuaci\u00f3n)"
      },
      yes: "S\u00ed", no: "No", yHdr: "S\u00ed", nHdr: "No",
      medical: "Seguro m\u00e9dico", pension: "Pensi\u00f3n",
      freq: ["Semanal", "Quincenal", "Semimensual", "Otro"],
      footerLeft: "Toda publicaci\u00f3n previa queda obsoleta",
      footerRight: "Formulario HUD-11 (03/2025)",
      contMarker: "(contin\u00faa en \u00cdtem 18)",
      contPrefix: function (n) { return "\u00cdtem " + n + " (continuaci\u00f3n):"; },
      addlHeading: "Comentarios adicionales",
      attachLabel: "8a. Certificado de Aprendizaje \u2014 Anexo",
      seeAttach: "(ver anexo)",
      docTitle: "Historial de Entrevista del Empleado",
      fileLabel: "Historial de Entrevista del Empleado"
    }
  };

  /* ===========================================================================
     SECTION: MEASURE
     Text measurement is injected, because it differs by environment:
       - Browser (index.html / PoC harness): a canvas 2D context with the
         vendored Arimo fonts loaded via FontFace. Real font metrics, offline.
       - Node (verification tooling): fontkit reading the same TTFs. Exact.
     The measurer must be a function measure(text, sizePt, bold) -> width in pt.
     A 3% safety margin is applied here, once, so callers never forget it.
     =========================================================================== */

  var _rawMeasure = null;
  var SAFETY = 1.03;

  function setMeasurer(fn) { _rawMeasure = fn; }
  function measure(text, size, bold) {
    if (!_rawMeasure) { throw new Error("HUD11DOC: no measurer installed. Call setMeasurer() first."); }
    return _rawMeasure(text, size, bold) * SAFETY;
  }

  /* ===========================================================================
     SECTION: WRAP
     Greedy word wrap with the approved long-token fallback ladder:
       1. normal word boundaries (spaces; nonbreaking spaces treated as
          breakable for wrapping, original text left untouched),
       2. sensible punctuation breakpoints (break AFTER  @ . / - _ , ;ATCH),
       3. Unicode-safe character boundary (never inside a surrogate pair,
          never between a base character and a combining mark).
     Returns an array of line strings whose measured widths all fit maxW.
     =========================================================================== */

  var PUNCT_BREAK = /[@.\/\-_,;]/;

  function isCombining(ch) {
    var c = ch.codePointAt(0);
    return (c >= 0x0300 && c <= 0x036f) || (c >= 0x1ab0 && c <= 0x1aff) ||
           (c >= 0x20d0 && c <= 0x20ff);
  }

  /* Split an over-long single token at the widest prefix that fits. */
  function breakToken(token, size, bold, maxW) {
    /* pass 1: try punctuation breakpoints, rightmost that fits              */
    var best = -1;
    for (var i = 0; i < token.length - 1; i++) {
      if (PUNCT_BREAK.test(token[i]) &&
          measure(token.slice(0, i + 1), size, bold) <= maxW) { best = i + 1; }
    }
    if (best > 0) { return [token.slice(0, best), token.slice(best)]; }
    /* pass 2: character boundary, Unicode-safe                              */
    var cut = 0, w = 0;
    var i2 = 0;
    while (i2 < token.length) {
      var cp = token.codePointAt(i2);
      var step = cp > 0xffff ? 2 : 1;
      var end = i2 + step;
      while (end < token.length && isCombining(token[end])) { end++; }
      if (measure(token.slice(0, end), size, bold) > maxW) { break; }
      cut = end; i2 = end;
    }
    if (cut === 0) { cut = 1; } /* pathological: maxW narrower than one glyph */
    return [token.slice(0, cut), token.slice(cut)];
  }

  function wrap(text, size, bold, maxW) {
    var out = [];
    var paras = String(text == null ? "" : text).split(/\r?\n/);
    for (var p = 0; p < paras.length; p++) {
      /* U+00A0 nonbreaking space: breakable for wrapping (approved rule)    */
      var words = paras[p].replace(/\u00a0/g, " ").split(" ").filter(function (w) { return w.length; });
      if (!words.length) { out.push(""); continue; }
      var line = "";
      var qi = 0;
      while (qi < words.length) {
        var word = words[qi];
        var cand = line ? line + " " + word : word;
        if (measure(cand, size, bold) <= maxW) { line = cand; qi++; continue; }
        if (!line) {
          /* single token wider than the cell: apply the token ladder        */
          var parts = breakToken(word, size, bold, maxW);
          out.push(parts[0]);
          words[qi] = parts[1];
          continue;
        }
        out.push(line); line = "";
      }
      if (line) { out.push(line); }
    }
    return out;
  }

  /* ===========================================================================
     SECTION: FIT
     Fits one field's text into a fixed box using the approved ladder.
     Returns { size, lines, carried } where `carried` is the text that must be
     continued in Item 18 ("" when everything fits). Nothing is ever dropped:
     lines + carried always reassemble to the full input text.
     =========================================================================== */

  function fitField(text, box, kind, lang) {
    /* box: { w: usable width, h: usable height }                            */
    var ladder = LADDER[kind] || LADDER.narrative;
    var t = String(text == null ? "" : text);
    if (!t.trim()) { return { size: FONT.value, lines: [], carried: "" }; }

    for (var s = 0; s < ladder.length; s++) {
      var size = ladder[s];
      var lines = wrap(t, size, false, box.w);
      if (lines.length * LINE_H[size] <= box.h) {
        return { size: size, lines: lines, carried: "" };
      }
    }
    /* Floor reached and still too long: keep the head that fits WITH the
       continuation marker on its final line, carry the remainder.           */
    var floor = ladder[ladder.length - 1];
    var marker = STRINGS[lang].contMarker;
    var maxLines = Math.max(1, Math.floor(box.h / LINE_H[floor]));
    var all = wrap(t, floor, false, box.w);
    var keep = all.slice(0, maxLines);
    /* make room for the marker on the last kept line                        */
    var lastWords = keep[maxLines - 1].split(" ");
    while (lastWords.length &&
           measure(lastWords.join(" ") + " " + marker, floor, false) > box.w) {
      lastWords.pop();
    }
    var keptLast = lastWords.join(" ");
    /* reconstruct carried text = everything not kept, verbatim              */
    var keptText = keep.slice(0, maxLines - 1).concat(keptLast ? [keptLast] : []).join(" ");
    var carried = t.replace(/\s+/g, " ").trim().slice(keptText.replace(/\s+/g, " ").trim().length).trim();
    keep[maxLines - 1] = (keptLast ? keptLast + " " : "") + marker;
    return { size: floor, lines: keep, carried: carried };
  }

  /* ===========================================================================
     SECTION: PRIMITIVES
     Small helpers that produce pdfmake nodes at absolute positions.
     `cv` accumulates vector shapes; `tx` accumulates text nodes.
     =========================================================================== */

  function Sheet() { this.cv = []; this.tx = []; }

  Sheet.prototype.hline = function (x1, x2, y) {
    this.cv.push({ type: "line", x1: x1, y1: y, x2: x2, y2: y, lineWidth: RULE_W });
  };
  Sheet.prototype.vline = function (x, y1, y2) {
    this.cv.push({ type: "line", x1: x, y1: y1, x2: x, y2: y2, lineWidth: RULE_W });
  };
  Sheet.prototype.box = function (x, y, side, checked) {
    this.cv.push({ type: "rect", x: x, y: y, w: side, h: side, lineWidth: RULE_W });
    if (checked) {
      /* filled inner square, matching the current tool's clear "checked"
         presentation (the official blank form shows empty boxes only)       */
      this.cv.push({ type: "rect", x: x + 1.8, y: y + 1.8, w: side - 3.6, h: side - 3.6,
                     color: "black" });
    }
  };
  Sheet.prototype.text = function (str, x, y, size, bold, opts) {
    var n = { text: str, absolutePosition: { x: x, y: y },
              fontSize: size, bold: !!bold };
    if (opts) { for (var k in opts) { n[k] = opts[k]; } }
    this.tx.push(n);
  };
  /* Write pre-wrapped lines downward from y. Returns the y after the block. */
  Sheet.prototype.lines = function (lines, x, y, size, bold) {
    for (var i = 0; i < lines.length; i++) {
      this.text(lines[i], x, y + i * LINE_H[size], size, bold);
    }
    return y + lines.length * LINE_H[size];
  };
  Sheet.prototype.image = function (dataUrl, x, y, fitW, fitH) {
    this.tx.push({ image: dataUrl, absolutePosition: { x: x, y: y },
                   fit: [fitW, fitH] });
  };

  var LABEL_DX = 5.4;   /* label inset from cell left edge (measured)         */
  var LABEL_DY = 1.7;   /* label inset from cell top edge (measured)          */
  var VAL_PAD  = 2.0;   /* gap between label block and value block            */

  /* ===========================================================================
     SECTION: PAGE 1 BUILDER
     Draws the complete Items 1a-17b page for one language at measured
     coordinates. Returns the fitReport fragments for every fitted field.
     =========================================================================== */

  function labelBlock(sheet, str, x, y, maxW) {
    /* Labels are static; wrap them with the same engine for consistency.    */
    var lines = wrap(str, FONT.label, true, maxW);
    sheet.lines(lines, x, y, FONT.label, true);
    return y + lines.length * LINE_H[7];
  }

  /* One bordered field: label at top, value below, overflow per ladder.     */
  function field(sheet, report, lang, id, label, value, x1, x2, yTop, yBot, kind) {
    var innerW = (x2 - x1) - 2 * LABEL_DX;
    var yAfterLabel = labelBlock(sheet, label, x1 + LABEL_DX, yTop + LABEL_DY, innerW);
    var boxH = yBot - VAL_PAD - yAfterLabel;
    var fit = fitField(value, { w: innerW, h: Math.max(0, boxH) }, kind, lang);
    sheet.lines(fit.lines, x1 + LABEL_DX, yAfterLabel + VAL_PAD, fit.size, false);
    /* cell + fitted lines are recorded so tools/verify-fit.py can audit the
       generated PDF independently (containment, line counts, no-loss).      */
    report.push({ field: id, size: fit.size, lines: fit.lines.length,
                  fitLines: fit.lines, carried: fit.carried,
                  cell: { x1: x1, x2: x2, yTop: yTop, yBot: yBot,
                          valTop: yAfterLabel + VAL_PAD } });
    return fit.carried ? { item: id, text: fit.carried } : null;
  }

  function ynPair(sheet, S, pair, state, side, spLabels) {
    /* state: true = Yes checked, false = No checked, null = neither.
       SP edition prints "Si"/"No" words beside each box.                    */
    sheet.box(pair[0][0], pair[0][1], side, state === true);
    sheet.box(pair[1][0], pair[1][1], side, state === false);
    if (spLabels) {
      sheet.text(S.yes, pair[0][0] - measure(S.yes, 7, false) - 2, pair[0][1] + 1.2, 7, false);
      sheet.text(S.no,  pair[1][0] - measure(S.no, 7, false) - 2,  pair[1][1] + 1.2, 7, false);
    }
  }

  function buildPage1(iv, lang, report, carries) {
    var G = GEOMETRY[lang], S = STRINGS[lang], L = S.labels, R = G.rows;
    var sheet = new Sheet();
    var sp = (lang === "SP");

    /* ---- title band (bordered three-cell table) ------------------------- */
    var tb = G.titleBand;
    sheet.hline(GRID.left, GRID.right, tb.top);
    sheet.hline(GRID.left, GRID.right, tb.bottom);
    for (var c = 0; c < tb.cells.length; c++) { sheet.vline(tb.cells[c], tb.top, tb.bottom); }
    sheet.text(S.titleLines[0], tb.cells[0] + 5.6, tb.top + 2.6, FONT.title, true);
    sheet.text(S.titleLines[1], tb.cells[0] + 5.6, tb.top + 18.7, FONT.title, true);
    var ay = tb.top + 2.0;
    for (var a = 0; a < S.agency.length; a++) {
      sheet.text(S.agency[a], tb.cells[1] + 5.7, ay, FONT.agency, false);
      ay += 10.6;
    }
    var oy = tb.top + 1.9;
    for (var o = 0; o < S.omb.length; o++) {
      var ow = measure(S.omb[o], FONT.omb, true) / SAFETY;
      sheet.text(S.omb[o], GRID.right - 0.5 - 4.0 - ow, oy, FONT.omb, true);
      oy += 9.6;
    }

    /* ---- burden statement (unboxed) + legibility note ------------------- */
    var bw = GRID.right - GRID.left;
    var blines = wrap(S.burden, FONT.burden, false, bw);
    sheet.lines(blines, GRID.left, G.burdenTop, FONT.burden, false);
    sheet.text(S.note, GRID.left, G.noteTop, FONT.burden, true);

    /* ---- grid horizontal rules ------------------------------------------ */
    var fullRules = [R.r1, R.rD, R.r5, R.r6, R.r7, R.r12, R.r13, R.r14, R.r15,
                     R.rPay, R.r16, R.r17, R.gridBottom];
    for (var h = 0; h < fullRules.length; h++) { sheet.hline(GRID.left, GRID.right, fullRules[h]); }
    sheet.hline(GRID.left, GRID.right, R.r2);           /* 1b/2b rule         */
    sheet.hline(GRID.left, GRID.right, R.r3);           /* 1c/2c rule         */
    sheet.hline(MID, GRID.right, R.r2d);                /* 2d rule, right only */
    /* band top/bottom: drawn FULL WIDTH (approved deviation; the official
       file interrupts these rules across the checkbox column, an authoring
       artifact -- see PROJECT.md)                                           */
    sheet.hline(GRID.left, GRID.right, R.band);

    /* ---- vertical rules ------------------------------------------------- */
    sheet.vline(GRID.left, R.r1, R.gridBottom);
    sheet.vline(GRID.right, R.r1, R.gridBottom);
    sheet.vline(MID, R.r1, R.rD);                       /* halves, rows 1-2d  */
    for (var cd = 1; cd < G.colsD.length - 1; cd++) {   /* row D columns      */
      sheet.vline(G.colsD[cd], R.rD, R.r5);
    }
    sheet.vline(MID, R.r12, R.r13);                     /* 12a | 12b          */
    sheet.vline(G.cols15[1], R.r15, R.rPay);            /* 15 columns         */
    sheet.vline(G.cols15[2], R.r15, R.rPay);
    sheet.vline(G.div17, R.r17, R.gridBottom);          /* 17a | 17b          */

    /* ---- simple labeled fields ------------------------------------------ */
    function carry(x) { if (x) { carries.push(x); } }
    carry(field(sheet, report, lang, "1a", L.f1a, iv.projectName, GRID.left, MID, R.r1, R.r2, "short"));
    carry(field(sheet, report, lang, "2a", L.f2a, iv.employeeName, MID, GRID.right, R.r1, R.r2, "short"));
    carry(field(sheet, report, lang, "1b", L.f1b, iv.projectNumber, GRID.left, MID, R.r2, R.r3, "short"));
    carry(field(sheet, report, lang, "2b", L.f2b, [iv.phone, iv.email].filter(Boolean).join("   "), MID, GRID.right, R.r2, R.r3, "short"));
    carry(field(sheet, report, lang, "1c", L.f1c, iv.contractor, GRID.left, MID, R.r3, R.rD, "short"));
    carry(field(sheet, report, lang, "2c", L.f2c, iv.address, MID, GRID.right, R.r3, R.r2d, "short"));

    /* 2d: label + Yes/No boxes (larger 11.5 pt boxes, per official)         */
    labelBlock(sheet, L.f2d, MID + LABEL_DX, R.r2d + LABEL_DY, GRID.right - MID - 2 * LABEL_DX);
    ynPair(sheet, S, G.cb.d2, iv.idVerified === "yes" ? true : iv.idVerified === "no" ? false : null, BOX_2D, true);
    report.push({ field: "2d", size: FONT.label, lines: 1, carried: "" });

    /* row D                                                                  */
    var D = G.colsD;
    carry(field(sheet, report, lang, "3a", L.f3a, iv.timeOnJob, D[0], D[1], R.rD, R.r5, "short"));
    carry(field(sheet, report, lang, "3b", L.f3b, iv.lastDate, D[1], D[2], R.rD, R.r5, "short"));
    carry(field(sheet, report, lang, "3c", L.f3c, iv.hoursLastDay, D[2], D[3], R.rD, R.r5, "short"));
    carry(field(sheet, report, lang, "4a", L.f4a, iv.hourlyRate, D[3], D[4], R.rD, R.r5, "short"));

    /* 4b fringe benefits. All anchors are MEASURED from the official form:
       the label at fourB.labelX, the Yes/No WORDS at fixed x columns
       (yesX / noX) with their checkboxes after them, and the Medical label
       wrapping to two lines on the Spanish edition exactly as the official
       does ("Seguro" / "medico").                                           */
    var FB = G.fourB;
    labelBlock(sheet, L.f4b, FB.labelX, R.rD + LABEL_DY, D[5] - FB.labelX - LABEL_DX);
    var medWords = S.medical.split(" ");
    for (var mw = 0; mw < FB.medTops.length; mw++) {
      /* one word per measured line when the official wraps (SP), otherwise
         the whole label on the single measured line (EN)                    */
      var mtxt = FB.medTops.length > 1 ? (medWords[mw] || "") : S.medical;
      sheet.text(mtxt, FB.labelX, FB.medTops[mw], 7, false);
    }
    sheet.text(S.pension, FB.labelX, FB.penTop, 7, false);
    sheet.text(S.yes, FB.yesX, FB.medTops[0], 7, false);
    sheet.text(S.no,  FB.noX,  FB.medTops[0], 7, false);
    sheet.text(S.yes, FB.yesX, FB.penTop, 7, false);
    sheet.text(S.no,  FB.noX,  FB.penTop, 7, false);
    ynPair(sheet, S, G.cb.med, iv.fringeMedical === "yes" ? true : iv.fringeMedical === "no" ? false : null, BOX, false);
    ynPair(sheet, S, G.cb.pen, iv.fringePension === "yes" ? true : iv.fringePension === "no" ? false : null, BOX, false);
    report.push({ field: "4b", size: 7, lines: FB.medTops.length + 1, carried: "" });

    /* 4c frequency of pay: option list at MEASURED official line positions
       (EN "Other" previously drifted 1.8 pt low and its box crossed the row
       rule -- calibration fix, checkpoint 5 review). Boxes are reconstructed
       as drawn rects; the official file renders them as glyphs.             */
    var FC = G.fourC;
    labelBlock(sheet, L.f4c, FC.labelX, R.rD + LABEL_DY, D[6] - FC.labelX - LABEL_DX);
    for (var f = 0; f < S.freq.length; f++) {
      var ft = FC.optTops[f];
      sheet.text(S.freq[f], FC.labelX, ft, 7, false);
      var bx = FC.labelX + measure(S.freq[f], 7, false) + 3;
      sheet.box(bx, ft - 0.6, 8.6, iv.payFrequency === ["weekly", "biweekly", "semimonthly", "other"][f]);
    }
    report.push({ field: "4c", size: 7, lines: 4, carried: "" });

    carry(field(sheet, report, lang, "5", L.f5, iv.jobClassification, GRID.left, GRID.right, R.r5, R.r6, "narrative"));
    carry(field(sheet, report, lang, "6", L.f6, iv.duties, GRID.left, GRID.right, R.r6, R.r7, "narrative"));
    carry(field(sheet, report, lang, "7", L.f7, iv.tools, GRID.left, GRID.right, R.r7, R.band, "narrative"));

    /* ---- the open band: 8 8a 9 | 10 11 (no internal rules) --------------- */
    var BL = G.bandLabels;
    if (!sp) {  /* EN edition: "Y  N" column headers above the boxes         */
      sheet.text(S.yHdr, G.cb.i8[0][0] + 2.5, G.ynHeaderTop, 8, true);
      sheet.text(S.nHdr, G.cb.i8[1][0] + 2.3, G.ynHeaderTop, 8, true);
      sheet.text(S.yHdr, G.cb.i10[0][0] + 2.7, G.ynHeaderTop, 8, true);
      sheet.text(S.nHdr, G.cb.i10[1][0] + 2.3, G.ynHeaderTop, 8, true);
    }
    var leftQW = G.cb.i8[0][0] - (GRID.left + LABEL_DX) - (sp ? 22 : 8);
    var rightQW = G.cb.i10[0][0] - BL.rightX - (sp ? 22 : 8);
    sheet.lines(wrap(L.f8, 7, true, leftQW), GRID.left + LABEL_DX, BL.i8, 7, true);
    sheet.lines(wrap(L.f8a, 7, true, leftQW), GRID.left + LABEL_DX, BL.i8a, 7, true);
    sheet.lines(wrap(L.f9, 7, true, leftQW), GRID.left + LABEL_DX, BL.i9, 7, true);
    sheet.lines(wrap(L.f10, 7, true, rightQW), BL.rightX, BL.i10, 7, true);
    sheet.lines(wrap(L.f11, 7, true, rightQW), BL.rightX, BL.i11, 7, true);

    ynPair(sheet, S, G.cb.i8, iv.apprentice === "yes" ? true : iv.apprentice === "no" ? false : null, BOX, sp);
    /* Item 8a: official Yes/No only. Legacy value "na" renders NEITHER box
       selected (approved decision 4). The stored record keeps its value.    */
    var v8a = iv.apprenticeCert === "yes" ? true : iv.apprenticeCert === "no" ? false : null;
    ynPair(sheet, S, G.cb.i8a, v8a, BOX, sp);
    ynPair(sheet, S, G.cb.i9, iv.paidAllHours === "yes" ? true : iv.paidAllHours === "no" ? false : null, BOX, sp);
    ynPair(sheet, S, G.cb.i10, iv.paidOvertime === "yes" ? true : iv.paidOvertime === "no" ? false : null, BOX, sp);
    ynPair(sheet, S, G.cb.i11, iv.coerced === "yes" ? true : iv.coerced === "no" ? false : null, BOX, sp);
    /* 8a cross-reference when a certificate image is attached (approved
       micro-decision b): 6.5 pt, placed under the 8a boxes, only if it does
       not collide with the Item 9 row of boxes.                             */
    if (iv.apprenticeCertPhoto) {
      var sa = S.seeAttach;
      var saW = measure(sa, 6.5, false);
      var saX = G.cb.i8a[0][0];
      var saY = G.cb.i8a[0][1] + BOX + 1.6;
      if (saY + 7.5 <= G.cb.i9[0][1] && saX + saW <= MID) {
        sheet.text(sa, saX, saY, 6.5, false, { italics: false });
      } else {
        carries.push({ item: "8a", text: sa });  /* fallback: note in Item 18 */
      }
    }
    report.push({ field: "8-11", size: 7, lines: 5, carried: "" });

    /* ---- signatures and dates ------------------------------------------- */
    labelBlock(sheet, L.f12a, GRID.left + LABEL_DX, R.r12 + LABEL_DY, MID - GRID.left - 2 * LABEL_DX);
    if (iv.employeeSignature) {
      sheet.image(iv.employeeSignature, GRID.left + 60, R.r12 + 9.5,
                  170, (R.r13 - R.r12) - 11.5);
    }
    carry(field(sheet, report, lang, "12b", L.f12b, iv.employeeSignDate, MID, GRID.right, R.r12, R.r13, "short"));

    carry(field(sheet, report, lang, "13", L.f13, iv.dutiesObserved, GRID.left, GRID.right, R.r13, R.r14, "narrative"));
    carry(field(sheet, report, lang, "14", L.f14, iv.remarks, GRID.left, GRID.right, R.r14, R.r15, "narrative"));

    carry(field(sheet, report, lang, "15a", L.f15a, iv.interviewerName, G.cols15[0], G.cols15[1], R.r15, R.rPay, "short"));
    labelBlock(sheet, L.f15b, G.cols15[1] + LABEL_DX, R.r15 + LABEL_DY, G.cols15[2] - G.cols15[1] - 2 * LABEL_DX);
    if (iv.interviewerSignature) {
      sheet.image(iv.interviewerSignature, G.cols15[1] + 35, R.r15 + 9.5,
                  120, (R.rPay - R.r15) - 11.5);
    }
    carry(field(sheet, report, lang, "15c", L.f15c, iv.interviewDate, G.cols15[2], G.cols15[3], R.r15, R.rPay, "short"));

    /* ---- Payroll Examination (heading band, UNSHADED per official) ------- */
    sheet.text(L.payband, GRID.left + LABEL_DX, R.rPay + 6.0, FONT.payband, true);
    /* Items 16-17b intentionally blank: completed by the payroll examiner.  */
    labelBlock(sheet, L.f16, GRID.left + LABEL_DX, R.r16 + LABEL_DY, GRID.right - GRID.left - 2 * LABEL_DX);
    labelBlock(sheet, L.f17a, GRID.left + LABEL_DX, R.r17 + LABEL_DY, G.div17 - GRID.left - 2 * LABEL_DX);
    labelBlock(sheet, L.f17b, G.div17 + LABEL_DX, R.r17 + LABEL_DY, GRID.right - G.div17 - 2 * LABEL_DX);

    /* ---- footer ---------------------------------------------------------- */
    sheet.text(S.footerLeft, GRID.left + LABEL_DX, G.footerTop, FONT.footer, false);
    var frW = measure(S.footerRight, FONT.footer, false) / SAFETY;
    sheet.text(S.footerRight, GRID.right - frW, G.footerTop, FONT.footer, false);

    return sheet;
  }

  /* ===========================================================================
     SECTION: ITEM 18 PAGES
     Page 2 mirrors the official page 3: title band, Item 18 label, a bordered
     content box to a fixed bottom, footer. Carried overflow blocks come FIRST
     in item-number order (page 1 directs the reviewer here), then the
     interviewer's own remarks under the "Additional Remarks" heading.
     Continuation pages are built EXPLICITLY, one per capacity slice.
     =========================================================================== */

  var P18 = {
    boxTopGap: 8,          /* gap between title band bottom and the box      */
    labelPad: 3,           /* label inset inside the box                     */
    size: 8                /* Item 18 body text size                         */
  };

  function itemOrder(a, b) {
    /* sort carried blocks by item number: "1a" < "2c" < "13" ...            */
    var pa = parseFloat(a.item), pb = parseFloat(b.item);
    if (pa !== pb) { return pa - pb; }
    return String(a.item) < String(b.item) ? -1 : 1;
  }

  function buildItem18Text(iv, lang, carries) {
    var S = STRINGS[lang];
    var parts = [];
    carries.slice().sort(itemOrder).forEach(function (c) {
      parts.push(S.contPrefix(c.item) + " " + c.text);
    });
    var own = String(iv.additionalRemarks || "").trim();
    if (own) {
      if (parts.length) { parts.push(""); }
      parts.push(S.addlHeading + ":");
      parts.push(own);
    }
    return parts.join("\n");
  }

  function build18Pages(iv, lang, carries, report) {
    var G = GEOMETRY[lang], S = STRINGS[lang];
    var text = buildItem18Text(iv, lang, carries);
    var tb = G.titleBand;
    var boxTop = tb.bottom + P18.boxTopGap;
    var boxBottom = G.rows.gridBottom;
    var innerW = GRID.right - GRID.left - 2 * LABEL_DX;
    var labelH = LINE_H[7] + 2;
    var capacity = Math.floor((boxBottom - boxTop - labelH - 2 * P18.labelPad) / LINE_H[P18.size]);

    var allLines = text ? wrap(text, P18.size, false, innerW) : [];
    var slices = [];
    if (!allLines.length) { slices.push([]); }               /* always 1 page */
    for (var i = 0; i < allLines.length; i += capacity) {
      slices.push(allLines.slice(i, i + capacity));
    }
    report.push({ field: "18", size: P18.size, lines: allLines.length,
                  pages: slices.length, carried: "" });

    return slices.map(function (sliceLines, idx) {
      var sheet = new Sheet();
      drawTitleBand(sheet, lang);
      sheet.hline(GRID.left, GRID.right, boxTop);
      sheet.hline(GRID.left, GRID.right, boxBottom);
      sheet.vline(GRID.left, boxTop, boxBottom);
      sheet.vline(GRID.right, boxTop, boxBottom);
      var lbl = idx === 0 ? S.labels.f18 : S.labels.f18cont;
      sheet.text(lbl, GRID.left + LABEL_DX, boxTop + P18.labelPad, 7, true);
      sheet.lines(sliceLines, GRID.left + LABEL_DX,
                  boxTop + P18.labelPad + labelH, P18.size, false);
      drawFooter(sheet, lang);
      return sheet;
    });
  }

  /* Title band + footer, reused by Item 18 and attachment pages.            */
  function drawTitleBand(sheet, lang) {
    var G = GEOMETRY[lang], S = STRINGS[lang], tb = G.titleBand;
    sheet.hline(GRID.left, GRID.right, tb.top);
    sheet.hline(GRID.left, GRID.right, tb.bottom);
    for (var c = 0; c < tb.cells.length; c++) { sheet.vline(tb.cells[c], tb.top, tb.bottom); }
    sheet.text(S.titleLines[0], tb.cells[0] + 5.6, tb.top + 2.6, FONT.title, true);
    sheet.text(S.titleLines[1], tb.cells[0] + 5.6, tb.top + 18.7, FONT.title, true);
    var ay = tb.top + 2.0;
    for (var a = 0; a < S.agency.length; a++) {
      sheet.text(S.agency[a], tb.cells[1] + 5.7, ay, FONT.agency, false); ay += 10.6;
    }
    var oy = tb.top + 1.9;
    for (var o = 0; o < S.omb.length; o++) {
      var ow = measure(S.omb[o], FONT.omb, true) / SAFETY;
      sheet.text(S.omb[o], GRID.right - 4.5 - ow, oy, FONT.omb, true); oy += 9.6;
    }
  }
  function drawFooter(sheet, lang) {
    var G = GEOMETRY[lang], S = STRINGS[lang];
    sheet.text(S.footerLeft, GRID.left + LABEL_DX, G.footerTop, FONT.footer, false);
    var frW = measure(S.footerRight, FONT.footer, false) / SAFETY;
    sheet.text(S.footerRight, GRID.right - frW, G.footerTop, FONT.footer, false);
  }

  /* ===========================================================================
     SECTION: CERTIFICATE ATTACHMENT PAGE
     Full page after all Item 18 pages: title band, attachment label, the
     photo scaled to fit inside a bordered area (aspect preserved), footer.
     =========================================================================== */

  function buildAttachmentPage(iv, lang) {
    var G = GEOMETRY[lang], S = STRINGS[lang];
    var sheet = new Sheet();
    drawTitleBand(sheet, lang);
    var boxTop = G.titleBand.bottom + P18.boxTopGap;
    var boxBottom = G.rows.gridBottom;
    sheet.hline(GRID.left, GRID.right, boxTop);
    sheet.hline(GRID.left, GRID.right, boxBottom);
    sheet.vline(GRID.left, boxTop, boxBottom);
    sheet.vline(GRID.right, boxTop, boxBottom);
    sheet.text(S.attachLabel, GRID.left + LABEL_DX, boxTop + P18.labelPad, 7, true);
    var imgTop = boxTop + P18.labelPad + LINE_H[7] + 4;
    sheet.image(iv.apprenticeCertPhoto, GRID.left + 12, imgTop,
                (GRID.right - GRID.left) - 24, (boxBottom - imgTop) - 12);
    drawFooter(sheet, lang);
    return sheet;
  }

  /* ===========================================================================
     SECTION: FILENAME
     Preserves the production naming convention exactly, using the INTERVIEW
     date: Last,First_Contractor-DocumentTitleInLanguage-YYYYMMDD.pdf
     =========================================================================== */

  function buildFilename(iv, lang) {
    /* Ported VERBATIM from the v2.5 production tool so the naming convention
       is preserved exactly (approved decision 2): empty segments are skipped,
       the EN label is "Employee Interview" (not the full official title),
       and the INTERVIEW date is used.                                       */
    var rawName = String(iv.employeeName || "Unknown").trim();
    var parts = rawName.split(/\s+/);
    var last = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    var first = parts.length > 1 ? parts.slice(0, parts.length - 1).join(" ") : "";
    var namePart = first ? last + "," + first : last;
    var company = String(iv.contractor || "").trim();
    var dateStr = String(iv.interviewDate || "").replace(/-/g, "");
    var label = STRINGS[lang].fileLabel;
    var filename = namePart;
    if (company) { filename += "_" + company; }
    filename += "-" + label;
    if (dateStr) { filename += "-" + dateStr; }
    return filename.replace(/[\\/:*?"<>|]/g, "") + ".pdf";
  }

  /* ===========================================================================
     SECTION: PUBLIC API
     buildHud11Doc(interview, lang) -> { docDefinition, filename, fitReport }
     `interview` uses the tool's stored field names (see index.html).
     =========================================================================== */

  function sheetToContent(sheet, pageBreakAfter) {
    var nodes = [{ canvas: sheet.cv, absolutePosition: { x: 0, y: 0 } }]
      .concat(sheet.tx);
    if (pageBreakAfter) {
      nodes.push({ text: "", pageBreak: "after" });
    }
    return nodes;
  }

  function buildHud11Doc(iv, lang) {
    lang = (lang === "SP" || lang === "es") ? "SP" : "EN";
    var report = [];
    var carries = [];
    var page1 = buildPage1(iv, lang, report, carries);
    var p18sheets = build18Pages(iv, lang, carries, report);
    var sheets = [page1].concat(p18sheets);
    if (iv.apprenticeCertPhoto) { sheets.push(buildAttachmentPage(iv, lang)); }

    var content = [];
    for (var i = 0; i < sheets.length; i++) {
      content = content.concat(sheetToContent(sheets[i], i < sheets.length - 1));
    }

    var docDefinition = {
      pageSize: "LETTER",
      pageMargins: [0, 0, 0, 0],
      content: content,
      defaultStyle: { font: "Arimo", fontSize: FONT.value },
      info: {
        title: STRINGS[lang].docTitle + " - " + (iv.employeeName || ""),
        author: "Labor Compliance Solutions",
        subject: "Form HUD-11 (03/2025) - OMB 2501-0009",
        creator: "HUD-11 Employee Interview Tool v2.7.0"
      }
    };
    return { docDefinition: docDefinition,
             filename: buildFilename(iv, lang),
             fitReport: report,
             carriedToItem18: carries };
  }

  return {
    buildHud11Doc: buildHud11Doc,
    setMeasurer: setMeasurer,
    /* exposed for the verification tooling and the PoC harness              */
    _internals: { GEOMETRY: GEOMETRY, STRINGS: STRINGS, FONT: FONT,
                  LINE_H: LINE_H, wrap: wrap, fitField: fitField,
                  buildFilename: buildFilename }
  };
});
