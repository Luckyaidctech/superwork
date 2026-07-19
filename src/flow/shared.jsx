import { useState } from 'react'
import { createPortal } from 'react-dom'

// ── Portal ໜ້າ overlay ເຕັມຈໍ ອອກໄປໃສ່ .phone (ນອກ .scroll) ──
// ຫ້າມ render overlay ເຕັມຈໍ ໄວ້ໃນ .scroll ໂດຍກົງ: iOS Safari ຈະດຶງ element
// position:absolute ເຂົ້າ scroll layer → overlay ເລື່ອນຕາມເນື້ອຫາ + nav/FAB ທັບ
export function ScreenPortal({ children }) {
  return createPortal(children, document.querySelector('.phone') || document.body)
}

// ───────────────────────── ຄ່າຄົງທີ່ / Constants ─────────────────────────
export const STEPS = [
  { id: 1, label: 'ຂໍ້ມູນ' },
  { id: 2, label: 'ວາງລາຍເຊັນ' },
  { id: 3, label: 'ສົ່ງ' },
]

export const ROLES = [
  { value: 'signer', label: 'ຜູ້ເຊັນ (Primary)' },
  { value: 'cc', label: 'ຮັບສຳເນົາ (CC)' },
]

export const MAX_TITLE = 500

// ສີປະຈຳຜູ້ເຊັນແຕ່ລະຄົນ (chip + ກ່ອງລາຍເຊັນ)
export const SIGNER_COLORS = [
  { main: '#2563eb', soft: '#e8effc' },
  { main: '#16a34a', soft: '#e7f6ec' },
  { main: '#d97706', soft: '#fdf0dd' },
  { main: '#9333ea', soft: '#f3e8fd' },
  { main: '#dc2626', soft: '#fdeaea' },
  { main: '#0891b2', soft: '#e0f5fa' },
]
export const signerColor = (idx) => SIGNER_COLORS[idx % SIGNER_COLORS.length]

// ── ລາຍชื่อ / Directory (mock) — ໂຄງສ້າງອົງກອນ: ຜู้บริหาร → ພະແนก (ຫົວໜ້າ→ພະນັກງານ) ──
// hasSig = ມີລາຍເຊັນບັນທຶກໄວ້ໃນລະບົບແລ້ວ → preview ໂຊລາຍເຊັນຈິງ (ຄົນທີ່ບໍ່ມີ = mock)
// dept: 'exec'|'hr'|'finance'|'legal'|'it'  ·  rank: 'director'|'deputy'|'head'|'staff'
// ── 13 ພະແນກ ຕາມໂຄງສ້າງຈິງ AIDC (Lucky ສັ່ງ 16/07/2026) — IT ແລະ BD ຂຶ້ນກ່ອນ ──
export const DEPTS = {
  exec: 'President Office',
  it: 'IT Department',
  bd: 'Business Development',
  infra: 'Infrastructure & Digital Solutions',
  finance: 'Finance',
  acct: 'Accounting',
  studio: 'Digital Studio',
  budget: 'Budgeting Department',
  audit: 'Internal Audit',
  construction: 'Construction I',
  hr: 'HR and Admin',
  legal: 'Legal',
  corp: 'Corporate Affairs',
}
export const RANK_TITLE = { director: 'ຜູ້ອຳນວຍການ', deputy: 'ຮອງຜູ້ອຳນວຍການ', secretary: 'ເລຂານຸການ', head: 'ຫົວໜ້າພະແນກ', staff: 'ພະນັກງານ' }
const RANK_ORDER = { director: 0, deputy: 1, secretary: 2, head: 0, staff: 1 }

