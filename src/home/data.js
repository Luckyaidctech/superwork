import { DIRECTORY } from '../flow/shared.jsx'

// ຮູບໂປຣໄຟລ໌ demo (data URI SVG) — ຄົນທີ່ບໍ່ມີ avatarUrl ຈະໃຊ້ initials
const PHOTO_A = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%232563eb'/%3E%3Ccircle cx='20' cy='15.5' r='7' fill='%23dbeafe'/%3E%3Cpath d='M7 37c0-7.5 5.5-11.5 13-11.5S33 29.5 33 37z' fill='%23dbeafe'/%3E%3C/svg%3E"

// ຮູບຕົວຢ່າງ (ໃບຮັບເງິນ) — ໃຫ້ເຫັນວ່າ ໄຟລ໌ຮູບທີ່ຜູ້ໃຊ້ອັບໂຫລດ ຈະໂຊແບບໃດ
export const SAMPLE_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%23ffffff'/%3E%3Crect x='16' y='16' width='268' height='368' rx='6' fill='none' stroke='%23cbd5e1' stroke-width='2'/%3E%3Crect x='40' y='44' width='140' height='13' rx='3' fill='%231f3fb5'/%3E%3Crect x='40' y='68' width='90' height='8' rx='3' fill='%2394a3b8'/%3E%3Cline x1='40' y1='96' x2='260' y2='96' stroke='%23e2e8f0' stroke-width='2'/%3E%3Crect x='40' y='116' width='110' height='8' rx='3' fill='%2364748b'/%3E%3Crect x='196' y='116' width='64' height='8' rx='3' fill='%2364748b'/%3E%3Crect x='40' y='142' width='130' height='8' rx='3' fill='%2394a3b8'/%3E%3Crect x='210' y='142' width='50' height='8' rx='3' fill='%2394a3b8'/%3E%3Crect x='40' y='168' width='96' height='8' rx='3' fill='%2394a3b8'/%3E%3Crect x='214' y='168' width='46' height='8' rx='3' fill='%2394a3b8'/%3E%3Cline x1='40' y1='196' x2='260' y2='196' stroke='%23e2e8f0' stroke-width='2'/%3E%3Crect x='40' y='214' width='60' height='11' rx='3' fill='%231f3fb5'/%3E%3Crect x='196' y='214' width='64' height='11' rx='3' fill='%231f3fb5'/%3E%3Ccircle cx='214' cy='300' r='34' fill='none' stroke='%23dc2626' stroke-width='2'/%3E%3Ctext x='214' y='296' font-family='sans-serif' font-size='9' fill='%23dc2626' text-anchor='middle'%3EPAID%3C/text%3E%3Ctext x='214' y='309' font-family='sans-serif' font-size='6' fill='%23dc2626' text-anchor='middle'%3E10/07/2026%3C/text%3E%3Crect x='40' y='340' width='120' height='7' rx='3' fill='%23cbd5e1'/%3E%3C/svg%3E"

