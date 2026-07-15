import { DIRECTORY } from '../flow/shared.jsx'

// ຮູບໂປຣໄຟລ໌ demo (data URI SVG) — ຄົນທີ່ບໍ່ມີ avatarUrl ຈະໃຊ້ initials
const PHOTO_A = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%232563eb'/%3E%3Ccircle cx='20' cy='15.5' r='7' fill='%23dbeafe'/%3E%3Cpath d='M7 37c0-7.5 5.5-11.5 13-11.5S33 29.5 33 37z' fill='%23dbeafe'/%3E%3C/svg%3E"

// ── ຜູ້ใช้ demo (ສະຫຼັບໄດ້) — Tech + BD + ຜู้บริหาร ──
export const USERS = [
  { id: 'A', name: 'Anoulack Phengphaxaichanh', role: 'ພະນັກງານ · ພະແນກ Tech', avatarUrl: PHOTO_A },
  { id: 'B', name: 'Decha Ning', role: 'ຫົວໜ້າພະແນກ Tech' },
  { id: 'C', name: 'Pheutsapha Phoummasak', role: 'ຜູ້ອຳນວຍການ' },
  { id: 'F', name: 'Chanon Leng', role: 'ຫົວໜ້າພະແນກ BD' },
  { id: 'G', name: 'Take', role: 'ພະນັກງານ · ພະແນກ BD' },
]
const OTHERS = { D: 'ວິໄລ ຈັນທະລາ', E: 'ບຸນມີ ສີສະຫວາດ' }
// nameOf ຮອງຮັບ id ຈາກ DIRECTORY ນຳ (ສຳລັບ request ໃໝ່ທີ່ເລືອກຄົນຈາກ picker)
export const nameOf = (id) => USERS.find((u) => u.id === id)?.name || OTHERS[id] || DIRECTORY.find((p) => p.id === id)?.name || id
export const avatarOf = (id) => USERS.find((u) => u.id === id)?.avatarUrl || DIRECTORY.find((p) => p.id === id)?.avatarUrl || null
const CMAP = { A: '#2563eb', B: '#e07b1f', C: '#7c3aed', D: '#0891b2', E: '#16a34a', F: '#0d9488', G: '#db2777' }
const CPAL = ['#2563eb', '#e07b1f', '#7c3aed', '#0891b2', '#16a34a', '#dc2626', '#d97706', '#0d9488']
export const colorOf = (id) => CMAP[id] || CPAL[((id || 'x').charCodeAt((id || 'x').length - 1) || 0) % CPAL.length]

let _id = 100
export const uid = () => `x${++_id}`

