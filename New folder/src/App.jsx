import { useState, useEffect } from 'react'
import HomeScreen from './home/HomeScreen.jsx'
import DocDetail from './home/DocDetail.jsx'
import SignatureFlow from './flow/SignatureFlow.jsx'
import SignScreen from './flow/SignScreen.jsx'
import Settings from './flow/Settings.jsx'
import FlowSettingsScreen from './flow/FlowSettingsScreen.jsx'
import { initialDocs, initialReqs, SAMPLE_IMG, uid, nameOf, isMyTurn, actingId, approvalChain, approvedCount, nowDate, docTypeOf, nextDocNo, withDocNos, DEFAULT_DOC_SUBTYPES, DOC_CATEGORIES, canManageFlowSettings } from './home/data.js'

// noti เริ่มต้น: แจ้งผู้เซ็นที่ถึงคิว (ให้เข้าถึง request ที่ต้องเซ็นได้ ผ่านกระดิ่ง)
function buildInitialNotis(ds) {
  const out = []
  const push = (forId, kind, text, d, read = true) => out.push({ id: uid(), forId, kind, text, docId: d.id, time: d.date, read })
  ds.forEach((d) => {
    // ຄົນທີ່ຮອດຄິວເຊັນ (doc ກຳລັງດຳເນີນການ) → ຄຳຂໍລົງນາມ (ຍັງບໍ່ອ່ານ)
    if (d.status === 'progress') d.signers.forEach((s) => { if (isMyTurn(d, s.id)) push(s.id, 'sign', `ກະລຸນາລົງນາມ "${d.title}"`, d, false) })
    // CC → ໄດ້ຮັບສຳເນົາ
    ;(d.cc || []).forEach((cid) => push(cid, 'cc', `ທ່ານໄດ້ຮັບສຳເນົາ (CC) "${d.title}"`, d))
    // ຜູ້ສ້າງ → ຮັບແຈ້ງເມື່ອມີຄົນເຊັນ / ປະຕິເສດ
    d.signers.forEach((s) => {
      if (s.id === d.creatorId) return
      if (s.status === 'signed') push(d.creatorId, 'signed', `${nameOf(s.id)} ໄດ້ເຊັນ "${d.title}" ແລ້ວ`, d)
      if (s.status === 'rejected') push(d.creatorId, 'rejected', `${nameOf(s.id)} ໄດ້ປະຕິເສດ "${d.title}"${s.reason ? ` — ${s.reason}` : ''}`, d, false)
    })
    // ຄວາມຄິດເຫັນ → ແຈ້ງຜູ້ສ້າງ
    ;(d.comments || []).forEach((c) => { if (c.byId !== d.creatorId) push(d.creatorId, 'comment', `${nameOf(c.byId)} ໄດ້ໃຫ້ຄວາມຄິດເຫັນໃນ "${d.title}"`, d) })
    // doc ສຳເລັດຄົບ → ແຈ້ງຜູ້ສ້າງ
    if (d.status === 'done') push(d.creatorId, 'done', `"${d.title}" ໄດ້ຮັບການລົງນາມຄົບຖ້ວນແລ້ວ`, d)
  })
  return out
}