// ── ຜູ້ใช้ demo (ສະຫຼັບໄດ້) — Tech + BD + ຜู้บริหาร ──
export const USERS = [
  { id: 'A', name: 'Anoulack Phengphaxaichanh', role: 'ພະນັກງານ · IT Department', avatarUrl: PHOTO_A },
  { id: 'B', name: 'Decha Ning Kenthaworn', role: 'ຫົວໜ້າ IT Department' },
  { id: 'C', name: 'Pheutsapha Phoummasak', role: 'ຜູ້ອຳນວຍການ' },
  // Pimlada = ຜູ້ອະນຸມັດຂັ້ນ 2 (HR) ຂອງທຸກຄຳຂໍ — ຕ້ອງຢູ່ demo switcher ຈຶ່ງທົດສອບ/demo ຄົບສາຍ
  { id: 'u1', name: 'Pimlada Yui Akkarapiriyakulthorn', role: 'ຫົວໜ້າ HR and Admin' },
  { id: 'F', name: 'Chanon Leng Chamnandechakun', role: 'ຫົວໜ້າ Business Development' },
  { id: 'G', name: 'Take Khounphaxay', role: 'ພະນັກງານ · Business Development' },
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

// ── ຄຳຂໍທົ່ວໄປ (ບໍ່ແມ່ນ e-Signature) — ໃຊ້ຮ່ວມກັນ 2 ໂມດູນ: ໂມດູນ "ຄຳຂໍ" (ຝ່າຍຜູ້ຂໍ) ແລະ "ການອະນຸມັດ" (ຝ່າຍຜູ້ອະນຸມັດ)
// req: { id, title, byId, note, date, from?, to?, hours?, status:'progress'|'approved'|'rejected'|'cancelled', reason? }
export function initialReqs() {
  return {
    leave: [
      { id: 'lv1', title: 'ລາປ່ວຍ', byId: 'G', note: 'ບໍ່ສະບາຍ ເປັນໄຂ້', date: '09/08/2026', from: '08:30', to: '17:30', status: 'approved' },
      { id: 'lv2', title: 'ລາກິດ', byId: 'G', note: 'ວຽກສ່ວນຕົວ', date: '04/08/2026', from: '08:30', to: '17:30', status: 'progress' },
      { id: 'lv3', title: 'ລາພັກປະຈຳປີ', byId: 'F', note: 'ພັກຜ່ອນ', date: '20/08/2026', from: '08:30', to: '17:30', status: 'rejected', reason: 'ຊ່ວງນີ້ວຽກດ່ວນຫຼາຍ' },
      // ── ຂອງ A (ຜູ້ໃຊ້ demo) — ຄົບ 4 ສະຖານະ ໃຫ້ປຸ່ມກອງທຸກປຸ່ມມີຂໍ້ມູນ ──
      { id: 'lv4', title: 'ລາກິດ', byId: 'A', note: 'ວຽກສ່ວນຕົວ', date: '15/07/2026', from: '08:30', to: '17:30', status: 'progress' },
      { id: 'lv6', title: 'ລາພັກປະຈຳປີ', byId: 'A', note: 'ພັກຜ່ອນ ກັບຄອບຄົວ', date: '03/08/2026', dateTo: '07/08/2026', from: '08:30', to: '17:30', status: 'rejected', reason: 'ຊ່ວງນັ້ນມີ demo ໃຫ້ລູກຄ້າ ຂໍເລື່ອນເປັນອາທິດຖັດໄປ' },
      { id: 'lv7', title: 'ລາເບິ່ງແຍງຄອບຄົວ', byId: 'A', note: 'ພາແມ່ໄປໂຮງໝໍ', date: '20/07/2026', from: '08:30', to: '12:00', status: 'cancelled', reason: 'ປ່ຽນເປັນວັນເສົາ ບໍ່ຕ້ອງລາແລ້ວ' },
      // ມີໄຟລ໌ແນບ (ໃບຢັ້ງຢືນແພດ) — ໄຟລ໌ຈິງຖືກຕິດໃສ່ຕອນເປີດແອັບ (App.jsx enrich)
      { id: 'lv5', title: 'ລາປ່ວຍ', byId: 'A', note: 'ໄປພົບແພດ ໂຮງໝໍມິດຕະພາບ', date: '10/07/2026', from: '08:30', to: '17:30', status: 'approved', needFile: 'ໃບຢັ້ງຢືນແພດ.pdf', needImg: 'ຮູບໃບຮັບເງິນ.svg' },
    ],
    offsite: [
      { id: 'of1', title: 'ພົບລູກຄ້າ ທະນາຄານ BCEL', byId: 'G', note: 'ນະຄອນຫຼວງວຽງຈັນ', date: '15/07/2026', from: '08:00', to: '21:00', status: 'progress' },
      { id: 'of2', title: 'ຕິດຕັ້ງລະບົບ ໜ້າງານ HAIXIN', byId: 'F', note: 'ໂຮງງານ ນອກເມືອງ', date: '13/07/2026', from: '08:00', to: '17:00', status: 'approved' },
      { id: 'of3', title: 'ອົບຮົມ ທີມງານ ສາຂາ ປາກເຊ', byId: 'B', note: 'ແຂວງ ຈຳປາສັກ', date: '10/07/2026', from: '08:00', to: '17:00', status: 'progress' },
      // ── ຂອງ A — ຄົບ 4 ສະຖານະ ──
      { id: 'of4', title: 'ທົດສອບລະບົບ ໜ້າງານ', byId: 'A', note: 'BOL', date: '15/07/2026', from: '08:00', to: '21:00', status: 'progress' },
      { id: 'of5', title: 'ພົບລູກຄ້າ', byId: 'A', note: 'ທະນາຄານ BCEL', detail: 'ນຳສະເໜີ ລະບົບ e-Signature', date: '08/07/2026', from: '09:00', to: '12:00', status: 'approved' },
      { id: 'of6', title: 'ອົບຮົມ ນອກສະຖານທີ', byId: 'A', note: 'ແຂວງ ຈຳປາສັກ', detail: 'ອົບຮົມ ທີມງານ ສາຂາ', date: '25/07/2026', dateTo: '26/07/2026', from: '08:00', to: '17:00', status: 'rejected', reason: 'ງົບເດີນທາງ ໄຕມາດນີ້ໝົດແລ້ວ' },
      { id: 'of7', title: 'ສຳຫຼວດ ໜ້າງານ', byId: 'A', note: 'ໂຮງງານ HAIXIN', detail: 'ສຳຫຼວດ ບ່ອນຕິດຕັ້ງ', date: '12/07/2026', from: '08:00', to: '17:00', status: 'cancelled', reason: 'ລູກຄ້າ ຂໍເລື່ອນນັດ' },
    ],
    ot: [
      { id: 'ot1', title: 'AIDC work', byId: 'G', note: 'ວຽກດ່ວນ ໃກ້ກຳນົດສົ່ງ', date: '14/07/2026', from: '17:30', to: '20:30', hours: '3h 0m', status: 'approved' },
      { id: 'ot2', title: 'AIDC work', byId: 'G', note: 'ລູກຄ້າຮ້ອງຂໍ', date: '12/07/2026', from: '17:30', to: '21:30', hours: '4h 0m', status: 'progress' },
      // ── ຂອງ A — ຄົບ 4 ສະຖານະ (ມີ ກິດຈະກຳ + ປະເພດວັນ ຄືກັບຟອມສ້າງ) ──
      { id: 'ot3', title: 'Super Work', byId: 'A', activity: 'ລະບົບຄຳຂໍ', tasks: ['ຟອມໂອທີ', 'ສາຍອະນຸມັດ'], dayType: 'ວັນທຳມະດາ', note: 'ພັດທະນາ ລະບົບຄຳຂໍ', date: '15/07/2026', from: '18:00', to: '20:00', status: 'progress' },
      { id: 'ot4', title: 'e-Signature App', byId: 'A', activity: 'PDF Viewer', tasks: ['Render PDF', 'QR ທ້າຍໜ້າ'], dayType: 'ວັນທຳມະດາ', note: 'ວຽກດ່ວນ ໃກ້ກຳນົດສົ່ງ', date: '09/07/2026', from: '18:00', to: '21:00', status: 'approved' },
      { id: 'ot5', title: 'FDI / BOL System', byId: 'A', activity: 'UAT', tasks: ['ຮັນ UAT ຮອບ 1'], dayType: 'ວັນເສົາ-ອາທິດ', note: 'ທົດສອບ UAT ວັນເສົາ', date: '11/07/2026', from: '09:00', to: '17:00', status: 'rejected', reason: 'ໃຫ້ເຮັດໃນເວລາລາຊະການ ແທນ' },
      { id: 'ot6', title: 'AIDC work', byId: 'A', activity: 'ບຳລຸງຮັກສາລະບົບ', tasks: ['ອັບເດດ server', 'ສຳຮອງຂໍ້ມູນ'], dayType: 'ວັນພັກລັດຖະການ', note: 'ອັບເດດ server', date: '07/07/2026', from: '18:00', to: '20:00', status: 'cancelled', reason: 'ເລື່ອນໄປອາທິດໜ້າ' },
    ],
    // ── ການຈອງ (ຫ້ອງ / ລົດ / ອຸປະກອນ) — ຄົບທຸກສະຖານະ ──
    booking: [
      { id: 'bk1', title: 'ຫ້ອງປະຊຸມ A', byId: 'F', note: 'ນຳສະເໜີ ລູກຄ້າ BCEL', date: '17/07/2026', from: '09:00', to: '11:00', status: 'progress' },
      { id: 'bk2', title: 'ລົດ Toyota HiAce', byId: 'G', note: 'ຮັບ-ສົ່ງ ລູກຄ້າ ສະໜາມບິນ', date: '18/07/2026', from: '08:00', to: '17:00', status: 'progress' },
      { id: 'bk3', title: 'ຫ້ອງປະຊຸມໃຫຍ່', byId: 'B', note: 'ປະຊຸມທີມ ໄຕມາດ 3', date: '20/07/2026', from: '13:00', to: '16:00', status: 'progress' },
      { id: 'bk4', title: 'ໂປຣເຈັກເຕີ', byId: 'G', note: 'ອົບຮົມ ພະນັກງານໃໝ່', date: '16/07/2026', from: '09:00', to: '12:00', status: 'progress' },
      { id: 'bk5', title: 'ຫ້ອງປະຊຸມ B', byId: 'F', note: 'ສຳພາດ ຜູ້ສະໝັກ', date: '14/07/2026', from: '10:00', to: '11:30', status: 'approved' },
      { id: 'bk6', title: 'ລົດ Vigo', byId: 'B', note: 'ຕິດຕັ້ງ ໜ້າງານ HAIXIN', date: '13/07/2026', from: '08:00', to: '18:00', status: 'approved' },
      { id: 'bk7', title: 'ກ້ອງຖ່າຍຮູບ', byId: 'G', note: 'ຖ່າຍງານ ບໍລິສັດ', date: '12/07/2026', from: '13:00', to: '17:00', status: 'approved' },
      { id: 'bk8', title: 'ຫ້ອງ Studio', byId: 'F', note: 'ຖ່າຍວິດີໂອ ແນະນຳລະບົບ', date: '10/07/2026', from: '09:00', to: '17:00', status: 'rejected', reason: 'Studio ຖືກຈອງແລ້ວ ໂດຍທີມ Marketing' },
      { id: 'bk9', title: 'ລົດ Toyota HiAce', byId: 'B', note: 'ໄປແຂວງ ຫຼວງພະບາງ', date: '08/07/2026', from: '06:00', to: '20:00', status: 'rejected', reason: 'ລົດເຂົ້າສ້ອມແປງ ຊ່ວງນັ້ນ' },
      { id: 'bk10', title: 'ຫ້ອງປະຊຸມ A', byId: 'F', note: 'ປະຊຸມ ຍົກເລີກແລ້ວ', date: '02/07/2026', from: '09:00', to: '11:00', status: 'cancelled', reason: 'ລູກຄ້າ ຂໍເລື່ອນນັດ' },
      { id: 'bk11', title: 'ໂປຣເຈັກເຕີ', byId: 'A', note: 'ນຳສະເໜີ ພາຍໃນທີມ', date: '19/07/2026', from: '14:00', to: '16:00', status: 'progress' },
      { id: 'bk12', title: 'ຫ້ອງປະຊຸມ B', byId: 'A', note: 'ທົບທວນ Test Cases', date: '09/07/2026', from: '10:00', to: '12:00', status: 'approved' },
    ],
    // ── ຄວາມຮູ້ (Knowledge Sharing) — store ດຽວກັບ Approval ໝວດ "ຄວາມຮູ້" ──
    // type: text | youtube | pdf · status: draft | progress | rejected | approved(=ເຜີຍແຜ່ແລ້ວ)
    knowledge: [
      { id: 'kn1', byId: 'G', type: 'text', title: 'Run for our forest', note: 'ສະຫຼຸບກິດຈະກຳ ແລ່ນເພື່ອປ່າໄມ້ ຂອງ AIDC',
        content: 'ກິດຈະກຳ Run for our forest ຈັດຂຶ້ນເພື່ອລະດົມທຶນປູກປ່າ. ພະນັກງານເຂົ້າຮ່ວມ 120 ຄົນ ໄດ້ທຶນທັງໝົດ 45 ລ້ານກີບ ນຳໄປປູກຕົ້ນໄມ້ 3,000 ຕົ້ນ ທີ່ແຂວງ ວຽງຈັນ.',
        cats: ['Compliance', 'General'], teams: ['ທັງໝົດ'], date: '23/06/2026', status: 'approved', views: 128, likes: ['A', 'B'], comments: [] },
      { id: 'kn2', byId: 'B', type: 'text', title: 'ເລືອກ Claude Model ໃຫ້ເໝາະກັບງານຂຽນໂຄດ', note: 'ສະຫຼຸບຄວາມຕ່າງຂອງແຕ່ລະໂມເດວ ແລະ ວິທີເລືອກໃຫ້ຄຸ້ມ',
        content: 'Opus 4.8 — ວຽກໃຫຍ່ ຊັບຊ້ອນ, refactor ຫຼາຍໄຟລ໌, migration.\nSonnet 5 — ວຽກປະຈຳວັນ ສະເໝີພາບ ຄວາມໄວ/ຄຸນນະພາບ.\nHaiku 4.5 — ວຽກໄວ ປະລິມານຫຼາຍ.\nເຄັດລັບ: ໃຊ້ Sonnet ເປັນຫຼັກ ແລ້ວຍົກເປັນ Opus ສະເພາະຕອນຕິດບັນຫາຍາກ.',
        cats: ['Technical Skills'], teams: ['Tech'], date: '14/07/2026', status: 'approved', views: 13, likes: ['A'], comments: [] },
      { id: 'kn3', byId: 'F', type: 'youtube', title: 'ວິທີນຳສະເໜີ ໃຫ້ລູກຄ້າປະທັບໃຈ', note: 'ເຕັກນິກ present ໃນ 10 ນາທີ',
        url: 'https://youtu.be/dQw4w9WgXcQ', cats: ['Soft Skills'], teams: ['BD'], date: '12/07/2026', status: 'approved', views: 46, likes: [], comments: [] },
      // ຂອງ A (ຜູ້ໃຊ້ demo) — ຄົບ 4 ສະຖານະ ໃຫ້ປຸ່ມກອງທຸກປຸ່ມມີຂໍ້ມູນ
      { id: 'kn4', byId: 'A', type: 'text', title: 'ວິທີໃຊ້ ລະບົບ e-Signature', note: 'ຄູ່ມືເລີ່ມຕົ້ນ ສຳລັບພະນັກງານໃໝ່',
        content: 'ຂັ້ນຕອນ: ສ້າງຄຳຂໍ → ເລືອກຜູ້ລົງນາມ → ວາງຊ່ອງລາຍເຊັນ → ສົ່ງ. ຜູ້ລົງນາມຈະໄດ້ຮັບແຈ້ງເຕືອນ ແລະ ເຊັນຜ່ານມືຖືໄດ້ເລີຍ.',
        cats: ['Technical Skills'], teams: ['ທັງໝົດ'], date: '15/07/2026', status: 'progress', views: 0, likes: [], comments: [] },
      { id: 'kn5', byId: 'A', type: 'pdf', title: 'ສະຫຼຸບ Master Test Cases FDI', note: 'ເອກະສານ TC ທັງໝົດ 214 ລາຍການ',
        needFile: 'master-test-cases.pdf', cats: ['Technical Skills'], teams: ['Tech'], date: '11/07/2026', status: 'draft', views: 0, likes: [], comments: [] },
      { id: 'kn6', byId: 'A', type: 'text', title: 'ເຄັດລັບ ຈັດການເວລາ', note: 'ວິທີແບ່ງເວລາໃນມື້ວຽກຫຍຸ້ງ',
        content: 'ຈັດວຽກສຳຄັນໄວ້ຕອນເຊົ້າ · ປິດແຈ້ງເຕືອນ 2 ຊົ່ວໂມງ · ພັກສາຍຕາທຸກ 45 ນາທີ',
        cats: ['Soft Skills'], teams: ['ທັງໝົດ'], date: '08/07/2026', status: 'rejected', reason: 'ເນື້ອໃນສັ້ນເກີນໄປ ຂໍໃຫ້ເພີ່ມຕົວຢ່າງຈິງ', views: 0, likes: [], comments: [] },
      { id: 'kn7', byId: 'A', type: 'text', title: 'ສະຫຼຸບ ການປະຊຸມທີມ Tech ໄຕມາດ 2', note: 'ຜົນງານ ແລະ ແຜນໄຕມາດ 3',
        content: 'ໄຕມາດ 2 ສົ່ງມອບ 3 ໂຄງການ. ໄຕມາດ 3 ຈະເນັ້ນ Super Work ແລະ e-Signature.',
        cats: ['General'], teams: ['Tech'], date: '05/07/2026', status: 'approved', views: 89, likes: ['B', 'C', 'F'], comments: [] },
      // ── ຂອງຄົນອື່ນ ທີ່ລໍຖ້າກວດສອບ / ຖືກປະຕິເສດ → ໃຫ້ໂມດູນອະນຸມັດ ມີຂໍ້ມູນຄົບ ──
      { id: 'kn8', byId: 'G', type: 'text', title: 'ວິທີຮັບມື ລູກຄ້າໂມໂຫ', note: 'ເຕັກນິກ 5 ຂັ້ນຕອນ ຫຼຸດຄວາມຕຶງຄຽດ',
        content: '1. ຟັງໃຫ້ຈົບ ບໍ່ຂັດ\n2. ຂໍໂທດ ຢ່າງຈິງໃຈ\n3. ສະຫຼຸບບັນຫາ ໃຫ້ລູກຄ້າຢືນຢັນ\n4. ສະເໜີທາງອອກ 2 ທາງ\n5. ຕິດຕາມຜົນ ພາຍໃນ 24 ຊົ່ວໂມງ',
        cats: ['Soft Skills'], teams: ['BD'], date: '16/07/2026', status: 'progress', views: 0, likes: [], comments: [] },
      { id: 'kn9', byId: 'F', type: 'pdf', title: 'ຄູ່ມືການໃຊ້ ລະບົບ BOL', note: 'ເອກະສານ ສຳລັບພະນັກງານໃໝ່',
        needFile: 'bol-manual.pdf', cats: ['Technical Skills', 'Compliance'], teams: ['ທັງໝົດ'], date: '15/07/2026', status: 'progress', views: 0, likes: [], comments: [] },
      { id: 'kn10', byId: 'B', type: 'youtube', title: 'ແນະນຳ Git ສຳລັບທີມ', note: 'ພື້ນຖານ branch · merge · PR',
        url: 'https://youtu.be/HkdAHXoRtos', cats: ['Technical Skills'], teams: ['Tech'], date: '13/07/2026', status: 'progress', views: 0, likes: [], comments: [] },
      { id: 'kn11', byId: 'G', type: 'text', title: 'ເມນູອາຫານ ໃກ້ຫ້ອງການ', note: 'ລວມຮ້ານແຊບ ໃກ້ AIDC',
        content: 'ຮ້ານເຝີ ຫລັກ 3 · ຂ້າວປຽກ ຂ້າງທະນາຄານ · ຮ້ານກາເຟ ຊັ້ນລຸ່ມ',
        cats: ['General'], teams: ['ທັງໝົດ'], date: '02/07/2026', status: 'rejected', reason: 'ບໍ່ກ່ຽວຂ້ອງກັບວຽກ ຂໍໃຫ້ໂພສໃນກຸ່ມ chat ແທນ', views: 0, likes: [], comments: [] },
      { id: 'kn12', byId: 'F', type: 'text', title: 'ສະຫຼຸບ ກອງປະຊຸມລູກຄ້າ HAIXIN', note: 'ຂໍ້ຕົກລົງ ແລະ ຂັ້ນຕອນຕໍ່ໄປ',
        content: 'ລູກຄ້າ ຕົກລົງ scope ໄລຍະ 1 ແລ້ວ. ຈະເລີ່ມຕິດຕັ້ງ ຕົ້ນເດືອນໜ້າ. ຕ້ອງກຽມ ເອກະສານສັນຍາ ພາຍໃນອາທິດນີ້.',
        cats: ['General', 'Compliance'], teams: ['BD'], date: '10/07/2026', status: 'approved', views: 34, likes: ['A', 'G'], comments: [] },
    ],
  }
}
// ໝວດ ແລະ ທີມ ຂອງໂພສຄວາມຮູ້
export const KN_CATS = ['Compliance', 'General', 'Soft Skills', 'Technical Skills']
export const KN_TEAMS = ['ທັງໝົດ', 'Tech', 'BD', 'HR']
export const KN_TYPES = [
  { v: 'text', label: 'ຂໍ້ຄວາມ', ic: 'doc' },
  { v: 'youtube', label: 'YouTube', ic: 'video' },
  { v: 'pdf', label: 'PDF', ic: 'pdf' },
]
export const KN_STATUS = {
  draft: { t: 'ຮ່າງ', c: 'cancel' },
  progress: { t: 'ລໍຖ້າອະນຸມັດ', c: 'wait' },
  rejected: { t: 'ຖືກປະຕິເສດ', c: 'rej' },
  approved: { t: 'ເຜີຍແຜ່ແລ້ວ', c: 'done' },
}

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
// ── ໂຄງການ → ກິດຈະກຳ → ໜ້າວຽກ (ຟອມໂອທີ: ເລືອກໂຄງການ → ກິດຈະກຳ → ຕິກໜ້າວຽກ ໄດ້ຫຼາຍອັນ) ──
export const PROJECTS = [
  { name: 'Super Work', activities: [
    { name: 'Work board', tasks: ['ອອກແບບ UI ໜ້າ board', 'ເຊື່ອມ API', 'ແກ້ໄຂ drag & drop', 'ທົດສອບ'] },
    { name: 'Dashboard', tasks: ['ກຣາຟສະຫຼຸບ', 'Filter ຕາມທີມ', 'Export Excel'] },
    { name: 'ລະບົບຄຳຂໍ', tasks: ['ຟອມລາພັກ', 'ຟອມໂອທີ', 'ສາຍອະນຸມັດ', 'ແຈ້ງເຕືອນ'] },
    { name: 'ແກ້ໄຂ Bug', tasks: ['Bug ໜ້າ login', 'Bug ແຈ້ງເຕືອນ', 'Bug ອັບໂຫລດໄຟລ໌'] },
  ] },
  { name: 'e-Signature App', activities: [
    { name: 'UI Prototype', tasks: ['ໜ້າສ້າງຄຳຂໍ', 'ໜ້າວາງລາຍເຊັນ', 'ໜ້າກວດ/ສົ່ງ'] },
    { name: 'PDF Viewer', tasks: ['Render PDF', 'ວາງກ່ອງລາຍເຊັນ', 'QR ທ້າຍໜ້າ'] },
    { name: 'ທົດສອບລະບົບ', tasks: ['ທົດສອບ flow ເຊັນ', 'ທົດສອບ LANIT', 'ທົດສອບ ແຈ້ງເຕືອນ'] },
  ] },
  { name: 'FDI / BOL System', activities: [
    { name: 'Master Test Cases', tasks: ['ຂຽນ TC ໂມດູນ Mobile', 'ຂຽນ TC ໂມດູນ BOL', 'ທົບທວນ TC'] },
    { name: 'UAT', tasks: ['ກຽມຂໍ້ມູນ UAT', 'ຮັນ UAT ຮອບ 1', 'ສະຫຼຸບຜົນ'] },
    { name: 'ແກ້ໄຂ Bug', tasks: ['Bug ຈາກ UAT', 'Bug ຈາກລູກຄ້າ'] },
  ] },
  { name: 'AIDC work', activities: [
    { name: 'ງານທົ່ວໄປ', tasks: ['ປະຊຸມທີມ', 'ເອກະສານ', 'ຊ່ວຍງານອື່ນ'] },
    { name: 'ບຳລຸງຮັກສາລະບົບ', tasks: ['ອັບເດດ server', 'ສຳຮອງຂໍ້ມູນ', 'ກວດ log'] },
  ] },
]
// ປະເພດວັນ (ອັດຕາໂອທີຕ່າງກັນ) — ຕາມລະບົບຈິງ 4 ແບບ
export const DAY_TYPES = [
  { v: 'ວັນທຳມະດາ', dot: '#1f3fb5' },
  { v: 'ວັນເສົາ-ອາທິດ', dot: '#7c3aed' },
  { v: 'ວັນພັກລັດຖະການ', dot: '#dc2626' },
  { v: 'ວັນພິເສດ', dot: '#f59e0b' },
]

// ── ຄິດເວລາຄຳຂໍ (ໃຊ້ຮ່ວມ: ຟອມສ້າງ · ການ໌ດ · ໜ້າລາຍລະອຽດ) ──
// ພັກທ່ຽງ 12:00–13:00 ບໍ່ນັບ ຖ້າຊ່ວງເວລາຄ້ອມ
const LUNCH = { from: 12 * 60, to: 13 * 60 }
const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m }
export const daysBetween = (a, b) => {
  const [d1, m1, y1] = a.split('/').map(Number); const [d2, m2, y2] = b.split('/').map(Number)
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 864e5) + 1
}
export const fmtH = (mins) => `${Math.floor(mins / 60)}h ${mins % 60}m`
// ── ຊ່ວງວັນທີ ແບບສັ້ນ: ຕັດປີ/ເດືອນທີ່ຊ້ຳອອກ → "03 – 07/08/2026" (ບໍ່ຕົກແຖວ) ──
export const fmtRange = (a, b) => {
  if (!b || b === a) return a
  const [d1, m1, y1] = a.split('/'); const [d2, m2, y2] = b.split('/')
  if (y1 !== y2) return `${a} – ${b}`
  if (m1 !== m2) return `${d1}/${m1} – ${d2}/${m2}/${y2}`
  return `${d1} – ${d2}/${m2}/${y2}`
}
// r = { date, dateTo?, from, to } → { days, cut, perDay, total, totalText }
export function reqTime(r) {
  const days = r.dateTo && r.dateTo !== r.date ? Math.max(1, daysBetween(r.date, r.dateTo)) : 1
  if (!r.from || !r.to) return { days, cut: 0, perDay: 0, total: 0, totalText: '' }
  let mins = toMin(r.to) - toMin(r.from)
  if (mins < 0) mins += 24 * 60
  const cut = Math.max(0, Math.min(toMin(r.to), LUNCH.to) - Math.max(toMin(r.from), LUNCH.from))
  const perDay = Math.max(0, mins - cut)
  return { days, cut, perDay, total: perDay * days, totalText: fmtH(perDay * days) }
}