// ⚠ id ເກົ່າ (A B C D F G u1 u2 u4-u8) ຫ້າມປ່ຽນ — seed request/doc ອ້າງຢູ່ · ຄົນໃໝ່ = id ໃໝ່ລ້ວນ
// ຫົວໜ້າຕົວຈິງ ຕາມທີ່ Lucky ສົ່ງ · ບ່ອນບໍ່ຮູ້ຊື່ = mockup (Latin ກັນ charset ໄທຫຼົງ)
export const DIRECTORY = [
  // ── President Office ──
  { id: 'C', name: 'Pheutsapha Phoummasak', email: 'pheutsapha@aidctech.la', hasSig: true, dept: 'exec', rank: 'director' },
  { id: 'u3', name: 'Adul Chaiprom', email: 'adul@aidc.la', hasSig: true, dept: 'exec', rank: 'deputy' },
  { id: 'u9', name: 'Latdavanh Nina Manivanh', email: 'latdavanh@aidc.la', hasSig: false, dept: 'exec', rank: 'secretary' },
  // ── IT Department (ຜູ້ໃຊ້ demo A/B ຢູ່ນີ້) ──
  { id: 'B', name: 'Decha Ning Kenthaworn', email: 'decha@aidc.la', hasSig: true, dept: 'it', rank: 'head' },
  { id: 'A', name: 'Anoulack Phengphaxaichanh', email: 'anoulack@aidc.la', hasSig: false, dept: 'it', rank: 'staff' },
  { id: 'D', name: 'ວິໄລ ຈັນທະລາ', email: 'vilay@aidc.la', hasSig: false, dept: 'it', rank: 'staff' },
  { id: 'it4', name: 'Somsak Inthavong', email: 'somsak@aidc.la', hasSig: false, dept: 'it', rank: 'staff' },
  { id: 'it5', name: 'Phonesavanh Keomany', email: 'phonesavanh@aidc.la', hasSig: false, dept: 'it', rank: 'staff' },
  // ── Business Development ──
  { id: 'F', name: 'Chanon Leng Chamnandechakun', email: 'chanon@aidc.la', hasSig: true, dept: 'bd', rank: 'head' },
  { id: 'G', name: 'Take Khounphaxay', email: 'take@aidc.la', hasSig: false, dept: 'bd', rank: 'staff' },
  { id: 'bd3', name: 'Vilayvone Sengdara', email: 'vilayvone@aidc.la', hasSig: false, dept: 'bd', rank: 'staff' },
  { id: 'bd4', name: 'Khamphet Chanthala', email: 'khamphet@aidc.la', hasSig: false, dept: 'bd', rank: 'staff' },
  { id: 'bd5', name: 'Malaythong Phimmasone', email: 'malaythong@aidc.la', hasSig: false, dept: 'bd', rank: 'staff' },
  // ── Infrastructure & Digital Solutions ──
  { id: 'in1', name: 'Bounthavy Sisouphanh', email: 'bounthavy@aidc.la', hasSig: false, dept: 'infra', rank: 'head' },
  { id: 'in2', name: 'Anousone Keopaseuth', email: 'anousone@aidc.la', hasSig: false, dept: 'infra', rank: 'staff' },
  { id: 'in3', name: 'Sengphet Vongsa', email: 'sengphet@aidc.la', hasSig: false, dept: 'infra', rank: 'staff' },
  { id: 'in4', name: 'Thipphavanh Chanthavong', email: 'thipphavanh@aidc.la', hasSig: false, dept: 'infra', rank: 'staff' },
  { id: 'in5', name: 'Kongkham Silavanh', email: 'kongkham@aidc.la', hasSig: false, dept: 'infra', rank: 'staff' },
  // ── Finance ──
  { id: 'u2', name: 'Souksan San LABANG', email: 'souksan@aidc.la', hasSig: true, dept: 'finance', rank: 'head' },
  { id: 'u5', name: 'Bounmy Sisavath', email: 'bounmy@aidc.la', hasSig: false, dept: 'finance', rank: 'staff' },
  { id: 'fn3', name: 'Chansamone Vixay', email: 'chansamone@aidc.la', hasSig: false, dept: 'finance', rank: 'staff' },
  { id: 'fn4', name: 'Daosavanh Phongsavath', email: 'daosavanh@aidc.la', hasSig: false, dept: 'finance', rank: 'staff' },
  { id: 'fn5', name: 'Outhai Sayavong', email: 'outhai@aidc.la', hasSig: false, dept: 'finance', rank: 'staff' },
  // ── Accounting ──
  { id: 'ac1', name: 'Pannapat Pure NURATKAEW', email: 'pannapat@aidc.la', hasSig: true, dept: 'acct', rank: 'head' },
  { id: 'ac2', name: 'Viengkham Sourinho', email: 'viengkham@aidc.la', hasSig: false, dept: 'acct', rank: 'staff' },
  { id: 'ac3', name: 'Somphone Rattanavong', email: 'somphone@aidc.la', hasSig: false, dept: 'acct', rank: 'staff' },
  { id: 'ac4', name: 'Chindavanh Keola', email: 'chindavanh@aidc.la', hasSig: false, dept: 'acct', rank: 'staff' },
  { id: 'ac5', name: 'Bouasone Phanthavy', email: 'bouasone@aidc.la', hasSig: false, dept: 'acct', rank: 'staff' },
  // ── Digital Studio ──
  { id: 'st1', name: 'Xaypaseuth Vongphachanh', email: 'xaypaseuth@aidc.la', hasSig: false, dept: 'studio', rank: 'head' },
  { id: 'st2', name: 'Nalinthone Syhalath', email: 'nalinthone@aidc.la', hasSig: false, dept: 'studio', rank: 'staff' },
  { id: 'st3', name: 'Phoutthasone Inthilath', email: 'phoutthasone@aidc.la', hasSig: false, dept: 'studio', rank: 'staff' },
  { id: 'st4', name: 'Kettavanh Soulinthone', email: 'kettavanh@aidc.la', hasSig: false, dept: 'studio', rank: 'staff' },
  { id: 'st5', name: 'Athid Manolom', email: 'athid@aidc.la', hasSig: false, dept: 'studio', rank: 'staff' },
  // ── Budgeting Department ──
  { id: 'bg1', name: 'Somchit Phanthalangsy', email: 'somchit@aidc.la', hasSig: false, dept: 'budget', rank: 'head' },
  { id: 'bg2', name: 'Latsamy Chanthaphone', email: 'latsamy@aidc.la', hasSig: false, dept: 'budget', rank: 'staff' },
  { id: 'bg3', name: 'Khambay Vorachit', email: 'khambay@aidc.la', hasSig: false, dept: 'budget', rank: 'staff' },
  { id: 'bg4', name: 'Soudalath Phommachanh', email: 'soudalath@aidc.la', hasSig: false, dept: 'budget', rank: 'staff' },
  { id: 'bg5', name: 'Vanhsy Keobounphanh', email: 'vanhsy@aidc.la', hasSig: false, dept: 'budget', rank: 'staff' },
  // ── Internal Audit ──
  { id: 'ia1', name: 'Khampheng Soulivong', email: 'khampheng@aidc.la', hasSig: false, dept: 'audit', rank: 'head' },
  { id: 'ia2', name: 'Manivone Thepvongsa', email: 'manivone@aidc.la', hasSig: false, dept: 'audit', rank: 'staff' },
  { id: 'ia3', name: 'Bounheng Sackda', email: 'bounheng@aidc.la', hasSig: false, dept: 'audit', rank: 'staff' },
  { id: 'ia4', name: 'Phaivanh Luangrath', email: 'phaivanh@aidc.la', hasSig: false, dept: 'audit', rank: 'staff' },
  { id: 'ia5', name: 'Sinnakhone Douangchak', email: 'sinnakhone@aidc.la', hasSig: false, dept: 'audit', rank: 'staff' },
  // ── Construction I ──
  { id: 'cn1', name: 'Pongsurin ALEX Chaicae', email: 'pongsurin@aidc.la', hasSig: true, dept: 'construction', rank: 'head' },
  { id: 'cn2', name: 'Somdy Oudomsack', email: 'somdy@aidc.la', hasSig: false, dept: 'construction', rank: 'staff' },
  { id: 'cn3', name: 'Khamsing Phanthavong', email: 'khamsing@aidc.la', hasSig: false, dept: 'construction', rank: 'staff' },
  { id: 'cn4', name: 'Viengsay Chittavong', email: 'viengsay@aidc.la', hasSig: false, dept: 'construction', rank: 'staff' },
  { id: 'cn5', name: 'Bounmak Sengaloun', email: 'bounmak@aidc.la', hasSig: false, dept: 'construction', rank: 'staff' },
  // ── HR and Admin (Pimlada ຍ້າຍມາເປັນຫົວໜ້າ — id u1 ເກົ່າ ໃຊ້ໃນ approvalChain) ──
  { id: 'u1', name: 'Pimlada Yui Akkarapiriyakulthorn', email: 'pimlada@aidc.la', hasSig: true, dept: 'hr', rank: 'head' },
  { id: 'u4', name: 'Khamla Vongsavath', email: 'khamla@aidc.la', hasSig: false, dept: 'hr', rank: 'staff' },
  { id: 'u6', name: 'Souphaphone Douangdala', email: 'souphaphone@aidc.la', hasSig: false, dept: 'hr', rank: 'staff' },
  { id: 'hr4', name: 'Chanthala Keovilay', email: 'chanthala@aidc.la', hasSig: false, dept: 'hr', rank: 'staff' },
  { id: 'hr5', name: 'Phetsamone Vannavong', email: 'phetsamone@aidc.la', hasSig: false, dept: 'hr', rank: 'staff' },
  // ── Legal ──
  { id: 'u7', name: 'Somphavanh Chanthabouly', email: 'somphavanh@aidc.la', hasSig: true, dept: 'legal', rank: 'head' },
  { id: 'u8', name: 'Douangmala Sivongsa', email: 'douangmala@aidc.la', hasSig: false, dept: 'legal', rank: 'staff' },
  { id: 'lg3', name: 'Bounthan Xayasith', email: 'bounthan@aidc.la', hasSig: false, dept: 'legal', rank: 'staff' },
  { id: 'lg4', name: 'Alounny Thammavong', email: 'alounny@aidc.la', hasSig: false, dept: 'legal', rank: 'staff' },
  { id: 'lg5', name: 'Phonepadith Volachit', email: 'phonepadith@aidc.la', hasSig: false, dept: 'legal', rank: 'staff' },
  // ── Corporate Affairs ──
  { id: 'cp1', name: 'Souliya Phommavongsa', email: 'souliya@aidc.la', hasSig: false, dept: 'corp', rank: 'head' },
  { id: 'cp2', name: 'Vatsana Keomixay', email: 'vatsana@aidc.la', hasSig: false, dept: 'corp', rank: 'staff' },
  { id: 'cp3', name: 'Thongbay Chanthavixay', email: 'thongbay@aidc.la', hasSig: false, dept: 'corp', rank: 'staff' },
  { id: 'cp4', name: 'Amphay Soundala', email: 'amphay@aidc.la', hasSig: false, dept: 'corp', rank: 'staff' },
  { id: 'cp5', name: 'Davone Sisombath', email: 'davone@aidc.la', hasSig: false, dept: 'corp', rank: 'staff' },
]