// doc: { id, title, creatorId, date, ts, files[{name,pages,summary?}], attachments[], cc[ids], signers[], comments[], status }
// signer: { id, step, status:'pending'|'viewed'|'signed'|'rejected', role:'signer'|'approver', time?, reason? }
// ── ໂຄງສ້າງ flow: ພະນັກງານສ້າງ → ຫົວໜ້າพะแนก → ຜู้อำนวยการ(C) approve ສุดท้าย → C ເຊັນຫຼາຍສຸດ ──
export function initialDocs() {
  return [
    // ════════ A (Anoulack) ສ້າງ ════════
    // [tab1] A ສ້າງເອງ ແລະ ເປັນຜູ້ເຊັນຄົນທຳອິດ (ຮອບຂອງຕົນເອງ) — ຕ້ອງມີປຸ່ມ "ລົງນາມ"
    { id: 'd24', title: 'ໂຄງການ Superwork (ຂ້ອຍຮ່ວມເຊັນ)', creatorId: 'A', date: '14/07/2026', ts: 14,
      files: [{ name: 'super-work-invitation.pdf', pages: 1 }, { name: 'super-work-agreement.pdf', pages: 1 }], attachments: [{ name: 'WhatsApp Image 2026-07-14.jpeg' }], cc: [],
      signers: [{ id: 'A', step: 1, status: 'pending', role: 'signer' }, { id: 'B', step: 2, status: 'pending', role: 'approver' }],
      comments: [], status: 'progress' },

    // [tab1] SEQUENTIAL 4 ຂັ້ນ (ບໍ່ພ້ອມກັນ): A→Decha→Chanon→Pheutsapha
    { id: 'd13', title: 'ໃບຂໍອະນຸມັດໂຄງການ ພັດທະນາ App', creatorId: 'A', date: '13/07/2026', ts: 13,
      files: [{ name: 'app_project.pdf', pages: 4, summary: 'ໂຄງການພັດທະນາແອັບ e-Signature ພາຍໃນ ກຳນົດຂອບເຂດ, ງົບປະມານ ແລະ ແຜນເວລາ 6 ເດືອນ.' }], attachments: [], cc: ['E'],
      signers: [{ id: 'A', step: 1, status: 'signed', time: '13/07 · 09:00', role: 'signer' }, { id: 'B', step: 2, status: 'pending', role: 'approver' }, { id: 'F', step: 3, status: 'pending', role: 'signer' }, { id: 'C', step: 4, status: 'pending', role: 'approver' }],
      comments: [], status: 'progress' },

    // [tab1] PARALLEL (Decha+Chanon ພ້ອມກັນ ຂັ້ນ 2)
    { id: 'd14', title: 'ໃບສະເໜີແຜນງົບປະມານ ປີ 2027', creatorId: 'A', date: '13/07/2026', ts: 13,
      files: [{ name: 'budget_2027.pdf', pages: 6, summary: 'ແຜນງົບປະມານປະຈຳປີ 2027 ແຍກຕາມພະແນກ ພ້ອມເປົ້າໝາຍການໃຊ້ຈ່າຍ.' }], attachments: [], cc: [],
      signers: [{ id: 'A', step: 1, status: 'signed', time: '13/07 · 08:30', role: 'signer' }, { id: 'B', step: 2, status: 'pending', role: 'approver' }, { id: 'F', step: 2, status: 'pending', role: 'signer' }, { id: 'C', step: 3, status: 'pending', role: 'approver' }],
      comments: [], status: 'progress' },

    // [tab1] A ຍົກເລີກເອງ — CARD ຍົກເລີກ
    { id: 'd15', title: 'ໃບຂໍຊື້ອຸປະກອນ ຫ້ອງປະຊຸມ', creatorId: 'A', date: '10/07/2026', ts: 10,
      files: [{ name: 'meeting_equip.pdf', pages: 1 }], attachments: [], cc: [],
      signers: [{ id: 'B', step: 1, status: 'pending', role: 'approver' }, { id: 'C', step: 2, status: 'pending', role: 'approver' }],
      comments: [], status: 'cancelled' },

    // [tab1] Decha ປະຕິເສດ — CARD ຖືກປະຕິເສດ
    { id: 'd16', title: 'ໃບເບີກຄ່າ ຝຶກອົບຮົມ', creatorId: 'A', date: '09/07/2026', ts: 9,
      files: [{ name: 'training_claim.pdf', pages: 2 }], attachments: [], cc: [],
      signers: [{ id: 'B', step: 1, status: 'rejected', reason: 'ຂໍ້ມູນຄ່າໃຊ້ຈ່າຍບໍ່ຄົບ ກະລຸນາແກ້ໄຂ', role: 'approver' }, { id: 'C', step: 2, status: 'pending', role: 'approver' }],
      comments: [], status: 'rejected' },

    // [tab2·A] CARD: ຫຼາຍคน ບໍ່ພ້ອມກັນ (SEQ 3) + CC · done
    { id: 'd1', title: 'ໃບສະເໜີລາຄາຕິດຕັ້ງ Cloud ປະຈຳປີ', creatorId: 'A', date: '12/07/2026', ts: 12,
      files: [{ name: 'cloud_quote.pdf', pages: 2, summary: 'ໃບສະເໜີລາຄາຕິດຕັ້ງລະບົບ Cloud ລວມຄ່າ hardware, license ແລະ ບໍລິການ ຕະຫຼອດ 12 ເດືອນ. ຍອດລວມ 45 ລ້ານກີບ.' }], attachments: [], cc: ['E'],
      signers: [{ id: 'A', step: 1, status: 'signed', time: '12/07 · 09:00', role: 'signer' }, { id: 'B', step: 2, status: 'signed', time: '12/07 · 11:00', role: 'approver' }, { id: 'C', step: 3, status: 'signed', time: '12/07 · 15:00', role: 'approver' }],
      comments: [], status: 'done' },

    // [tab2·A] CARD: ຫຼາຍคน ມีพร้อมกัน (PARALLEL) + CC + ໄຟລ໌ແนบ · done
    { id: 'd2', title: 'ໃບອະນຸມັດງົບປະມານ ໄຕມາດ 3', creatorId: 'A', date: '11/07/2026', ts: 11,
      files: [{ name: 'q3_budget.pdf', pages: 3, summary: 'ສະຫຼຸບງົບປະມານໄຕມາດ 3 ແຍກຕາມພະແນກ ພ້ອມການວິເຄາະການໃຊ້ຈ່າຍ ທຽບກັບແຜນ.' }], attachments: [{ name: 'breakdown.xlsx' }, { name: 'chart.png' }], cc: ['E', 'D'],
      signers: [{ id: 'B', step: 1, status: 'signed', time: '11/07 · 10:00', role: 'signer' }, { id: 'F', step: 1, status: 'signed', time: '11/07 · 10:20', role: 'signer' }, { id: 'C', step: 2, status: 'signed', time: '11/07 · 16:00', role: 'approver' }],
      comments: [], status: 'done' },

    // [tab2·A] CARD: ເຊັນครบ (done, ງ่าย)
    { id: 'd4', title: 'ບົດລາຍງານປະຈຳເດືອນ ພະແນກ Tech', creatorId: 'A', date: '05/07/2026', ts: 5,
      files: [{ name: 'report.pdf', pages: 4 }], attachments: [], cc: [],
      signers: [{ id: 'B', step: 1, status: 'signed', time: '05/07 · 09:00', role: 'approver' }, { id: 'C', step: 2, status: 'signed', time: '05/07 · 14:00', role: 'approver' }],
      comments: [], status: 'done' },

    // ════════ B (Decha · ຫົວໜ້า Tech) ສ້າງ ════════
    // [tab1·B] · [tab2·A] CARD: ຍັງບໍ່ครบ ແต่ A ເຊັນแล้ว (partial)
    { id: 'd3', title: 'ໃບເບີກຄ່າໃຊ້ຈ່າຍ ເດີນທາງ', creatorId: 'B', date: '14/07/2026', ts: 14,
      files: [{ name: 'travel_claim.pdf', pages: 2, summary: 'ໃບເບີກຄ່າເດີນທາງ ລວມຄ່າຍົນ, ໂຮງແຮມ ແລະ ຄ່າໃຊ້ຈ່າຍປະຈຳວັນ 3 ມື້.' }], attachments: [], cc: [],
      signers: [{ id: 'A', step: 1, status: 'signed', time: '13/07 · 10:30', role: 'signer' }, { id: 'C', step: 2, status: 'pending', role: 'approver' }],
      comments: [{ id: 'c1', byId: 'B', time: '08/07 · 12:00', text: 'ຮົບກວນກວດຄ່າໃຊ້ຈ່າຍໃຫ້ແດ່ ຂອບໃຈ' }], status: 'progress' },

    // [tab2·B] B ສ້າງ done + CC
    { id: 'd6', title: 'ແຜນພັດທະນາລະບົບ ໄຕມາດ 4', creatorId: 'B', date: '07/07/2026', ts: 7,
      files: [{ name: 'q4_plan.pdf', pages: 3 }], attachments: [], cc: ['E'],
      signers: [{ id: 'B', step: 1, status: 'signed', time: '07/07 · 09:00', role: 'signer' }, { id: 'C', step: 2, status: 'signed', time: '07/07 · 16:00', role: 'approver' }],
      comments: [], status: 'done' },

    // [tab1·B] B ສ້າງ progress
    { id: 'd19', title: 'ໃບຂໍອະນຸມັດ ຈ້າງພະນັກງານ', creatorId: 'B', date: '06/07/2026', ts: 6,
      files: [{ name: 'hire_request.pdf', pages: 2 }], attachments: [], cc: [],
      signers: [{ id: 'A', step: 1, status: 'viewed', role: 'signer' }, { id: 'C', step: 2, status: 'pending', role: 'approver' }],
      comments: [], status: 'progress' },

    // ════════ C (Pheutsapha · ຜู้อำนวยการ) ສ້າງ ════════
    // [tab2·C] C ສ້າງ done PARALLEL + CC
    { id: 'd7', title: 'ນະໂຍບາຍຄວາມປອດໄພຂໍ້ມູນ ອົງກອນ', creatorId: 'C', date: '09/07/2026', ts: 9,
      files: [{ name: 'security_policy.pdf', pages: 5, summary: 'ນະໂຍບາຍຄວາມປອດໄພຂໍ້ມູນ ກຳນົດການເຂົ້າເຖິງ, ການເກັບຮັກສາ ແລະ ການປົກປ້ອງຂໍ້ມູນຂອງອົງກອນ.' }], attachments: [], cc: ['A', 'D'],
      signers: [{ id: 'B', step: 1, status: 'signed', time: '09/07 · 11:00', role: 'signer' }, { id: 'F', step: 1, status: 'signed', time: '09/07 · 11:30', role: 'signer' }],
      comments: [], status: 'done' },

    // [tab1·C] · [tab2·F] C ສ້າງ progress, F ເຊັນแล้ว (partial)
    { id: 'd8', title: 'ຄູ່ມືປະຕິບັດງານ ພະແນກ BD', creatorId: 'C', date: '10/07/2026', ts: 10,
      files: [{ name: 'bd_manual.pdf', pages: 8 }], attachments: [], cc: ['A'],
      signers: [{ id: 'F', step: 1, status: 'signed', time: '10/07 · 13:00', role: 'signer' }, { id: 'G', step: 2, status: 'pending', role: 'approver' }],
      comments: [], status: 'progress' },

    // ════════ F (Chanon Leng · ຫົວໜ້า BD) ສ້າງ ════════
    // [tab2·F] F ສ້າງ done + CC + ໄຟລ໌ແนบ
    { id: 'd9', title: 'ໃບສະເໜີແຜນການຕະຫຼາດ ພະແນກ BD', creatorId: 'F', date: '06/07/2026', ts: 6,
      files: [{ name: 'bd_plan.pdf', pages: 3, summary: 'ແຜນການຕະຫຼາດ ພະແນກ BD ໄຕມາດ 4 ລວມກຸ່ມເປົ້າໝາຍ, ຊ່ອງທາງ ແລະ ງົບປະມານ.' }], attachments: [{ name: 'market_data.xlsx' }], cc: ['A'],
      signers: [{ id: 'G', step: 1, status: 'signed', time: '06/07 · 10:00', role: 'signer' }, { id: 'C', step: 2, status: 'signed', time: '06/07 · 15:00', role: 'approver' }],
      comments: [], status: 'done' },

    // [tab1·F] · [tab2·G] F ສ້າງ progress, G ເຊັນแล้ว (partial)
    { id: 'd18', title: 'ໃບເບີກຄ່າ ກິດຈະກຳ BD', creatorId: 'F', date: '08/07/2026', ts: 8,
      files: [{ name: 'bd_event.pdf', pages: 2 }], attachments: [], cc: [],
      signers: [{ id: 'G', step: 1, status: 'signed', time: '08/07 · 09:30', role: 'signer' }, { id: 'C', step: 2, status: 'pending', role: 'approver' }],
      comments: [], status: 'progress' },

    // ════════ G (Take · ພະນັກງານ BD) ສ້າງ ════════
    // [tab2·G] G ສ້າງ done
    { id: 'd10', title: 'ໃບຂໍງົບກິດຈະກຳ ພະແນກ BD', creatorId: 'G', date: '04/07/2026', ts: 4,
      files: [{ name: 'bd_budget.pdf', pages: 2 }], attachments: [], cc: [],
      signers: [{ id: 'F', step: 1, status: 'signed', time: '04/07 · 10:00', role: 'approver' }, { id: 'C', step: 2, status: 'signed', time: '04/07 · 14:00', role: 'approver' }],
      comments: [], status: 'done' },

    // [tab1·G] G ສ້າງ progress
    { id: 'd20', title: 'ໃບຂໍງົບ ຝຶກອົບຮົມ BD', creatorId: 'G', date: '05/07/2026', ts: 5,
      files: [{ name: 'bd_training.pdf', pages: 1 }], attachments: [], cc: [],
      signers: [{ id: 'F', step: 1, status: 'pending', role: 'approver' }, { id: 'C', step: 2, status: 'pending', role: 'approver' }],
      comments: [], status: 'progress' },

    // ════════ ຄົນອື່ນ (D·ວິໄລ, E·ບຸນມີ) ສ້າງ — ໃຫ້ C ເຊັນຫຼາຍ ════════
    // [tab2·A,C] done
    { id: 'd5', title: 'ຂໍ້ຕົກລົງຮ່ວມມື MOU', creatorId: 'D', date: '08/07/2026', ts: 8,
      files: [{ name: 'mou.pdf', pages: 2 }], attachments: [], cc: [],
      signers: [{ id: 'A', step: 1, status: 'signed', time: '08/07 · 11:00', role: 'signer' }, { id: 'C', step: 2, status: 'signed', time: '08/07 · 15:00', role: 'approver' }],
      comments: [], status: 'done' },

    // [tab2·A,C] done
    { id: 'd11', title: 'ສັນຍາບໍລິການ ລະບົບ IT', creatorId: 'E', date: '03/07/2026', ts: 3,
      files: [{ name: 'it_service.pdf', pages: 3 }], attachments: [], cc: ['B'],
      signers: [{ id: 'A', step: 1, status: 'signed', time: '03/07 · 09:00', role: 'signer' }, { id: 'C', step: 2, status: 'signed', time: '03/07 · 15:00', role: 'approver' }],
      comments: [], status: 'done' },

    // [tab2·B,C] done
    { id: 'd12', title: 'ໃບອະນຸມັດຈັດຊື້ ອຸປະກອນ', creatorId: 'D', date: '02/07/2026', ts: 2,
      files: [{ name: 'purchase.pdf', pages: 2 }], attachments: [], cc: [],
      signers: [{ id: 'B', step: 1, status: 'signed', time: '02/07 · 10:00', role: 'signer' }, { id: 'C', step: 2, status: 'signed', time: '02/07 · 14:00', role: 'approver' }],
      comments: [], status: 'done' },

    // [tab2·F,C] · [tab1... D ສ້າง] F ເຊັນแล้ว, C pending (partial ສຳລັບ F)
    { id: 'd17', title: 'ຂໍ້ຕົກລົງ BD ກັບ Vendor', creatorId: 'D', date: '09/07/2026', ts: 9,
      files: [{ name: 'bd_vendor.pdf', pages: 2 }], attachments: [], cc: [],
      signers: [{ id: 'F', step: 1, status: 'signed', time: '09/07 · 10:00', role: 'signer' }, { id: 'C', step: 2, status: 'pending', role: 'approver' }],
      comments: [], status: 'progress' },

    // [tab2·G,F,C] CARD ຫຼາຍคน ບໍ່พร้อม (SEQ 3) + CC · done — ໃຫ້ BD users ມີเคส 1
    { id: 'd21', title: 'ສັນຍາຮ່ວມມື ຍຸດທະສາດ ອົງກອນ', creatorId: 'E', date: '10/07/2026', ts: 10,
      files: [{ name: 'partnership.pdf', pages: 3, summary: 'ສັນຍາຮ່ວມມືທາງຍຸດທະສາດ ໄລຍະ 3 ປີ ກວມເອົາ ການຕະຫຼາດ, ເຕັກໂນໂລຊີ ແລະ ບຸກຄະລາກອນ.' }], attachments: [], cc: ['A', 'D'],
      signers: [{ id: 'G', step: 1, status: 'signed', time: '10/07 · 09:00', role: 'signer' }, { id: 'F', step: 2, status: 'signed', time: '10/07 · 11:00', role: 'approver' }, { id: 'C', step: 3, status: 'signed', time: '10/07 · 15:00', role: 'approver' }],
      comments: [], status: 'done' },

    // [tab2·G,F,C] CARD ຫຼາຍคน ມีพร้อม (PARALLEL) + CC · done — ໃຫ້ BD users ມີเคส 2
    { id: 'd22', title: 'ໃບອະນຸມັດໂຄງການ ຮ່ວມທຶນ', creatorId: 'D', date: '11/07/2026', ts: 11,
      files: [{ name: 'joint_venture.pdf', pages: 4 }], attachments: [{ name: 'terms.xlsx' }], cc: ['A', 'E'],
      signers: [{ id: 'G', step: 1, status: 'signed', time: '11/07 · 09:00', role: 'signer' }, { id: 'F', step: 1, status: 'signed', time: '11/07 · 09:30', role: 'signer' }, { id: 'C', step: 2, status: 'signed', time: '11/07 · 15:00', role: 'approver' }],
      comments: [], status: 'done' },

    // [tab2·B,C partial] B+C ເຊັນແລ້ວ (ขั้น1 พร้อม) A pending — ໃຫ້ B,C ມีเคส 4
    { id: 'd23', title: 'ໃບເບີກຄ່າ ຈັດສຳມະນາ', creatorId: 'D', date: '12/07/2026', ts: 12,
      files: [{ name: 'seminar.pdf', pages: 2 }], attachments: [], cc: ['E'],
      signers: [{ id: 'B', step: 1, status: 'signed', time: '12/07 · 10:00', role: 'signer' }, { id: 'C', step: 1, status: 'signed', time: '12/07 · 10:30', role: 'approver' }, { id: 'A', step: 2, status: 'pending', role: 'approver' }],
      comments: [], status: 'progress' },
  ]
}

// ── helpers ──
export const isSignedDoc = (d) => d.status === 'done'
export const mySigner = (d, me) => d.signers.find((s) => s.id === me)
// ໜ້ານີ້ເປັນຮอบของ me ບໍ (step ปัจจุบันที่ยังไม่เซ็น + เป็นของ me)
export function isMyTurn(d, me) {
  if (d.status !== 'progress') return false
  const s = mySigner(d, me)
  if (!s || s.status === 'signed' || s.status === 'rejected') return false
  const minPending = Math.min(...d.signers.filter((x) => x.status !== 'signed' && x.status !== 'rejected').map((x) => x.step))
  return s.step === minPending
}
export function progress(d) {
  const done = d.signers.filter((s) => s.status === 'signed').length
  return { done, total: d.signers.length, pct: Math.round((done / d.signers.length) * 100) }
}