// ── ຈັດລຳດັບລາຍການ (ໃຊ້ຮ່ວມ: ອະນຸມັດ · ຄຳຂໍ · ຄວາມຮູ້) ──
// ທີ່ຍັງລໍຖ້າ ຂຶ້ນກ່ອນສະເໝີ ແລ້ວຮຽງຕາມວັນທີ (ໃກ້ຮອດກ່ອນ) · ທີ່ຈົບແລ້ວ = ໃໝ່ສຸດກ່ອນ
const dnum = (d) => { const [dd, mm, yy] = String(d || '').split('/').map(Number); return (yy || 0) * 10000 + (mm || 0) * 100 + (dd || 0) }
const isPending = (m) => m.status === 'progress' || m.status === 'esign'
export const sortPendingFirst = (list) => [...list].sort((a, b) => {
  if (isPending(a) !== isPending(b)) return isPending(a) ? -1 : 1
  return isPending(a) ? dnum(a.date) - dnum(b.date) : dnum(b.date) - dnum(a.date)
})

// ── ສາຍອະນຸມັດຄຳຂໍ — ຕ່າງກັນຕາມປະເພດ ──
//   ລາພັກ / ວຽກນອກສະຖານທີ → ຫົວໜ້າພະແນກ → HR (2 ຂັ້ນ)
//   ໂອທີ                  → ຫົວໜ້າພະແນກ ຢ່າງດຽວ (1 ຂັ້ນ)
// ໃຊ້ຮ່ວມ ຟອມສ້າງ ແລະ ໜ້າລາຍລະອຽດ → ສາຍທີ່ໂຊຕອນສ້າງ ກັບ ຕອນເບິ່ງ ຕ້ອງກົງກັນ
export const approvalChain = (byId, kind = 'leave') => {
  const rec = DIRECTORY.find((p) => p.id === byId)
  const head = DIRECTORY.find((p) => p.dept === rec?.dept && p.rank === 'head' && p.id !== byId)
  const hr = DIRECTORY.find((p) => p.id === 'u1') // Pimlada — HR ແລະ ບໍລິຫານ
  const chain = [head && { id: head.id, name: head.name, role: 'ຫົວໜ້າພະແນກ' }]
  if (kind !== 'ot') chain.push(hr && { id: hr.id, name: hr.name, role: 'HR ແລະ ບໍລິຫານ' })
  // ກັນຄົນດຽວກັນຊ້ຳ 2 ຂັ້ນ (ເຊັ່ນ ພະນັກງານ HR: ຫົວໜ້າຕົ້ນສັງກັດ = Pimlada = HR ເອງ)
  return chain.filter(Boolean).filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)
}