// ── ຈັດ directory ເປັນ sections: ຕົວຂ້ອຍ → President Office → IT → BD → ພະແນກອື່ນ (ຫົວໜ້າກ່ອນ) ──
const DEPT_ORDER = ['exec', 'it', 'bd', 'infra', 'finance', 'acct', 'studio', 'budget', 'audit', 'construction', 'hr', 'legal', 'corp']
export function directorySections(meId, query = '', dept = '') {
  const q = query.trim().toLowerCase()
  const match = (p) => !q || (p.name + ' ' + p.email).toLowerCase().includes(q)
  const sections = []
  const me = DIRECTORY.find((p) => p.id === meId)
  // ກອງຕາມພະແນກ: ໂຊ "ຕົວຂ້ອຍ" ສະເພາະຕອນບໍ່ກອງ ຫຼື ຂ້ອຍຢູ່ພະແນກນັ້ນ
  if (me && match(me) && (!dept || me.dept === dept)) sections.push({ key: 'me', label: 'ຕົວຂ້ອຍ', people: [me] })
  for (const dk of (dept ? [dept] : DEPT_ORDER)) {
    const people = DIRECTORY
      .filter((p) => p.dept === dk && p.id !== meId && match(p))
      .sort((a, b) => (RANK_ORDER[a.rank] - RANK_ORDER[b.rank]) || a.name.localeCompare(b.name))
    if (people.length) sections.push({ key: dk, label: DEPTS[dk], people })
  }
  return sections
}