// ໜ້າຫຼັກ My e-Signature ↔ ລາຍລະອຽດເອກະສານ ↔ flow ສ້າງ (3 ຂັ້ນຕອນ)
// ຮອງຮັບ 2 ຜູ້ใช้ (A ↔ B) + ລະບົບແຈ້ງເຕືອນ (noti)
export default function App() {
  const [view, setView] = useState('home') // 'home' | 'create' | 'detail' | 'sign' | 'settings' | 'flowSettings'
  // nav/tab ຂອງ HomeScreen ເກັບໄວ້ນີ້ — HomeScreen ຖືກ unmount ຕອນເປີດ detail/sign/settings
  // ຖ້າເກັບໃນ HomeScreen ເອງ back ຈະເດັ້ງກັບ Dashboard ສະເໝີ ບໍ່ແມ່ນ module+tab ເດີມ (Lucky 19/07)
  const [homeNav, setHomeNav] = useState('dash')
  const [homeTab, setHomeTab] = useState('tosign')
  const [me, setMe] = useState('A')
  const [docs, setDocs] = useState(() => withDocNos(initialDocs()))
  const [notis, setNotis] = useState(() => buildInitialNotis(initialDocs())) // { id, forId, text, docId, time, read }
  const [openId, setOpenId] = useState(null)
  const [signId, setSignId] = useState(null)
  const [reqs, setReqs] = useState(initialReqs) // ຄຳຂໍທົ່ວໄປ — ໃຊ້ຮ່ວມ ໂມດູນ "ຄຳຂໍ" ແລະ "ການອະນຸມັດ"
  const [mySigs, setMySigs] = useState({}) // { [userId]: dataURL } ລາຍເຊັນທີ່ບັນທຶກ
  const [bios, setBios] = useState({}) // { [userId]: bool } — biometric (Face ID / ລາຍນິ້ວມື) ຢືนยันตอนลงนาม
  // E7/E8/E10 Tab 6: subtype ທັງໝົດເປັນ state ແກ້ໄດ້ເຕັມ (deputy/director ເທົ່ານັ້ນ) — ຊື່/prefix/ໝວດ/lockAll/chain/cc + ເພີ່ມ/ລຶບ subtype ໄດ້
  const [docSubtypes, setDocSubtypes] = useState(() => DEFAULT_DOC_SUBTYPES.map((s) => ({ ...s })))
  const onUpdateSubtype = (key, patch) => setDocSubtypes((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  const onAddSubtype = (sub) => {
    let key = sub.key
    let i = 2
    while (docSubtypes.some((s) => s.key === key)) { key = `${sub.key}${i}`; i += 1 }
    setDocSubtypes((prev) => [...prev, { ...sub, key }])
    return key
  }
  const onDeleteSubtype = (key) => setDocSubtypes((prev) => prev.filter((s) => s.key !== key))
  const onResetSubtype = (key) => {
    const def = DEFAULT_DOC_SUBTYPES.find((s) => s.key === key)
    if (def) setDocSubtypes((prev) => prev.map((s) => (s.key === key ? { ...def } : s)))
  }
  // ໝວດ (ພະແນກ) ກໍແກ້ໄດ້ຈາກ Tab 6: ຊື່/ສີ/ໄອຄອນ + ເພີ່ມໝວດໃໝ່ (Lucky 19/07)
  const [docCategories, setDocCategories] = useState(() => Object.fromEntries(Object.entries(DOC_CATEGORIES).map(([k, v]) => [k, { ...v }])))
  const onUpdateCategory = (key, patch) => setDocCategories((cs) => ({ ...cs, [key]: { ...cs[key], ...patch } }))
  const onAddCategory = (cat) => {
    const base = (cat.label || 'new').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 10) || 'new'
    let key = base, i = 2
    while (docCategories[key]) { key = `${base}${i}`; i += 1 }
    setDocCategories((cs) => ({ ...cs, [key]: cat }))
  }
  // ຄຳຂໍຄະແນນ Workboard (seed + ທີ່ສ້າງໃໝ່) — ທຸກອັນໃຊ້ detail hero ດຽວກັນ
  const [pointsReqs, setPointsReqs] = useState(() => [
    // ── ຄົບທຸກສະຖານະ × ຫຼາຍຜູ້ຂໍ × Activity/Task ──
    { id: 'pt1', by: 'B', date: '14/07/2026', status: 'approved', points: 10, current: 200, targetName: 'Master Test Cases', projectName: 'FDI / BOL System', target: 'activity', justify: 'ທົດສອບເພີ່ມ 2 ຮອບ ຕາມທີ່ລູກຄ້າຂໍ', comments: [] },
    { id: 'pt2', by: 'F', date: '07/07/2026', status: 'progress', points: 500, current: 150, targetName: 'UI Prototype', projectName: 'e-Signature App', target: 'activity', justify: 'ອອກແບບ UI ເພີ່ມ 5 ໜ້າ ພ້ອມ prototype', comments: [] },
    { id: 'pt3', by: 'G', date: '16/07/2026', status: 'progress', points: 120, current: 80, targetName: 'ຟອມໂອທີ', projectName: 'Super Work', target: 'task', justify: 'ເຮັດຟອມ + ເຊື່ອມ API ພາຍໃນ 2 ມື້', comments: [] },
    { id: 'pt4', by: 'B', date: '15/07/2026', status: 'progress', points: 80, current: 210, targetName: 'ແກ້ໄຂ Bug ໜ້າ login', projectName: 'Super Work', target: 'task', justify: 'Bug ດ່ວນ ກະທົບຜູ້ໃຊ້ທັງໝົດ', comments: [] },
    { id: 'pt5', by: 'F', date: '13/07/2026', status: 'progress', points: 200, current: 650, targetName: 'ນຳສະເໜີ ລູກຄ້າ BCEL', projectName: 'e-Signature App', target: 'activity', justify: 'ກຽມ demo + ນຳສະເໜີ ໄດ້ສັນຍາ', comments: [] },
    { id: 'pt6', by: 'G', date: '11/07/2026', status: 'approved', points: 150, current: 60, targetName: 'QR ທ້າຍໜ້າ', projectName: 'e-Signature App', target: 'task', justify: 'ເຮັດ QR ສະແກນເປີດເອກະສານໄດ້ຈິງ', comments: [] },
    { id: 'pt7', by: 'B', date: '09/07/2026', status: 'approved', points: 300, current: 190, targetName: 'UAT', projectName: 'FDI / BOL System', target: 'activity', justify: 'ຮັນ UAT ຄົບ 3 ຮອບ ພົບ 12 bug', comments: [] },
    { id: 'pt8', by: 'F', date: '06/07/2026', status: 'rejected', points: 1000, current: 140, targetName: 'ອອກແບບ Logo', projectName: 'e-Signature App', target: 'task', justify: 'ອອກແບບ logo ໃໝ່ 3 ແບບ', comments: [], reason: 'ຄະແນນສູງເກີນ ສຳລັບ scope ນີ້ ຂໍໃຫ້ປັບເປັນ 200' },
    { id: 'pt9', by: 'G', date: '04/07/2026', status: 'rejected', points: 250, current: 55, targetName: 'ປະຊຸມທີມ', projectName: 'AIDC work', target: 'task', justify: 'ເຂົ້າຮ່ວມປະຊຸມ 5 ຄັ້ງ', comments: [], reason: 'ປະຊຸມປົກກະຕິ ບໍ່ນັບເປັນຄະແນນເພີ່ມ' },
    { id: 'pt10', by: 'A', date: '15/07/2026', status: 'progress', points: 180, current: 120, targetName: 'ລະບົບຄຳຂໍ', projectName: 'Super Work', target: 'activity', justify: 'ພັດທະນາ ລາພັກ/ໂອທີ/ວຽກນອກ ຄົບ 3 ໝວດ', comments: [] },
    { id: 'pt11', by: 'A', date: '08/07/2026', status: 'approved', points: 90, current: 30, targetName: 'PDF Viewer', projectName: 'e-Signature App', target: 'task', justify: 'render PDF ຈິງ + ວາງລາຍເຊັນໄດ້', comments: [] },
  ])
  const bio = !!bios[me]
  const DIRECTOR = 'C' // Pheutsapha Phoummasak (id C) = ຜູ້ອຳນວຍການ = ຜู้อนุมัดคะแนน

  // ── enrich seed docs ທຸກສະຖານະ (ດຳເນີນການ/ສຳເລັດ/ປະຕິເສດ/ຍົກເລີກ) ໃຫ້ມີໄຟລ໌ PDF ຈິງ + placements
  //    → ເປີດເບິ່ງແລ້ວເຫັນ QR + ວັນທີ ທ້າຍໜ້າ ຄືກັນໝົດ (ບໍ່ຕົກໄປ mockup ທີ່ບໍ່ມີ) ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // public path (ຕິດ BASE_URL → ໃຊ້ໄດ້ທັງ dev ແລະ GitHub Pages) → QR ສະແກນເປີດໄດ້
      const B = import.meta.env.BASE_URL
      const SRC = [`${B}super-work-invitation.pdf`, `${B}super-work-agreement.pdf`]
      let samples
      try {
        samples = await Promise.all(SRC.map((u) => fetch(u).then((r) => r.blob())))
      } catch { return }
      if (cancelled || !samples) return
      setDocs((ds) => ds.map((d) => {
        if (d.files.some((f) => f.file)) return d // ຂ້າມ request ໃໝ່ (ມີໄຟລ໌ຈິງແລ້ວ)
        const signers = d.signers.filter((s) => s.role === 'signer')
        const files = d.files.map((f, fi) => ({ ...f, id: f.id || `${d.id}-f${fi}`, pages: 2, srcUrl: SRC[fi % SRC.length], file: new File([samples[fi % samples.length]], f.name, { type: 'application/pdf' }) }))
        const placements = []
        files.forEach((f, fi) => {
          const those = fi === 0 ? signers : signers.slice(0, 1) // ໄຟລ໌ທຳອິດ: ຜู้เซ็นทุกคน / ໄຟລ໌ອื่น: ຜู้เซ็นคนแรก
          // ວາງລຽນລົງມາ (ບໍ່ແມ່ນ 2 ຖັນ) — stamp LANIT ກວ້າງ ~54% ຂອງໜ້າ ຖ້າວາງຄູ່ກັນຈະຊ້ອນທັບກັນ
          those.forEach((s, si) => placements.push({ id: `${d.id}-p${fi}-${si}`, pageKey: `${f.id}-1`, signerId: s.id, xPct: 50, yPct: Math.min(92, 60 + si * 15) }))
        })
        return { ...d, files, placements }
      }))
      // ຄຳຂໍ seed ທີ່ມີ needFile/needImg → ຕິດໄຟລ໌ຈິງ ໃຫ້ເປີດເບິ່ງໄດ້ ຄືກັບໄຟລ໌ທີ່ຜູ້ໃຊ້ອັບໂຫລດເອງ
      let imgBlob = null
      try { imgBlob = await (await fetch(SAMPLE_IMG)).blob() } catch {}
      setReqs((rs) => Object.fromEntries(Object.entries(rs).map(([k, arr]) => [k, arr.map((r) => {
        if ((!r.needFile && !r.needImg) || r.files) return r
        const files = []
        if (r.needFile) {
          const f = new File([samples[0]], r.needFile, { type: 'application/pdf' })
          files.push({ name: r.needFile, size: f.size, type: f.type, file: f, url: null })
        }
        if (r.needImg && imgBlob) {
          const f = new File([imgBlob], r.needImg, { type: 'image/svg+xml' })
          files.push({ name: r.needImg, size: f.size, type: f.type, file: f, url: URL.createObjectURL(f) })
        }
        return { ...r, files }
      })])))
    })()
    return () => { cancelled = true }
  }, [])

  // ── QR verify (E5) — mockup ไม่มี backend จริง → snapshot ข้อมูล doc ที่จำเป็นลง localStorage
  //    ให้หน้า verify (VerifyScreen) อ่านได้เมื่อสแกน QR ในอุปกรณ์เดียวกันนี้ (ข้ามอุปกรณ์อื่นจะไม่เจอ)
  useEffect(() => {
    try {
      const snap = Object.fromEntries(docs.filter((d) => d.docNo).map((d) => {
        const signed = d.signers.filter((s) => s.status === 'signed' && s.time)
        return [d.id, {
          docNo: d.docNo, title: d.title, docType: docTypeOf(d), status: d.status,
          createdDate: d.date, completedDate: d.status === 'done' && signed.length ? signed[signed.length - 1].time : null,
          creatorId: d.creatorId, // id ดิบ (ไม่ resolve ชื่อ) → ใช้ nameOf() + DocPageBody mockup ในหน้า verify ได้
          files: d.files.map((f) => f.name), attachments: (d.attachments || []).map((a) => a.name),
          signers: d.signers.map((s) => ({ id: s.id, role: s.role, status: s.status, time: s.time || null, sigType: s.sigType || null })),
        }]
      }))
      localStorage.setItem('superwork_verify', JSON.stringify(snap))
    } catch {}
  }, [docs])

  const doc = docs.find((d) => d.id === openId) || null
  // req = { kind, id } → ແຈ້ງເຕືອນຈາກຄຳຂໍ (ລາພັກ/ວຽກນອກ/ໂອທີ) ກົດເປີດເບິ່ງໄດ້
  const pushNoti = (forId, text, docId, kind = 'info', req = null) =>
    setNotis((n) => [{ id: uid(), forId, kind, text, docId, req, time: 'ຕອນນີ້', read: false }, ...n])

  // ── ຄຳຂໍຄະແນນ Workboard: ສ້າງ → ແຈ້ງ director / comment / approve-reject (director ອະນຸມັດ) ──
  const onCreatePoints = (req) => {
    const r = { id: uid(), by: me, date: nowDate(), status: 'progress', comments: [], ...req } // ວັນທີສ້າງ realtime
    setPointsReqs((p) => [r, ...p])
    if (me !== DIRECTOR) pushNoti(DIRECTOR, `${nameOf(me)} ຂໍ +${req.points} ຄະແນນ (${req.targetName})`, null, 'points', { kind: 'points', id: r.id })
    return r // ໃຫ້ໜ້າฟอร์ม → เปิด detail ຂອງ req ທີ່ສ້າງ
  }
  // E14: @mention ໄດ້ทุกคนในบริษัท → คนที่ถูก tag ได้ noti (points ไม่มี cc concept — แค่แจ้งเตือน)
  const onPointsComment = (id, text, parentId, mentions = []) => {
    setPointsReqs((ps) => ps.map((p) => p.id === id ? { ...p, comments: [...p.comments, { id: uid(), byId: me, time: 'ຕອນນີ້', text, parentId, mentions }] } : p))
    const r = pointsReqs.find((p) => p.id === id)
    if (!r) return
    const notified = new Set([me])
    mentions.forEach((mid) => {
      if (!notified.has(mid)) { pushNoti(mid, `${nameOf(me)} ໄດ້ກ່າວເຖິງທ່ານ (@) ໃນຄຳຂໍຄະແນນ`, null, 'mention', { kind: 'points', id }); notified.add(mid) }
    })
    // แจ้งไปหาอีกฝ่าย (requester ↔ director)
    const other = me === r.by ? DIRECTOR : r.by
    if (!notified.has(other)) pushNoti(other, `${nameOf(me)} ໄດ້ໃຫ້ຄວາມຄິດເຫັນໃນຄຳຂໍຄະແນນ`, null, parentId ? 'reply' : 'comment', { kind: 'points', id })
  }
  const onPointsEditComment = (reqId, cmtId, text) => setPointsReqs((ps) => ps.map((p) => p.id === reqId
    ? { ...p, comments: p.comments.map((c) => c.id === cmtId ? { ...c, text, edited: true } : c) } : p))
  const onPointsDeleteComment = (reqId, cmtId) => setPointsReqs((ps) => ps.map((p) => p.id === reqId
    ? { ...p, comments: p.comments.filter((c) => c.id !== cmtId && c.parentId !== cmtId) } : p))
  const onPointsAction = (id, action, reason) => {
    setPointsReqs((ps) => ps.map((p) => p.id === id
      ? { ...p, status: action, reason, history: [...(p.history || []), { type: action, by: me, time: 'ຕອນນີ້', reason }] } : p))
    const r = pointsReqs.find((p) => p.id === id)
    if (r && r.by !== me) pushNoti(r.by, action === 'approved'
      ? `ຄຳຂໍ +${r.points} ຄະແນນ (${r.targetName}) ໄດ້ຮັບອະນຸມັດ`
      : `ຄຳຂໍ +${r.points} ຄະແນນ (${r.targetName}) ຖືກປະຕິເສດ${reason ? ` — ${reason}` : ''}`, null, action === 'approved' ? 'approved' : 'rejected', { kind: 'points', id })
  }

  // ── ผู้เซ็นปฏิเสธ → แจ้งเตือนผู้สร้าง ──
  // ปฏิเสธ → ล็อก request ทั้งใบ (status='rejected' ทำอะไรต่อไม่ได้)
  const onReject = (docId, reason) => {
    setDocs((ds) => ds.map((d) => d.id === docId
      ? { ...d, status: 'rejected', signers: d.signers.map((s) => (actingId(s) === me ? { ...s, status: 'rejected', reason } : s)) }
      : d))
    const d = docs.find((x) => x.id === docId)
    if (d && d.creatorId !== me) pushNoti(d.creatorId, `${nameOf(me)} ໄດ້ປະຕິເສດ "${d.title}"${reason ? ` — ${reason}` : ''}`, docId, 'rejected')
  }
  // ── ເປີດໜ້າລົງນາມ (SignScreen) ──
  const onStartSign = (docId) => { setSignId(docId); setView('sign') }
  // ── noti ຫຼັງຈາກ me ເຊັນ (d = doc ก่อน update) — ใช้ร่วม markSigned (digital) + onOriginalSign (E2/E13) ──
  const notifyAfterSign = (d, docId) => {
    // ສะถานะหลังจากฉันเซ็น (docs ยังเป็นค่าเก่าใน closure นี้) — E3/E12: ຈັບຄູ່ດ້ວຍ actingId รองรับ delegation
    const after = d.signers.map((s) => (actingId(s) === me ? { ...s, status: 'signed' } : s))
    const allDone = after.every((s) => s.status === 'signed')
    const notified = new Set([me])
    // 1) ຜູ້ສ້າງ → ຮູ້ວ່າມີຄົນເຊັນແລ້ວ
    if (d.creatorId !== me) { pushNoti(d.creatorId, `${nameOf(me)} ໄດ້ເຊັນ "${d.title}" ແລ້ວ`, docId, 'signed'); notified.add(d.creatorId) }
    if (allDone) {
      // 2) ຄົບທຸກຄົນ → ແຈ້ງທຸກຝ່າຍວ່າສຳເລັດ (ແຈ້ງຄົນທີ່ act ຈິງ ຖ້າມອບໝາຍ)
      after.forEach((s) => { const pid = actingId(s); if (!notified.has(pid)) { pushNoti(pid, `"${d.title}" ໄດ້ຮັບການລົງນາມຄົບຖ້ວນແລ້ວ`, docId, 'done'); notified.add(pid) } })
    } else {
      // 3) ຮອດຄິວໃຜຕໍ່ → ແຈ້ງຄົນນັ້ນ (ບໍ່ດັ່ງນັ້ນລາວບໍ່ຮູ້ວ່າຮອດຮອບຕົນ) — ແຈ້ງ actingId ຄົນທີ່ຕ້ອງ act ຈິງ
      const pending = after.filter((s) => s.status !== 'signed' && s.status !== 'rejected')
      const nextStep = Math.min(...pending.map((s) => s.step))
      pending.filter((s) => s.step === nextStep).forEach((s) => {
        const pid = actingId(s)
        if (notified.has(pid)) return
        // ຜູ້ອະນຸມັດ ບໍ່ໄດ້ເຊັນ → ໃຊ້ຄຳວ່າ "ອະນຸມັດ" ບໍ່ແມ່ນ "ລົງນາມ"
        const act = s.role === 'approver' ? 'ອະນຸມັດ' : 'ລົງນາມ'
        pushNoti(pid, `ຮອດຮອບຂອງທ່ານແລ້ວ — ກະລຸນາ${act} "${d.title}"`, docId, 'sign')
        notified.add(pid)
      })
    }
  }
  // ── ຢືนยันลงนาม ແລ້ວ (ຈາก SignScreen) → mark signed + แจ้งผู้สร้าง ──
  const markSigned = (docId, sigData = []) => {
    setDocs((ds) => ds.map((d) => {
      if (d.id !== docId) return d
      const signers = d.signers.map((s) => (actingId(s) === me ? { ...s, status: 'signed', time: 'ຕອນນີ້' } : s))
      // ບັນທຶກລາຍເຊັນ (img + scale + ตำแหน่ง) ລົງໃນ placements ຂອງ me → ໂຊເมื่อเปิดดูภายหลัง (end-to-end)
      const sigMap = Object.fromEntries(sigData.map((sd) => [sd.id, sd]))
      const placements = (d.placements || []).map((p) => sigMap[p.id]
        ? { ...p, xPct: sigMap[p.id].pos?.x ?? p.xPct, yPct: sigMap[p.id].pos?.y ?? p.yPct, sig: { img: sigMap[p.id].img, type: sigMap[p.id].type, sealImg: sigMap[p.id].sealImg, date: sigMap[p.id].date, scale: sigMap[p.id].scale } }
        : p)
      return { ...d, signers, placements, status: signers.every((s) => s.status === 'signed') ? 'done' : 'progress' }
    }))
    const d = docs.find((x) => x.id === docId)
    if (!d) { setView('home'); return }
    notifyAfterSign(d, docId)
    setView('home')
  }
  // ── E2/E13 (redesign Lucky 19/07): ລາຍເຊັນຕົ້ນສະບັບ — ຕົ້ນສະບັບຄົງເດີມ, ໄຟລ໌ສະແກນເກັບເປັນ "ສະບັບເຊັນມື" ແຍກກ່ອງ
  //    (ເບິ່ງທຽບ ຕົ້ນສະບັບ vs ສະບັບເຊັນ ໄດ້ — ແລະ ຄົນຕໍ່ໄປເຮັດວຽກເທິງສະບັບຫຼ້າສຸດ) ──
  const onOriginalSign = (docId, filesByIndex) => {
    setDocs((ds) => ds.map((d) => {
      if (d.id !== docId) return d
      // filesByIndex = { [fileIndex]: File } — ຄົບທຸກໄຟລ໌ (SignScreen ບັງຄັບຄົບກ່ອນກົດ OTP) · ຊື່ = ຊື່ໄຟລ໌ສະແກນຈິງ
      const verFiles = d.files.map((f, i) => ({ name: filesByIndex[i]?.name || f.name, file: filesByIndex[i], original: true }))
      const signedVersions = [...(d.signedVersions || []), { files: verFiles, byId: me, time: 'ຕອນນີ້' }]
      const seatId = d.signers.find((s) => actingId(s) === me)?.id || me // placement ผูกกับ id ที่นั่งเดิม ไม่ใช่ me เสมอไป (E3/E12 delegation)
      const signers = d.signers.map((s) => (actingId(s) === me ? { ...s, status: 'signed', time: 'ຕອນນີ້', sigType: 'original' } : s))
      const placements = (d.placements || []).filter((p) => p.signerId !== seatId) // ຊ່ອງເຊັນຂອງທີ່ນັ່ງນີ້ບໍ່ຈຳເປັນແລ້ວ (ໜ້າສະແກນມີລາຍເຊັນຈິງຢູ່ແລ້ວ)
      return { ...d, signedVersions, signers, placements, status: signers.every((s) => s.status === 'signed') ? 'done' : 'progress' }
    }))
    const d = docs.find((x) => x.id === docId)
    if (!d) { setView('home'); return }
    notifyAfterSign(d, docId)
    setView('home')
  }
  // ── E3/E12: ມอบหมายให้คนอื่นเซ็น/อนุมัติแทน — ผู้รับมอบได้ role เดิมของที่นั่งไปเลย (dedicated 'assigned' tab แสดงทั้ง 2 ทิศ) ──
  const onAssign = (docId, seatId, assigneeId) => {
    setDocs((ds) => ds.map((d) => (d.id === docId
      ? { ...d, signers: d.signers.map((s) => (s.id === seatId ? { ...s, assignedTo: assigneeId } : s)) }
      : d)))
    const d = docs.find((x) => x.id === docId)
    const seat = d?.signers.find((s) => s.id === seatId)
    if (!d || !seat) return
    const act = seat.role === 'approver' ? 'ອະນຸມັດ' : 'ເຊັນ'
    if (assigneeId !== me) pushNoti(assigneeId, `${nameOf(me)} ໄດ້ມອບໝາຍໃຫ້ທ່ານ${act}ແທນ "${d.title}"`, docId, 'sign')
    if (d.creatorId !== me && d.creatorId !== assigneeId) pushNoti(d.creatorId, `${nameOf(me)} ໄດ້ມອບໝາຍໃຫ້ ${nameOf(assigneeId)} ${act}ແທນ ໃນ "${d.title}"`, docId, 'info')
  }
  // ── ดึงการมอบหมายคืน — เฉพาะเจ้าของที่นั่งเดิม (s.id) ทำได้ ──
  const onRevokeAssign = (docId, seatId) => {
    const d = docs.find((x) => x.id === docId)
    const prevAssignee = d?.signers.find((s) => s.id === seatId)?.assignedTo
    setDocs((ds) => ds.map((x) => (x.id === docId
      ? { ...x, signers: x.signers.map((s) => (s.id === seatId ? { ...s, assignedTo: null } : s)) }
      : x)))
    if (d && prevAssignee && prevAssignee !== me) pushNoti(prevAssignee, `${nameOf(me)} ໄດ້ດຶງການມອບໝາຍຄືນ ໃນ "${d.title}"`, docId, 'cancelled')
  }
  const onSaveSig = (dataURL) => setMySigs((m) => ({ ...m, [me]: dataURL }))
  const onDeleteSig = () => setMySigs((m) => { const c = { ...m }; delete c[me]; return c })
  // biometric ເປັນ toggle ດຽວ (Face ID / ລາຍນິ້ວມື ຮ່ວມກັນ) — on/off
  const onToggleBio = () => setBios((b) => ({ ...b, [me]: !b[me] }))
  // ── เพิ่ม comment (+ ตอบกลับ + @mention) → แจ้งผู้สร้าง + เจ้าของ comment ที่ถูกตอบ + คนที่ถูก tag ──
  // E14: tag แล้วได้สิทธิ์เห็นเอกสารถาวร (เพิ่มเป็น CC) — ยกเว้นเอกสารลับ (จำกัดเฉพาะคนในสายเดิม กันความลับรั่ว)
  const onComment = (docId, text, parentId, mentions = []) => {
    setDocs((ds) => ds.map((d) => {
      if (d.id !== docId) return d
      const isConfidential = docTypeOf(d) === 'ເອກະສານລັບ'
      const cc = isConfidential || !mentions.length ? d.cc : [...new Set([...(d.cc || []), ...mentions])]
      return { ...d, comments: [...d.comments, { id: uid(), byId: me, time: 'ຕອນນີ້', text, parentId, mentions }], cc }
    }))
    const d = docs.find((x) => x.id === docId)
    if (!d) return
    const notified = new Set([me])
    // คนที่ถูก @ → แจ้งทันที
    mentions.forEach((mid) => {
      if (!notified.has(mid)) { pushNoti(mid, `${nameOf(me)} ໄດ້ກ່າວເຖິງທ່ານ (@) ໃນ "${d.title}"`, docId, 'mention'); notified.add(mid) }
    })
    // เจ้าของ comment ที่ถูกตอบกลับ → แจ้ง 'reply' ก่อน (เฉพาะเจาะจงกว่า 'comment')
    if (parentId) {
      const p = d.comments.find((c) => c.id === parentId)
      if (p && !notified.has(p.byId)) { pushNoti(p.byId, `${nameOf(me)} ໄດ້ຕອບກັບຄຳເຫັນຂອງທ່ານ`, docId, 'reply'); notified.add(p.byId) }
    }
    // ບໍ່ mention ໃຜ (comment ທຳມະດາ) → ຕ້ອງແຈ້ງ "ຄົນອື່ນທັງໝົດ" ທີ່ກ່ຽວຂ້ອງກັບເອກະສານນີ້ (ຜູ້ສ້າງ + ຜູ້ເຊັນ/ຜູ້ອະນຸມັດທຸກຄົນ) ບໍ່ໃຫ້ພຽງແຕ່ fallback ຫາຜູ້ສ້າງຄົນດຽວ
    // (ບໍ່ດັ່ງນັ້ນ ຖ້າຜູ້ສ້າງເປັນຄົນຄອມເມັນເອງ ຈະບໍ່ມີໃຜຖືກແຈ້ງເລີຍ)
    ;[d.creatorId, ...d.signers.map((s) => s.id)].forEach((pid) => {
      if (!notified.has(pid)) { pushNoti(pid, `${nameOf(me)} ໄດ້ໃຫ້ຄວາມຄິດເຫັນໃນ "${d.title}"`, docId, 'comment'); notified.add(pid) }
    })
  }
  // ── ผู้สร้างยกเลิก request → แจ้งเตือนผู้เซ็นทุกคน ──
  const onCancel = (docId, reason) => {
    setDocs((ds) => ds.map((d) => (d.id === docId ? { ...d, status: 'cancelled', cancelReason: reason } : d)))
    const d = docs.find((x) => x.id === docId)
    d?.signers.forEach((s) => { if (s.id !== me) pushNoti(s.id, `${nameOf(me)} ໄດ້ຍົກເລີກ "${d.title}"${reason ? ` — ${reason}` : ''}`, docId, 'cancelled') })
  }
  // ── ຄຳຂໍທົ່ວໄປ (ໂອທີ / ລາພັກ / ວຽກນອກ / ຈອງ / ຄວາມຮູ້) — ໃຊ້ຮ່ວມ 2 ໂມດູນ ──
  // ອະນຸມັດຫຼາຍຂັ້ນ: ຂັ້ນທຳອິດອະນຸມັດ → ຍັງ progress + ແຈ້ງຄິວຖັດໄປ (ກົດເປີດຈາກ noti ໄດ້)
  // ຄົບທຸກຂັ້ນ → approved + ແຈ້ງຜູ້ຂໍ · ປະຕິເສດຂັ້ນໃດກໍຕາມ → rejected ທັນທີ
  const onReqAction = (kind, id, action, reason) => {
    const r = (reqs[kind] || []).find((x) => x.id === id)
    if (!r) return
    const chain = approvalChain(r.byId, kind)
    const done = action === 'approved' ? [...(r.approvedBy || []), me] : (r.approvedBy || [])
    const finished = action !== 'approved' || done.length >= chain.length
    const status = finished ? action : 'progress'
    // ປະຫວັດກິດຈະກຳ (Lucky 19/07): ທຸກ action ບັນທຶກ ໃຜ/ຫຍັງ/ເມື່ອໃດ ໃສ່ r.history
    setReqs((rs) => ({ ...rs, [kind]: (rs[kind] || []).map((x) => (x.id === id
      ? { ...x, status, reason, approvedBy: done, history: [...(x.history || []), { type: action, by: me, time: 'ຕອນນີ້', reason }] } : x)) }))
    if (!finished) {
      const next = chain[done.length]
      if (next && next.id !== me) pushNoti(next.id, `ຮອດຮອບຂອງທ່ານແລ້ວ — ກະລຸນາອະນຸມັດຄຳຂໍ "${r.title}" (ຂັ້ນ ${done.length + 1}/${chain.length})`, null, 'sign', { kind, id })
      if (r.byId !== me) pushNoti(r.byId, `ຄຳຂໍ "${r.title}" ຜ່ານການອະນຸມັດຂັ້ນ ${done.length}/${chain.length} ແລ້ວ — ລໍຖ້າ ${chain[done.length]?.name}`, null, 'approved', { kind, id })
      return
    }
    if (r.byId !== me) pushNoti(r.byId, action === 'approved'
      ? `ຄຳຂໍ "${r.title}" ຂອງທ່ານ ໄດ້ຮັບອະນຸມັດຄົບທຸກຂັ້ນແລ້ວ`
      : `ຄຳຂໍ "${r.title}" ຂອງທ່ານ ຖືກປະຕິເສດ${reason ? ` — ${reason}` : ''}`,
      null, action === 'approved' ? 'approved' : 'rejected', { kind, id })
  }
  // ສ້າງຄຳຂໍໃໝ່ → ເຂົ້າຄິວລໍຖ້າອະນຸມັດ + ແຈ້ງຜູ້ອຳນວຍການ
  const onCreateReq = (kind, data) => {
    // createdAt = ວັນທີສ້າງຈິງ (realtime) — ຕ່າງຈາກ date ທີ່ເປັນວັນລາ/ວັນຈອງ
    const r = { id: uid(), byId: me, status: 'progress', createdAt: nowDate(), ...data }
    setReqs((rs) => ({ ...rs, [kind]: [r, ...(rs[kind] || [])] }))
    // ແຈ້ງຫົວໜ້າພະແນກ (ຜູ້ອະນຸມັດຂັ້ນທຳອິດ) — ກົດເປີດຄຳຂໍໄດ້
    const first = approvalChain(me, kind)[0]
    if (first && first.id !== me) pushNoti(first.id, `${nameOf(me)} ສົ່ງຄຳຂໍ "${r.title}" ລໍຖ້າອະນຸມັດ`, null, 'sign', { kind, id: r.id })
    return r
  }
  // ── ຄວາມຄິດເຫັນ ໃນຄຳຂໍ (ລາພັກ/ວຽກນອກ/ໂອທີ) — ຄືກັບຂໍລາຍເຊັນ: ຕອບກັບ · ແກ້ໄຂ · ລຶບ · @mention ──
  const onReqComment = (kind, id, text, parentId, mentions = []) => {
    setReqs((rs) => ({ ...rs, [kind]: (rs[kind] || []).map((r) => (r.id === id
      ? { ...r, comments: [...(r.comments || []), { id: uid(), byId: me, time: 'ຕອນນີ້', text, parentId, mentions }] } : r)) }))
    const r = (reqs[kind] || []).find((x) => x.id === id)
    if (!r) return
    const notified = new Set([me])
    // ຄົນທີ່ຖືກ @ → ແຈ້ງທັນທີ
    mentions.forEach((mid) => {
      if (!notified.has(mid)) { pushNoti(mid, `${nameOf(me)} ໄດ້ກ່າວເຖິງທ່ານ (@) ໃນຄຳຂໍ "${r.title}"`, null, 'mention', { kind, id }); notified.add(mid) }
    })
    // ເຈົ້າຂອງ comment ທີ່ຖືກຕອບກັບ
    if (parentId) {
      const p = (r.comments || []).find((c) => c.id === parentId)
      if (p && !notified.has(p.byId)) { pushNoti(p.byId, `${nameOf(me)} ໄດ້ຕອບກັບຄຳເຫັນຂອງທ່ານ`, null, 'reply', { kind, id }); notified.add(p.byId) }
    }
    // ບໍ່ mention ໃຜ (comment ທຳມະດາ) → ແຈ້ງທຸກຄົນທີ່ກ່ຽວຂ້ອງກັບคำขอนี้ (ผู้ขอ + สายอนุมัติทั้งหมด) ไม่ใช่ fallback แค่ผู้ขอคนเดียว
    // (ບໍ່ດັ່ງນັ້ນ ຖ້າຜູ້ຂໍເປັນຄົນຄອມເມັນເອງ ຈະບໍ່ມີໃຜຖືກແຈ້ງເລີຍ)
    ;[r.byId, ...approvalChain(r.byId, kind).map((p) => p.id)].forEach((pid) => {
      if (!notified.has(pid)) { pushNoti(pid, `${nameOf(me)} ໄດ້ໃຫ້ຄວາມຄິດເຫັນໃນຄຳຂໍ "${r.title}"`, null, 'comment', { kind, id }); notified.add(pid) }
    })
  }
  const onReqEditComment = (kind, id, cmtId, text) => setReqs((rs) => ({ ...rs, [kind]: (rs[kind] || []).map((r) => (r.id === id
    ? { ...r, comments: (r.comments || []).map((c) => (c.id === cmtId ? { ...c, text, edited: true } : c)) } : r)) }))
  const onReqDeleteComment = (kind, id, cmtId) => setReqs((rs) => ({ ...rs, [kind]: (rs[kind] || []).map((r) => (r.id === id
    ? { ...r, comments: (r.comments || []).filter((c) => c.id !== cmtId && c.parentId !== cmtId) } : r)) }))

  // ── ຄວາມຮູ້ (Knowledge Sharing) — ເກັບໃນ reqs.knowledge → ໃຊ້ onReqAction/onReqComment ຮ່ວມກັນໄດ້ ──
  // ບັນທຶກຮ່າງ (draft) = ບໍ່ແຈ້ງໃຜ · ສົ່ງກວດສອບ (progress) = ແຈ້ງຜູ້ອະນຸມັດຂັ້ນທຳອິດ
  const onCreateKn = (data, publish) => {
    const r = { id: uid(), byId: me, status: publish ? 'progress' : 'draft', createdAt: nowDate(), views: 0, likes: [], comments: [],
      history: publish ? [{ type: 'submitted', by: me, time: 'ຕອນນີ້' }] : [], ...data }
    setReqs((rs) => ({ ...rs, knowledge: [r, ...(rs.knowledge || [])] }))
    if (publish) {
      const first = approvalChain(me, 'knowledge')[0]
      if (first && first.id !== me) pushNoti(first.id, `${nameOf(me)} ສົ່ງໂພສ "${r.title}" ລໍຖ້າກວດສອບ`, null, 'sign', { kind: 'knowledge', id: r.id })
    }
    return r
  }
  // ສົ່ງຮ່າງທີ່ບັນທຶກໄວ້ ໄປກວດສອບ
  const onSubmitKn = (id) => {
    setReqs((rs) => ({ ...rs, knowledge: (rs.knowledge || []).map((r) => (r.id === id
      ? { ...r, status: 'progress', history: [...(r.history || []), { type: 'submitted', by: me, time: 'ຕອນນີ້' }] } : r)) }))
    const r = (reqs.knowledge || []).find((x) => x.id === id)
    const first = approvalChain(me, 'knowledge')[0]
    if (r && first && first.id !== me) pushNoti(first.id, `${nameOf(me)} ສົ່ງໂພສ "${r.title}" ລໍຖ້າກວດສອບ`, null, 'sign', { kind: 'knowledge', id })
  }
  const onKnLike = (id) => setReqs((rs) => ({ ...rs, knowledge: (rs.knowledge || []).map((r) => (r.id === id
    ? { ...r, likes: (r.likes || []).includes(me) ? r.likes.filter((x) => x !== me) : [...(r.likes || []), me] } : r)) }))
  const onKnView = (id) => setReqs((rs) => ({ ...rs, knowledge: (rs.knowledge || []).map((r) => (r.id === id ? { ...r, views: (r.views || 0) + 1 } : r)) }))

  // ຜູ້ຂໍຍົກເລີກຄຳຂໍຂອງຕົນເອງ → ແຈ້ງຜູ້ອະນຸມັດທີ່ກ່ຽວຂ້ອງແລ້ວ (ເຄີຍໄດ້ noti ຄິວ) ບໍ່ໃຫ້ອະນຸມັດຄ້າງ
  const onCancelReq = (kind, id, reason) => {
    setReqs((rs) => ({ ...rs, [kind]: (rs[kind] || []).map((r) => (r.id === id
      ? { ...r, status: 'cancelled', reason, history: [...(r.history || []), { type: 'cancelled', by: me, time: 'ຕອນນີ້', reason }] } : r)) }))
    const r = (reqs[kind] || []).find((x) => x.id === id)
    if (!r) return
    approvalChain(r.byId, kind).slice(0, approvedCount(r) + 1).forEach((p) => {
      if (p.id !== me) pushNoti(p.id, `${nameOf(me)} ໄດ້ຍົກເລີກຄຳຂໍ "${r.title}"${reason ? ` — ${reason}` : ''}`, null, 'cancelled', { kind, id })
    })
  }
  // ── เตือนผู้ที่ยังไม่ลงนาม ──
  const onRemind = (docId) => {
    const d = docs.find((x) => x.id === docId)
    d?.signers.filter((s) => s.status !== 'signed').forEach((s) =>
      pushNoti(s.id, `ເຕືອນ: ກະລຸນາລົງນາມ "${d.title}"`, docId, 'reminder'))
  }
  // ── ແກ້ໄຂ / ລຶບ comment ຂອງຕົນເອງ ──
  const onEditComment = (docId, commentId, text) => setDocs((ds) => ds.map((d) => d.id === docId
    ? { ...d, comments: d.comments.map((c) => (c.id === commentId && c.byId === me ? { ...c, text, edited: true } : c)) } : d))
  const onDeleteComment = (docId, commentId) => setDocs((ds) => ds.map((d) => d.id === docId
    ? { ...d, comments: d.comments.filter((c) => c.id !== commentId || c.byId !== me) } : d))

  const markMyNotisRead = () => setNotis((n) => n.map((x) => (x.forId === me ? { ...x, read: true } : x)))
  const openDoc = (id) => { setOpenId(id); setView('detail') }

  // ── ສ້າງ request ໃໝ່ → ບັນທຶກເຂົ້າ docs (ໂຊ tab 1) + ແຈ້ງຜູ້ເຊັນທີ່ຖึงคิว ──
  const onCreate = (doc) => {
    // ໃສ່ docNo (E15) — ຄິດຈາກ docs ປັດຈຸບັນ (ບໍ່ແຕະ doc.id)
    const docWithNo = { ...doc, docNo: nextDocNo(docs, doc, doc.date) }
    setDocs((ds) => [docWithNo, ...ds])
    doc.signers.forEach((s) => { if (isMyTurn(doc, s.id)) pushNoti(s.id, `ກະລຸນາລົງນາມ "${doc.title}"`, doc.id, 'sign') })
    ;(doc.cc || []).forEach((cid) => pushNoti(cid, `ທ່ານໄດ້ຮັບສຳເນົາ (CC) "${doc.title}"`, doc.id, 'cc'))
  }

  if (view === 'create') return <SignatureFlow me={me} docSubtypes={docSubtypes} docCategories={docCategories} docs={docs} onCreate={onCreate} onExit={() => setView('home')} />
  if (view === 'settings') return <Settings mySig={mySigs[me]} bio={bio} onSaveSig={onSaveSig} onDeleteSig={onDeleteSig} onToggleBio={onToggleBio}
    canManageFlow={canManageFlowSettings(me)} onOpenFlowSettings={() => setView('flowSettings')} onBack={() => setView('home')} />
  if (view === 'flowSettings') return <FlowSettingsScreen subtypes={docSubtypes} defaultSubtypes={DEFAULT_DOC_SUBTYPES} categories={docCategories}
    onUpdate={onUpdateSubtype} onAdd={onAddSubtype} onDelete={onDeleteSubtype} onReset={onResetSubtype}
    onUpdateCategory={onUpdateCategory} onAddCategory={onAddCategory} onBack={() => setView('settings')} />
  if (view === 'sign') {
    const sd = docs.find((d) => d.id === signId)
    // E3/E12: placements ผูกกับ id ที่นั่งเดิม (ไม่ใช่ me เสมอไปถ้ารับมอบหมายมา) → หา seat id ให้ SignScreen ใช้จับคู่ placement
    const seatId = sd?.signers.find((s) => actingId(s) === me)?.id || me
    if (sd) return <SignScreen doc={sd} mySig={mySigs[me]} bio={bio} signerName={nameOf(me)} meId={me} placementOwnerId={seatId} onSaveSig={onSaveSig} onDone={markSigned} onOriginalSign={(file) => onOriginalSign(signId, file)} onBack={() => setView(openId ? 'detail' : 'home')} />
  }
  if (view === 'detail' && doc)
    return <DocDetail doc={doc} me={me} onBack={() => setView('home')}
      onAssign={onAssign} onRevokeAssign={onRevokeAssign}
      onReject={onReject} onSign={onStartSign} onApprove={(id) => markSigned(id)} onComment={onComment} onCancel={onCancel} onRemind={onRemind}
      onEditComment={onEditComment} onDeleteComment={onDeleteComment} />
  return <HomeScreen me={me} setMe={setMe} docs={docs} notis={notis}
    nav={homeNav} setNav={setHomeNav} tab={homeTab} setTab={setHomeTab}
    pointsReqs={pointsReqs} director={DIRECTOR} onCreatePoints={onCreatePoints} onPointsComment={onPointsComment} onPointsEditComment={onPointsEditComment} onPointsDeleteComment={onPointsDeleteComment} onPointsAction={onPointsAction}
    reqs={reqs} onReqAction={onReqAction} onCreateReq={onCreateReq} onCancelReq={onCancelReq}
    onReqComment={onReqComment} onReqEditComment={onReqEditComment} onReqDeleteComment={onReqDeleteComment}
    onCreateKn={onCreateKn} onSubmitKn={onSubmitKn} onKnLike={onKnLike} onKnView={onKnView}
    onMarkRead={markMyNotisRead} onNew={() => setView('create')} onOpenDoc={openDoc} onOpenFromNoti={openDoc}
    onOpenSettings={() => setView('settings')} />
}