// ── ອະນຸມັດຫຼາຍຂັ້ນ: r.approvedBy = ລາຍ id ທີ່ອະນຸມັດແລ້ວ ຕາມລຳດັບ ──
// ຄິວປັດຈຸບັນ = chain[approvedBy.length] — ໃຊ້ຮ່ວມ ປຸ່ມອະນຸມັດ · badge · timeline ທຸກໂມດູນ
export const approvedCount = (r) => (r.approvedBy || []).length
export const currentApprover = (r, kind) =>
  (r.status === 'progress' ? approvalChain(r.byId, kind)[approvedCount(r)] || null : null)

// ── ນັບແຍກ role: ຜູ້ລົງນາມ (ມີຊ່ອງເຊັນໃນເອກະສານ) / ຜູ້ອະນຸມັດ (ບໍ່ມີຊ່ອງ — ອະນຸມັດຢ່າງດຽວ) ──
// ໃຊ້ຮ່ວມທຸກທີ່ ເພື່ອໃຫ້ຕົວເລກ ກົງກັບ ຈຳນວນຊ່ອງເຊັນ ໃນເອກະສານສະເໝີ
export const roleCount = (d) => ({
  signers: d.signers.filter((s) => s.role !== 'approver').length,
  approvers: d.signers.filter((s) => s.role === 'approver').length,
})
// ປ້າຍສະຫຼຸບ: "ຜູ້ລົງນາມ 1 · ຜູ້ອະນຸມັດ 1"
export const rolesLabel = (d) => {
  const { signers, approvers } = roleCount(d)
  return [signers ? `ຜູ້ລົງນາມ ${signers}` : '', approvers ? `ຜູ້ອະນຸມັດ ${approvers}` : ''].filter(Boolean).join(' · ')
}