// role ທີ່ຢູ່ໃນ "ລຳดับ" (ມີ step): ຜູ້ລົງນາມ (ໂຊລາຍເຊັນ) + ຜູ້ອະນຸມັດ (ບໍ່ໂຊລາຍເຊັນ)
export const isOrdered = (role) => role === 'signer' || role === 'approver'
export const ROLE_LABEL = { signer: 'ຜູ້ລົງນາມ', approver: 'ຜູ້ອະນຸມັດ', cc: 'CC' }

// ── ຈັດ step ຜູ້ຮ່ວມລຳดับໃຫ້ຕິດກັນ 1..k (ຮັກສາການจัดกลุ่ม) ──
export function normalizeSteps(signers) {
  const uniq = [...new Set(signers.filter((s) => isOrdered(s.role)).map((s) => s.step))].sort((a, b) => a - b)
  const map = new Map(uniq.map((v, i) => [v, i + 1]))
  return signers.map((s) => (isOrdered(s.role) ? { ...s, step: map.get(s.step) } : s))
}

// ── ຈັດກຸ່ມຜູ້ລົງນາມ ຕາມ step (step ດຽວກັນ = ເຊັນพ้อมกัน) ──
export function groupSignatories(signatories) {
  const steps = [...new Set(signatories.map((s) => s.step))].sort((a, b) => a - b)
  return steps.map((st, i) => ({ rank: i + 1, members: signatories.filter((s) => s.step === st) }))
}

