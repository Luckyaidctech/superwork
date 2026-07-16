import { useState, useEffect } from 'react'
import HomeScreen from './home/HomeScreen.jsx'
import DocDetail from './home/DocDetail.jsx'
import SignatureFlow from './flow/SignatureFlow.jsx'
import SignScreen from './flow/SignScreen.jsx'
import Settings from './flow/Settings.jsx'
import { initialDocs, initialReqs, SAMPLE_IMG, uid, nameOf, isMyTurn, approvalChain } from './home/data.js'

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
  const [view, setView] = useState('home') // 'home' | 'create' | 'detail' | 'sign' | 'settings'
  const [me, setMe] = useState('A')
  const [docs, setDocs] = useState(initialDocs)
  const [notis, setNotis] = useState(() => buildInitialNotis(initialDocs())) // { id, forId, text, docId, time, read }
  const [openId, setOpenId] = useState(null)
  const [signId, setSignId] = useState(null)
  const [reqs, setReqs] = useState(initialReqs) // ຄຳຂໍທົ່ວໄປ — ໃຊ້ຮ່ວມ ໂມດູນ "ຄຳຂໍ" ແລະ "ການອະນຸມັດ"
  const [mySigs, setMySigs] = useState({}) // { [userId]: dataURL } ລາຍເຊັນທີ່ບັນທຶກ
  const [bios, setBios] = useState({}) // { [userId]: bool } — biometric (Face ID / ລາຍນິ້ວມື) ຢືนยันตอนลงนาม
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

  const doc = docs.find((d) => d.id === openId) || null
  // req = { kind, id } → ແຈ້ງເຕືອນຈາກຄຳຂໍ (ລາພັກ/ວຽກນອກ/ໂອທີ) ກົດເປີດເບິ່ງໄດ້
  const pushNoti = (forId, text, docId, kind = 'info', req = null) =>
    setNotis((n) => [{ id: uid(), forId, kind, text, docId, req, time: 'ຕອນນີ້', read: false }, ...n])

  // ── ຄຳຂໍຄະແນນ Workboard: ສ້າງ → ແຈ້ງ director / comment / approve-reject (director ອະນຸມັດ) ──
  const onCreatePoints = (req) => {
    const r = { id: uid(), by: me, date: '14/07/2026', status: 'progress', comments: [], ...req }
    setPointsReqs((p) => [r, ...p])
    if (me !== DIRECTOR) pushNoti(DIRECTOR, `${nameOf(me)} ຂໍ +${req.points} ຄະແນນ (${req.targetName})`, null, 'points')
    return r // ໃຫ້ໜ້າฟอร์ม → เปิด detail ຂອງ req ທີ່ສ້າງ
  }
  const onPointsComment = (id, text, parentId) => {
    setPointsReqs((ps) => ps.map((p) => p.id === id ? { ...p, comments: [...p.comments, { id: uid(), byId: me, time: 'ຕອນນີ້', text, parentId }] } : p))
    const r = pointsReqs.find((p) => p.id === id)
    if (!r) return
    // แจ้งไปหาอีกฝ่าย (requester ↔ director)
    const other = me === r.by ? DIRECTOR : r.by
    if (other !== me) pushNoti(other, `${nameOf(me)} ໄດ້ໃຫ້ຄວາມຄິດເຫັນໃນຄຳຂໍຄະແນນ`, null, parentId ? 'reply' : 'comment')
  }
  const onPointsEditComment = (reqId, cmtId, text) => setPointsReqs((ps) => ps.map((p) => p.id === reqId
    ? { ...p, comments: p.comments.map((c) => c.id === cmtId ? { ...c, text, edited: true } : c) } : p))
  const onPointsDeleteComment = (reqId, cmtId) => setPointsReqs((ps) => ps.map((p) => p.id === reqId
    ? { ...p, comments: p.comments.filter((c) => c.id !== cmtId && c.parentId !== cmtId) } : p))
  const onPointsAction = (id, action, reason) => {
    setPointsReqs((ps) => ps.map((p) => p.id === id ? { ...p, status: action, reason } : p))
    const r = pointsReqs.find((p) => p.id === id)
    if (r && r.by !== me) pushNoti(r.by, action === 'approved'
      ? `ຄຳຂໍ +${r.points} ຄະແນນ (${r.targetName}) ໄດ້ຮັບອະນຸມັດ`
      : `ຄຳຂໍ +${r.points} ຄະແນນ (${r.targetName}) ຖືກປະຕິເສດ${reason ? ` — ${reason}` : ''}`, null, action === 'approved' ? 'approved' : 'rejected')
  }

  // ── ผู้เซ็นปฏิเสธ → แจ้งเตือนผู้สร้าง ──
  // ปฏิเสธ → ล็อก request ทั้งใบ (status='rejected' ทำอะไรต่อไม่ได้)
  const onReject = (docId, reason) => {
    setDocs((ds) => ds.map((d) => d.id === docId
      ? { ...d, status: 'rejected', signers: d.signers.map((s) => (s.id === me ? { ...s, status: 'rejected', reason } : s)) }
      : d))
    const d = docs.find((x) => x.id === docId)
    if (d && d.creatorId !== me) pushNoti(d.creatorId, `${nameOf(me)} ໄດ້ປະຕິເສດ "${d.title}"${reason ? ` — ${reason}` : ''}`, docId, 'rejected')
  }
  // ── ເປີດໜ້າລົງນາມ (SignScreen) ──
  const onStartSign = (docId) => { setSignId(docId); setView('sign') }
  // ── ຢືนยันลงนาม ແລ້ວ (ຈາก SignScreen) → mark signed + แจ้งผู้สร้าง ──
  const markSigned = (docId, sigData = []) => {
    setDocs((ds) => ds.map((d) => {
      if (d.id !== docId) return d
      const signers = d.signers.map((s) => (s.id === me ? { ...s, status: 'signed', time: 'ຕອນນີ້' } : s))
      // ບັນທຶກລາຍເຊັນ (img + scale + ตำแหน่ง) ລົງໃນ placements ຂອງ me → ໂຊເມื่อเปิดดูภายหลัง (end-to-end)
      const sigMap = Object.fromEntries(sigData.map((sd) => [sd.id, sd]))
      const placements = (d.placements || []).map((p) => sigMap[p.id]
        ? { ...p, xPct: sigMap[p.id].pos?.x ?? p.xPct, yPct: sigMap[p.id].pos?.y ?? p.yPct, sig: { img: sigMap[p.id].img, type: sigMap[p.id].type, sealImg: sigMap[p.id].sealImg, date: sigMap[p.id].date, scale: sigMap[p.id].scale } }
        : p)
      return { ...d, signers, placements, status: signers.every((s) => s.status === 'signed') ? 'done' : 'progress' }
    }))
    const d = docs.find((x) => x.id === docId)
    if (!d) { setView('home'); return }
    // ສະຖານະຫຼັງຈາກຂ້ອຍເຊັນ (docs ຍັງເປັນຄ່າເກົ່າໃນ closure ນີ້)
    const after = d.signers.map((s) => (s.id === me ? { ...s, status: 'signed' } : s))
    const allDone = after.every((s) => s.status === 'signed')
    const notified = new Set([me])
    // 1) ຜູ້ສ້າງ → ຮູ້ວ່າມີຄົນເຊັນແລ້ວ
    if (d.creatorId !== me) { pushNoti(d.creatorId, `${nameOf(me)} ໄດ້ເຊັນ "${d.title}" ແລ້ວ`, docId, 'signed'); notified.add(d.creatorId) }
    if (allDone) {
      // 2) ຄົບທຸກຄົນ → ແຈ້ງທຸກຝ່າຍວ່າສຳເລັດ
      after.forEach((s) => { if (!notified.has(s.id)) { pushNoti(s.id, `"${d.title}" ໄດ້ຮັບການລົງນາມຄົບຖ້ວນແລ້ວ`, docId, 'done'); notified.add(s.id) } })
    } else {
      // 3) ຮອດຄິວໃຜຕໍ່ → ແຈ້ງຄົນນັ້ນ (ບໍ່ດັ່ງນັ້ນລາວບໍ່ຮູ້ວ່າຮອດຮອບຕົນ)
      const pending = after.filter((s) => s.status !== 'signed' && s.status !== 'rejected')
      const nextStep = Math.min(...pending.map((s) => s.step))
      pending.filter((s) => s.step === nextStep).forEach((s) => {
        if (notified.has(s.id)) return
        // ຜູ້ອະນຸມັດ ບໍ່ໄດ້ເຊັນ → ໃຊ້ຄຳວ່າ "ອະນຸມັດ" ບໍ່ແມ່ນ "ລົງນາມ"
        const act = s.role === 'approver' ? 'ອະນຸມັດ' : 'ລົງນາມ'
        pushNoti(s.id, `ຮອດຮອບຂອງທ່ານແລ້ວ — ກະລຸນາ${act} "${d.title}"`, docId, 'sign')
        notified.add(s.id)
      })
    }
    setView('home')
  }
  const onSaveSig = (dataURL) => setMySigs((m) => ({ ...m, [me]: dataURL }))
  const onDeleteSig = () => setMySigs((m) => { const c = { ...m }; delete c[me]; return c })
  // biometric ເປັນ toggle ດຽວ (Face ID / ລາຍນິ້ວມື ຮ່ວມກັນ) — on/off
  const onToggleBio = () => setBios((b) => ({ ...b, [me]: !b[me] }))
  // ── เพิ่ม comment (+ ตอบกลับ + @mention) → แจ้งผู้สร้าง + เจ้าของ comment ที่ถูกตอบ + คนที่ถูก tag ──
  const onComment = (docId, text, parentId, mentions = []) => {
    setDocs((ds) => ds.map((d) => d.id === docId
      ? { ...d, comments: [...d.comments, { id: uid(), byId: me, time: 'ຕອນນີ້', text, parentId, mentions }] }
      : d))
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
    // ผู้สร้าง → แจ้ง (ถ้ายังไม่ถูกแจ้ง)
    if (!notified.has(d.creatorId)) { pushNoti(d.creatorId, `${nameOf(me)} ໄດ້ໃຫ້ຄວາມຄິດເຫັນໃນ "${d.title}"`, docId, 'comment'); notified.add(d.creatorId) }
  }
  // ── ผู้สร้างยกเลิก request → แจ้งเตือนผู้เซ็นทุกคน ──
  const onCancel = (docId, reason) => {
    setDocs((ds) => ds.map((d) => (d.id === docId ? { ...d, status: 'cancelled', cancelReason: reason } : d)))
    const d = docs.find((x) => x.id === docId)
    d?.signers.forEach((s) => { if (s.id !== me) pushNoti(s.id, `${nameOf(me)} ໄດ້ຍົກເລີກ "${d.title}"${reason ? ` — ${reason}` : ''}`, docId, 'cancelled') })
  }
  // ── ຄຳຂໍທົ່ວໄປ (ໂອທີ / ລາພັກ / ວຽກນອກ / ຈອງ / ຄວາມຮູ້) — ໃຊ້ຮ່ວມ 2 ໂມດູນ ──
  // ອະນຸມັດ / ປະຕິເສດ → ປ່ຽນ status ຈິງ + ແຈ້ງເຕືອນຜູ້ຂໍ (ໂຊທັງ 2 ໂມດູນ)
  const onReqAction = (kind, id, action, reason) => {
    setReqs((rs) => ({ ...rs, [kind]: (rs[kind] || []).map((r) => (r.id === id ? { ...r, status: action, reason } : r)) }))
    const r = (reqs[kind] || []).find((x) => x.id === id)
    if (!r || r.byId === me) return
    pushNoti(r.byId, action === 'approved'
      ? `ຄຳຂໍ "${r.title}" ຂອງທ່ານ ໄດ້ຮັບອະນຸມັດ`
      : `ຄຳຂໍ "${r.title}" ຂອງທ່ານ ຖືກປະຕິເສດ${reason ? ` — ${reason}` : ''}`,
      null, action === 'approved' ? 'approved' : 'rejected', { kind, id })
  }
  // ສ້າງຄຳຂໍໃໝ່ → ເຂົ້າຄິວລໍຖ້າອະນຸມັດ + ແຈ້ງຜູ້ອຳນວຍການ
  const onCreateReq = (kind, data) => {
    const r = { id: uid(), byId: me, status: 'progress', ...data }
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
    // ຜູ້ຂໍ → ແຈ້ງ (ຖ້າຍັງບໍ່ຖືກແຈ້ງ)
    if (!notified.has(r.byId)) pushNoti(r.byId, `${nameOf(me)} ໄດ້ໃຫ້ຄວາມຄິດເຫັນໃນຄຳຂໍ "${r.title}"`, null, 'comment', { kind, id })
  }
  const onReqEditComment = (kind, id, cmtId, text) => setReqs((rs) => ({ ...rs, [kind]: (rs[kind] || []).map((r) => (r.id === id
    ? { ...r, comments: (r.comments || []).map((c) => (c.id === cmtId ? { ...c, text, edited: true } : c)) } : r)) }))
  const onReqDeleteComment = (kind, id, cmtId) => setReqs((rs) => ({ ...rs, [kind]: (rs[kind] || []).map((r) => (r.id === id
    ? { ...r, comments: (r.comments || []).filter((c) => c.id !== cmtId && c.parentId !== cmtId) } : r)) }))

  // ── ຄວາມຮູ້ (Knowledge Sharing) — ເກັບໃນ reqs.knowledge → ໃຊ້ onReqAction/onReqComment ຮ່ວມກັນໄດ້ ──
  // ບັນທຶກຮ່າງ (draft) = ບໍ່ແຈ້ງໃຜ · ສົ່ງກວດສອບ (progress) = ແຈ້ງຜູ້ອະນຸມັດຂັ້ນທຳອິດ
  const onCreateKn = (data, publish) => {
    const r = { id: uid(), byId: me, status: publish ? 'progress' : 'draft', views: 0, likes: [], comments: [], ...data }
    setReqs((rs) => ({ ...rs, knowledge: [r, ...(rs.knowledge || [])] }))
    if (publish) {
      const first = approvalChain(me, 'knowledge')[0]
      if (first && first.id !== me) pushNoti(first.id, `${nameOf(me)} ສົ່ງໂພສ "${r.title}" ລໍຖ້າກວດສອບ`, null, 'sign', { kind: 'knowledge', id: r.id })
    }
    return r
  }
  // ສົ່ງຮ່າງທີ່ບັນທຶກໄວ້ ໄປກວດສອບ
  const onSubmitKn = (id) => {
    setReqs((rs) => ({ ...rs, knowledge: (rs.knowledge || []).map((r) => (r.id === id ? { ...r, status: 'progress' } : r)) }))
    const r = (reqs.knowledge || []).find((x) => x.id === id)
    const first = approvalChain(me, 'knowledge')[0]
    if (r && first && first.id !== me) pushNoti(first.id, `${nameOf(me)} ສົ່ງໂພສ "${r.title}" ລໍຖ້າກວດສອບ`, null, 'sign', { kind: 'knowledge', id })
  }
  const onKnLike = (id) => setReqs((rs) => ({ ...rs, knowledge: (rs.knowledge || []).map((r) => (r.id === id
    ? { ...r, likes: (r.likes || []).includes(me) ? r.likes.filter((x) => x !== me) : [...(r.likes || []), me] } : r)) }))
  const onKnView = (id) => setReqs((rs) => ({ ...rs, knowledge: (rs.knowledge || []).map((r) => (r.id === id ? { ...r, views: (r.views || 0) + 1 } : r)) }))

  // ຜູ້ຂໍຍົກເລີກຄຳຂໍຂອງຕົນເອງ
  const onCancelReq = (kind, id, reason) => {
    setReqs((rs) => ({ ...rs, [kind]: (rs[kind] || []).map((r) => (r.id === id ? { ...r, status: 'cancelled', reason } : r)) }))
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
    setDocs((ds) => [doc, ...ds])
    doc.signers.forEach((s) => { if (isMyTurn(doc, s.id)) pushNoti(s.id, `ກະລຸນາລົງນາມ "${doc.title}"`, doc.id, 'sign') })
    ;(doc.cc || []).forEach((cid) => pushNoti(cid, `ທ່ານໄດ້ຮັບສຳເນົາ (CC) "${doc.title}"`, doc.id, 'cc'))
  }

  if (view === 'create') return <SignatureFlow me={me} onCreate={onCreate} onExit={() => setView('home')} />
  if (view === 'settings') return <Settings mySig={mySigs[me]} bio={bio} onSaveSig={onSaveSig} onDeleteSig={onDeleteSig} onToggleBio={onToggleBio} onBack={() => setView('home')} />
  if (view === 'sign') {
    const sd = docs.find((d) => d.id === signId)
    if (sd) return <SignScreen doc={sd} mySig={mySigs[me]} bio={bio} signerName={nameOf(me)} meId={me} onSaveSig={onSaveSig} onDone={markSigned} onBack={() => setView(openId ? 'detail' : 'home')} />
  }
  if (view === 'detail' && doc)
    return <DocDetail doc={doc} me={me} onBack={() => setView('home')}
      onReject={onReject} onSign={onStartSign} onComment={onComment} onCancel={onCancel} onRemind={onRemind}
      onEditComment={onEditComment} onDeleteComment={onDeleteComment} />
  return <HomeScreen me={me} setMe={setMe} docs={docs} notis={notis}
    pointsReqs={pointsReqs} director={DIRECTOR} onCreatePoints={onCreatePoints} onPointsComment={onPointsComment} onPointsEditComment={onPointsEditComment} onPointsDeleteComment={onPointsDeleteComment} onPointsAction={onPointsAction}
    reqs={reqs} onReqAction={onReqAction} onCreateReq={onCreateReq} onCancelReq={onCancelReq}
    onReqComment={onReqComment} onReqEditComment={onReqEditComment} onReqDeleteComment={onReqDeleteComment}
    onCreateKn={onCreateKn} onSubmitKn={onSubmitKn} onKnLike={onKnLike} onKnView={onKnView}
    onMarkRead={markMyNotisRead} onNew={() => setView('create')} onOpenDoc={openDoc} onOpenFromNoti={openDoc}
    onOpenSettings={() => setView('settings')} />
}
