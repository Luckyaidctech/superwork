# PROMPT FOR REPLIT — Lao E-Signature Feature (AIDC)

Build (or add to my existing app) a complete **e-signature module** in the **Lao language**. A user creates a signing request, uploads PDF documents, places signature fields, defines a signing order, and sends it to signers/approvers. Below is the full spec based on a working front-end prototype (mock data) — implement it as a REAL feature with a backend.

---

## 🔴 CRITICAL RULES
1. **Language: ALL UI text MUST be in Lao (ພາສາລາວ) only. Absolutely NO Thai characters mixed in.** This document goes to Lao government ministries. Use the EXACT Lao strings listed in the "UI STRINGS" section. (Common mistake: Thai `ง/ด/ม/อ/เ/ใ` vs Lao `ງ/ດ/ມ/ອ/ເ/ໃ` — verify every string is pure Lao.)
2. Mobile-first, clean, professional UI. Theme: blue (#1f3fb5) header + white cards, rounded corners, soft shadows.
3. Use the official Lao font **Phetsarath OT** for Lao text. (Phetsarath has no Latin glyphs, so render Latin/numbers with a standard font.)

## 👤 ROLES (3 types)
1. **ຜູ້ລົງນາມ (signer)** — signs; their signature IS placed and displayed on the document; has a position in the signing order.
2. **ຜູ້ອະນຸມັດ (approver)** — approves within the flow (has a position in the order), BUT their signature is **NOT** shown on the document.
3. **ຮັບສຳເນົາ / CC** — receives a copy only; does not sign; has no position in the order.

## 🔀 SIGNING ORDER (very important — step-based)
- Each signer/approver has a **step number (ຂັ້ນທີ່)**.
- People in the **same step sign in parallel** (any of them can sign first; order among them doesn't matter).
- **Different steps are sequential** — a step completes only when everyone in it has finished, then it advances to the next step.
- Example: creator = A. Signers B,C = step 1 (parallel), D = step 2, E,F = step 3 (parallel), G = step 4 (final). Routing: B & C (either first) → D → E & F (either first) → G.
- Quick presets: **ຕາມລຳດັບ** (each person own step = fully sequential) and **ພ້ອມກັນ** (everyone step 1 = all parallel). Also allow per-person **– / +** controls to adjust each person's step and build mixed groups.

---

## 📱 SCREEN 1 — ຂໍ້ມູນ (Create request; single scrollable screen)
- Header: "ເອກະສານ E-Signature ໃໝ່" / subtitle "ສ້າງ ແລະ ສົ່ງເພື່ອຂໍລາຍເຊັນ". Top stepper: **1 ຂໍ້ມູນ · 2 ວາງລາຍເຊັນ · 3 ສົ່ງ**.
- **ຫົວຂໍ້ການເຊັນ** (signing title): text field, max 500 chars with counter. **Sanitize as the user types**: automatically remove Windows-forbidden filename chars ( \ / : * ? " < > | ), emoji, and control characters (the title becomes a filename/email subject). Show an inline amber warning when anything was stripped.
- **ເລືອກໄຟລ໌ເຊັນ** (choose signing files): **PDF only**, allow multiple. Each file must be **viewable** in an in-app PDF viewer (tap 👁). Note under title: "ໄຟລ໌ເຊັນຕ້ອງເປັນ PDF ເທົ່ານັ້ນ".
- **ສະຫຼຸບໂດຍ AI** (AI Summary): after PDF upload, auto-generate a short summary of each document — **one paragraph per file** (2 files → 2 separate summaries). Use a real LLM on extracted PDF text; show a loading shimmer while generating.
- **ເອກະສານແนບ** (attachments, optional): any file type; viewable but NOT signed. Note "ເບິ່ງໄດ້ ແຕ່ບໍ່ຕ້ອງເຊັນ".
- **ຜູ້ລົງນາມ & ຮັບສຳເນົາ**: add people by **selecting from a user directory** (searchable by name/email) — NOT free-text. When picking a person, choose a role via 3 buttons: **ລົງນາມ / ອະນຸມັດ / CC**.
- **ລຳດັບການລົງນາມ**: show signers+approvers grouped by step (ຂັ້ນທີ່ N). Multi-person steps labeled "ເຊັນພ້ອມກັນ · N ຄົນ". Approver rows tagged "ອະນຸມັດ" + "ບໍ່ໂຊລາຍເຊັນ". Presets (ຕາມລຳດັບ/ພ້ອມກັນ) + per-person – / + step controls. CC listed separately below.
- Footer **ຕໍ່ໄປ** — enabled only when: title filled + ≥1 PDF + ≥1 signer.

## 📱 SCREEN 2 — ວາງລາຍເຊັນ (Place signatures)
- Render actual PDF pages. Header "ເບິ່ງ & ວາງລາຍເຊັນ".
- **Placing**: tap a signer chip in the bottom dock to select, then tap on the document to drop a **fixed-size** signature field. Fields are **draggable** to reposition and **deletable** (X). Each signer gets a distinct color.
- **Only signers appear/place here** (approvers and CC are excluded).
- **Multi-file**: show a **sticky file label** ("① filename · 1/2") that separates each file's pages while scrolling.
- **Page indicator** "ໜ້າ x/y" that updates as you scroll.
- **Tap vs scroll**: only place a field on a genuine tap — never when the user is scrolling/dragging the page.
- **Toggle ແກ້ໄຂ / ຕົວຢ່າง** (edit / preview):
  - *Edit*: field boxes show the signer's name + pen icon.
  - *Preview*: shows how signatures will look, plus a faint **light-blue diagonal "AIDC / DOCUMENT" watermark** across every page (marks it as draft/preview, not final).
  - In preview: if a signer **already has a saved signature** in the system → render their **real signature** stamped directly on the paper (no box, handwritten/cursive style, small "✓ ລາຍເຊັນຈິງ"). If they **don't have one yet** → render a **mockup** placeholder (dashed box, cursive name, "MOCKUP" badge, "ຍັງບໍ່ໄດ້ເຊັນ"). The real signature only truly appears after that person signs their turn.
  - Switching modes (and entering the screen) resets scroll to page 1.
- Footer: "ວາງແລ້ວ X/N ຄົນ" + **ຕໍ່ໄປ** (enabled when every signer has ≥1 field placed).

## 📱 SCREEN 3 — ສົ່ງ (Review & send) — cards in this exact order:
1. **ສະຫຼຸບເອກະສານ** (summary): ຫົວຂໍ້ · ໄຟລ໌ເຊັນ (count) · ເອກະສານແนບ (count) · **ຜູ້ລົງນາມ (count of SIGNERS only — do NOT include approvers)** · ຜູ້ອະນຸມັດ (count) · ຮັບສຳເນົາ CC (count).
2. **ໄຟລ໌ເອກະສານ** (documents): list the signing PDFs and the attachments separately, each viewable (👁).
3. **ລຳດັບການລົງນາມ** (accordion, **collapsed by default**, tap to expand): shows the signing order grouped by step (with approver tags) + CC list. Collapsed header shows a summary line "N ຜູ້ລົງນາມ · M ຂັ້ນຕອນ · K ອະນຸມັດ".
4. **ຕົວຢ່າງກ່ອນສົ່ງ** (preview): the document(s) with mock/real signatures + the AIDC watermark. For multiple files, use the same sticky file labels.
- Footer: **ຍ້ອນກັບ** + **ສົ່ງເພື່ອເຊັນ**.
- On send: route the request following the step order, notify step-1 people first, and show a success screen "ສົ່ງເອກະສານສຳເລັດ!".

---

## ⚙️ BACKEND / REAL BEHAVIOR TO IMPLEMENT (the prototype was frontend-only mock)
- **User directory**: real users (name, email, and a saved signature image if they created one).
- **Signature capture**: a screen where a user draws or uploads their signature; store it per user.
- **Document storage** + embed the real signature into the PDF at the placed coordinates once each person signs.
- **Workflow engine**: step-based routing — parallel within a step, sequential across steps; block advancing until a step is fully complete; send email/in-app notifications at each step.
- **Recipient signing screen**: signer/approver opens a link → views the document → signs/approves their field (or approves without a visible signature, for approvers).
- **Real AI summary** via an LLM on extracted PDF text.
- **Audit trail**: record who signed/approved and when.
- Signature field placement is stored as (fileId, pageNumber, x%, y%) so it maps correctly across devices/zoom.

---

## 🈳 UI STRINGS (use EXACTLY — Lao only)

**Nav / steps:** ເອກະສານ E-Signature ໃໝ່ · ສ້າງ ແລະ ສົ່ງເພື່ອຂໍລາຍເຊັນ · ຂໍ້ມູນ · ວາງລາຍເຊັນ · ສົ່ງ · ຕໍ່ໄປ · ຍ້ອນກັບ

**Screen 1:**
- ຫົວຂໍ້ການເຊັນ · ຕັ້ງຫົວຂໍ້ໃຫ້ຊັດເຈນ · ປ້ອນຫົວຂໍ້ການເຊັນ...
- ໄດ້ລຶບຕົວອັກສອນພິເສດ ( \ / : * ? " < > | ) ແລະ emoji ອອກໂດຍອັດຕະໂນມັດ
- ເລືອກໄຟລ໌ເຊັນ · ໄຟລ໌ເຊັນຕ້ອງເປັນ PDF ເທົ່ານັ້ນ · ແຕະເພື່ອເລືອກໄຟລ໌ PDF · ເພີ່ມໄຟລ໌ PDF
- ສະຫຼຸບໂດຍ AI · ສະຫຼຸບເນື້ອໃນເອກະສານໂດຍອັດຕະໂນມັດ
- ເອກະສານແນບ (ບໍ່ບັງຄັບ) · ແນບເອກະສານປະກອບ — ເບິ່ງໄດ້ ແຕ່ບໍ່ຕ້ອງເຊັນ · ເພີ່ມ
- ຜູ້ລົງນາມ & ຮັບສຳເນົາ · ເລືອກຄົນຈາກລາຍຊື່ · ເພີ່ມຈາກລາຍຊື່
- ເລືອກຈາກລາຍຊື່ · ຄົ້ນຫາຊື່ ຫຼື ອີເມວ... · ລົງນາມ · ອະນຸມັດ · CC
- ລຳດັບການລົງນາມ · ຄົນໃນຂັ້ນດຽວກັນ = ເຊັນພ້ອມກັນ · ຄົນລະຂັ້ນ = ເຊັນຕາມລຳດັບ · ໃຊ້ – / + ປັບຂັ້ນ
- ຕາມລຳດັບ · ພ້ອມກັນ · ຂັ້ນທີ່ · ເຊັນພ້ອມກັນ · ຄົນ · ອະນຸມັດ · ບໍ່ໂຊລາຍເຊັນ
- ຮັບສຳເນົາ (CC) · ບໍ່ຕ້ອງເຊັນ · ຜູ້ລົງນາມ
- Errors: ກະລຸນາປ້ອນຫົວຂໍ້ · ຕ້ອງມີໄຟລ໌ PDF ຢ່າງໜ້ອຍ 1 ໄຟລ໌ · ຕ້ອງມີຜູ້ລົງນາມຢ່າງໜ້ອຍ 1 ຄົນ · ຕື່ມຂໍ້ມູນໃຫ້ຄົບ

**Screen 2:**
- ເບິ່ງ & ວາງລາຍເຊັນ · ແຕະຜູ້ລົງນາມ ແລ້ວແຕະເອກະສານເພື່ອວາງຈຸດ
- ແກ້ໄຂ · ຕົວຢ່າງ · ເລືອກຜູ້ລົງນາມ: · ວາງແລ້ວ · ຄົນ · ໜ້າ
- ນີ້ແມ່ນລາຍເຊັນ ຕົວຢ່າງ (mock) ເທົ່ານັ້ນ — ລາຍເຊັນຕົວຈິງຈະສະແດງເມື່ອຜູ້ລົງນາມອະນຸມັດ
- ຕົວຢ່າງ · MOCKUP · ຍັງບໍ່ໄດ້ເຊັນ · ✓ ລາຍເຊັນຈິງ · watermark text: AIDC / DOCUMENT

**Screen 3:**
- ສົ່ງເພື່ອເຊັນ · ກວດຄວາມຖືກຕ້ອງ ກ່ອນສົ່ງ
- ສະຫຼຸບເອກະສານ · ຫົວຂໍ້ · ໄຟລ໌ເຊັນ · ເອກະສານແນບ · ຜູ້ລົງນາມ · ຜູ້ອະນຸມັດ · ຮັບສຳເນົາ (CC) · ໄຟລ໌ · ຄົນ
- ໄຟລ໌ເອກະສານ · ແຕະເພື່ອເບິ່ງໄຟລ໌ · ໄຟລ໌ເຊັນ (PDF) · ເອກະສານແນບ
- ລຳດັບການລົງນາມ · ຂັ້ນຕອນ · ຕົວຢ່າງກ່ອນສົ່ງ
- ຕົວຢ່າງກ່ອນສົ່ງ · ລາຍເຊັນ mock — ຕົວຈິງຈະສະແດງເມື່ອອະນຸມັດ
- ສົ່ງເອກະສານສຳເລັດ!

---

Keep the wording, roles, and the step-based parallel/sequential ordering exactly as described. Prioritize a correct **workflow engine** and **pure-Lao UI**.