// ── ອັກສอນທີ່ຫ້າມໃນຊື່ໄຟລ໌ Windows + emoji + control chars ──
const FORBIDDEN_CHARS = /[\\/:*?"<>|]/g
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g
const EMOJI_CHARS = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu

export function sanitizeTitle(raw) {
  const cleaned = raw
    .replace(CONTROL_CHARS, '')
    .replace(FORBIDDEN_CHARS, '')
    .replace(EMOJI_CHARS, '')
  return { cleaned, changed: cleaned !== raw }
}

let _uid = 0
export const uid = () => `id_${++_uid}`

export const fmtSize = (bytes) => {
  if (!bytes) return ''
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

// ───────────────────────── ໄອຄອນ / Icons ─────────────────────────
export const Icon = {
  back: () => (<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>),
  help: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>),
  doc: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M9 13l2 2 4-4" /></svg>),
  pdf: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" /><path d="M14 2v6h6" /></svg>),
  clip: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8.5l-9.2 9.2a4 4 0 0 1-5.7-5.7l8.5-8.5a2.7 2.7 0 0 1 3.8 3.8l-8.5 8.5a1.3 1.3 0 0 1-1.9-1.9L18 8" /></svg>),
  eye: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>),
  pen: () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>),
  addUser: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 19v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="7.5" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>),
  users: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  plus: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>),
  minus: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>),
  search: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>),
  book: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>),
  mail: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></svg>),
  layers: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>),
  sparkle: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" /></svg>),
  trash: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>),
  x: () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>),
  chevron: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>),
  clock: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  chart: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>),
  calendar: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>),
  umbrella: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v7a2.5 2.5 0 0 0 5 0" /></svg>),
  briefcase: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="7" width="19" height="13" rx="2.5" /><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /></svg>),
  bulb: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" /></svg>),
  calCheck: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" /></svg>),
  reqDoc: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /><path d="M14 3l5 5h-5z" /><path d="M9 9h2M9 13h3" /><path d="M20.5 13.5l-5 5-2.5.6.6-2.5 5-5a1.4 1.4 0 0 1 2 2z" /></svg>),
  upload: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M8 8l4-4 4 4" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>),
  inbox: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12h-5l-2 3h-4l-2-3H3" /><path d="M5.5 5h13l2.5 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" /></svg>),
  gear: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 8.9 1.5V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 15 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1h.1a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1z" /></svg>),
  user: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>),
  checkCircle: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>),
  sort: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h13M4 12h9M4 17h5M17 17l3 3 3-3M20 20V10" /></svg>),
  download: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></svg>),
  share: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>),
  check: () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>),
  send: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></svg>),
  warn: () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>),
  bell: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>),
  pin: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>),
  reply: () => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17l-5-5 5-5" /><path d="M4 12h11a5 5 0 0 1 5 5v1" /></svg>),
  swap: () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4v16M7 4L3 8M7 4l4 4" /><path d="M17 20V4M17 20l4-4M17 20l-4-4" /></svg>),
  x2: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>),
  grip: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>),
  at: () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9" /></svg>),
  info: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>),
  chat: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.5 9.5 0 0 1-4-.9L3 21l1.9-4.5A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" /></svg>),
  grid: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>),
  finger: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10v3a9 9 0 0 1-.8 3.7" /><path d="M8.5 9.5a3.5 3.5 0 0 1 7 0c0 3.5-.3 5.5-1.2 7.8" /><path d="M5.5 11a6.5 6.5 0 0 1 13 0c0 1 0 2-.2 3" /><path d="M12 13c0 2.5-.3 4.5-1 6.5" /></svg>),
  shield: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z" /><path d="M9 12l2 2 4-4" /></svg>),
  lock: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>),
  printer: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" rx="1" /></svg>),
  camera: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>),
  video: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>),
  image: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>),
  file: () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>),
  // ── ໄອຄอนແຍກປະເພດເອກະສານ (E11) — ໃຊ້ໃນ DOC_TYPE_STYLE (data.js) ──
  money: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.6" /><path d="M6 12h.01M18 12h.01" /></svg>),
  cart: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.4" /><circle cx="17.5" cy="20" r="1.4" /><path d="M2.5 3.5h2.3l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L20.5 7.5H5.4" /></svg>),
  building: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17" /><path d="M15 9h4a1 1 0 0 1 1 1v11" /><path d="M2 21h20" /><path d="M8 7h.01M11 7h.01M8 11h.01M11 11h.01M8 15h.01M11 15h.01" /></svg>),
}

// ───────────────────────── ອົງປະກອບຍ່ອຍ / Sub-components ─────────────────────────
export function Header({ title, subtitle, onBack, help, right }) {
  return (
    <div className="header">
      <button className="header-back" onClick={onBack}><Icon.back /></button>
      <div className="header-text center">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {right || (help && <button className="header-help"><Icon.help /></button>)}
    </div>
  )
}

export function Stepper({ current }) {
  return (
    <div className="card stepper-card">
      <div className="stepper">
        {STEPS.map((st, i) => {
          const state = st.id < current ? 'done' : st.id === current ? 'active' : 'idle'
          return (
            <div className="stepper-item" key={st.id}>
              <span className={`stepper-node ${state}`}>{state === 'done' ? <Icon.check /> : st.id}</span>
              <span className={`stepper-label ${state}`}>{st.label}</span>
              {i < STEPS.length - 1 && <span className={`stepper-line ${st.id < current ? 'filled' : ''}`} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SectionHead({ icon, title, sub, right }) {
  return (
    <div className="sec-head">
      <div className="sec-icon">{icon}</div>
      <div className="sec-head-text">
        <b>{title}</b>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function FileList({ items, onRemove, onView, empty }) {
  if (!items.length) return empty ? <p className="muted tap-hint">{empty}</p> : null
  return (
    <div className="file-list">
      {items.map((f) => (
        <div className="file-item fade-in" key={f.id}>
          <span className="file-badge"><Icon.pdf /></span>
          <div className="file-meta">
            <b title={f.name}>{f.name}</b>
            <span>{fmtSize(f.size)}</span>
          </div>
          {onView && <button className="icon-mini" title="ເບິ່ງ" onClick={() => onView(f)}><Icon.eye /></button>}
          {onRemove && <button className="icon-mini danger" onClick={() => onRemove(f.id)}><Icon.trash /></button>}
        </div>
      ))}
    </div>
  )
}

export function LoadingRow({ text }) {
  return <div className="loading-row"><span className="spinner dark" /> <span>{text}</span></div>
}

// initials for avatar
// ຂ້າມຄຳນຳໜ້າ (ນາງ/ທ້າວ/ທ່ານ/ນາຍ/Mr./Mrs./Ms.) → ເອົາຕົວທຳອິດຂອງຊື່ຈິງ
const TITLES = ['ນາງ', 'ທ້າວ', 'ທ່ານ', 'ນາຍ', 'ທ.', 'mr', 'mrs', 'ms', 'mr.', 'mrs.', 'ms.', 'dr', 'dr.']
export const initials = (name) => {
  const parts = (name || '?').trim().split(/\s+/).filter((p) => p && !TITLES.includes(p.toLowerCase()))
  return (parts[0] || (name || '?').trim()).charAt(0).toUpperCase()
}

// ── ຕາປະທັບແດງ ບໍລິສັດ (ຖ້າບໍ່ມີລາຍເຊັນວາດ) ──
export const RedSeal = ({ size = 54 }) => (
  <svg viewBox="0 0 60 60" width={size} height={size}>
    <circle cx="30" cy="30" r="27" fill="none" stroke="#dc2626" strokeWidth="2" />
    <circle cx="30" cy="30" r="21" fill="none" stroke="#dc2626" strokeWidth="1" />
    <text x="30" y="25" textAnchor="middle" fontSize="7" fill="#dc2626" fontWeight="bold">AIDC TECH</text>
    <text x="30" y="34" textAnchor="middle" fontSize="5" fill="#dc2626">CO., LTD</text>
    <path d="M15 41 h30" stroke="#dc2626" strokeWidth="1" />
    <text x="30" y="49" textAnchor="middle" fontSize="4.5" fill="#dc2626">LAO PDR</text>
  </svg>
)

// ── LANIT digital signature stamp (format ມາດຕະຖານ — ໃຊ້ຮ່ວມ SignScreen + PdfViewer) ──
export function LanitStamp({ sigImg, name = 'ຜູ້ລົງນາມ', date = '', compact = false }) {
  return (
    <div className={`lanit-stamp ${compact ? 'compact' : ''}`}>
      <div className="lanit-left">{sigImg ? <img src={sigImg} alt="sig" /> : <RedSeal size={compact ? 34 : 54} />}</div>
      <div className="lanit-right">
        <span className="lanit-badge"><Icon.checkCircle /> LANIT verified</span>
        <b>Digitally signed by</b>
        <b className="lanit-name">{name}</b>
        <span>DN: CN={name}, O=AIDC TECH, C=LA</span>
        <span>Date: {date} (+07)</span>
        <span>Issuer: LANIT-LAO Corporate CA - G2</span>
      </div>
    </div>
  )
}

// ── Popup ຜົນລັບກາງ (ໃຊ້ຮ່ວມທຸກທີ່: ເຊັນ / ອະນຸມັດ / ປະຕິເສດ / ຍົກເລີກ) — UI ດຽວກັນ 100% ──
export function ResultPopup({ danger = false, title, desc, onOk, okLabel = 'ຕົກລົງ' }) {
  return (
    <div className="modal-overlay dim">
      <div className="sign-success-pop" onClick={(e) => e.stopPropagation()}>
        <span className="sign-success-pop-ic" style={danger ? { background: 'var(--danger)', boxShadow: '0 8px 22px rgba(220,38,38,.4)' } : undefined}>
          {danger ? <Icon.x /> : <Icon.check />}
        </span>
        <b>{title}</b>
        {desc && <p>{desc}</p>}
        <button className="btn primary" onClick={onOk}><Icon.check /> {okLabel}</button>
      </div>
    </div>
  )
}

// ── Modal ໃສ່ເຫດຜົນກາງ (ໃຊ້ຮ່ວມທຸກທີ່ທີ່ມີ ປະຕິເສດ / ຍົກເລີກ) — UI ດຽວກັນ 100% ──
// ຕ້ອງໃສ່ເຫດຜົນ ≥ 3 ຕົວ ຈຶ່ງກົດຢືນຢັນໄດ້ → onConfirm(reason) → ຝ່າຍກ່ຽວຂ້ອງໄດ້ຮັບແຈ້ງເຕືອນ
export function ReasonModal({ title, hint, placeholder, confirmLabel, cancelLabel = 'ຍົກເລີກ', onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const ok = reason.trim().length >= 3
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><b><Icon.warn /> {title}</b><button className="icon-mini" onClick={onClose}><Icon.x /></button></div>
        <div style={{ padding: '14px 16px 18px' }}>
          <p className="muted" style={{ margin: '0 0 10px' }}>{hint}</p>
          <textarea className="title-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} autoFocus />
          <div className="success-btns" style={{ marginTop: 14, maxWidth: 'none' }}>
            <button className="btn ghost" onClick={onClose}>{cancelLabel}</button>
            <button className={`btn danger ${ok ? '' : 'disabled'}`} disabled={!ok} onClick={() => ok && onConfirm(reason.trim())}><Icon.x /> {confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
