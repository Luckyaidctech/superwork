import { useState, useRef } from 'react'
import { Icon, Header, SectionHead, initials, ResultPopup, ReasonModal, DIRECTORY, directorySections } from '../flow/shared.jsx'
import FilePreviewModal from '../flow/FilePreviewModal.jsx'
import { nameOf, colorOf, progress, isMyTurn, avatarOf, rolesLabel, docTypeOf, docTypeStyle, actingId } from './data.js'

// ໄຟລ໌ຕົວຢ່າງ (mock) — ຄລິກໄຟລ໌ → ເປີດເບິ່ງ PDF ຈິງ (BASE_URL → ໃຊ້ໄດ້ທັງ dev ແລະ GitHub Pages)
const SAMPLE_PDFS = ['sample.pdf', 'super-work-agreement.pdf', 'super-work-invitation.pdf'].map((f) => `${import.meta.env.BASE_URL}${f}`)

// avatar style: ຮູບ (ຖ້າມີ) ຫຼື ສີພື້ນ + initials
const avBg = (id) => { const u = avatarOf(id); return u ? { backgroundImage: `url("${u}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: colorOf(id) } }

const AI_SUMMARY = 'ເອກະສານສະບັບນີ້ ເປັນເອກະສານທາງການ ຂອງ ບໍລິສັດ AIDC Tech Sole Co., Ltd ທີ່ລະບຸ ລາຍລະອຽດ ຂອບເຂດ ງົບປະມານ ແລະ ເງື່ອນໄຂ ທີ່ກ່ຽວຂ້ອງຢ່າງຄົບຖ້ວນ. ເນື້ອໃນໄດ້ຜ່ານການກວດສອບຄວາມຖືກຕ້ອງແລ້ວ. ຜູ້ລົງນາມລຳດັບກ່ອນໜ້າ ໄດ້ຮັບຮອງຮຽບຮ້ອຍ ແລະ ເອກະສານຍັງຢູ່ລະຫວ່າງລໍຖ້າ ຜູ້ລົງນາມ/ຜູ້ອະນຸມັດ ລຳດັບຕໍ່ໄປ ຕາມຂັ້ນຕອນທີ່ກຳນົດ. ກະລຸນາອ່ານລາຍລະອຽດໃຫ້ຄົບຖ້ວນກ່ອນລົງນາມ ຫຼື ອະນຸມັດ.'

// ── render ຄຳເຫັນ ພ້ອມ highlight @mention (ຕົວໜາ+ສີ) ──
function renderMentions(text, mentions = []) {
  const names = [...new Set((mentions || []).map((id) => nameOf(id)))].filter(Boolean).sort((a, b) => b.length - a.length)
  if (!names.length || !text) return text
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(@(?:${names.map(esc).join('|')}))`, 'g')
  return text.split(re).map((p, i) => (names.some((n) => p === '@' + n)
    ? <span key={i} className="cmt-mention">{p}</span>
    : <span key={i}>{p}</span>))
}
const STATUS = {
  signed: { label: 'ເຊັນແລ້ວ', cls: 'signed' },
  viewed: { label: 'ເປີດເບິ່ງແລ້ວ', cls: 'view' },
  pending: { label: 'ຍັງບໍ່ເປີດ', cls: 'wait' },
  rejected: { label: 'ປະຕິເສດ', cls: 'rej' },
}

export default function DocDetail({ doc: d, me, onBack, onReject, onSign, onApprove, onComment, onCancel, onRemind, onEditComment, onDeleteComment, onAssign, onRevokeAssign }) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false) // E3/E12: มอบหมายให้คนอื่นเซ็น/อนุมัติแทน
  const [assignQ, setAssignQ] = useState('')
  const [approveOpen, setApproveOpen] = useState(false) // ຢືນຢັນອະນຸມັດ (role approver — ບໍ່ມີຊ່ອງເຊັນ)
  const [approvePopup, setApprovePopup] = useState(false)
  const [rejPopup, setRejPopup] = useState(false)
  const [cancelPopup, setCancelPopup] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [actOpen, setActOpen] = useState(false)
  const [cmt, setCmt] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyToName, setReplyToName] = useState('')
  const [mentionIds, setMentionIds] = useState([])
  const [mentionQ, setMentionQ] = useState(null)
  const [flash, setFlash] = useState('')
  const [preview, setPreview] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [cmtAttach, setCmtAttach] = useState(null) // { label, icon } — mock ໄຟລ໌ແນບໃນຄຳເຫັນ
  const [attachMenu, setAttachMenu] = useState(false)
  const cmtInputRef = useRef(null)
  const cmtMirrorRef = useRef(null)
  const attachFileRef = useRef(null)
  const autoGrow = (el) => { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px` }
  const openFile = async (fileObj, i, isDoc) => {
    const name = fileObj.name
    // ໄຟລ໌ເອກະສານເຊັນ: ໄຟລ໌ຈິງທີ່ອັບໂຫລດ → ສະແດງເນື້ອໃນຈິງ / ບໍ່ມີ (doc ຕົວຢ່າງ) → mockup ພ້ອມລາຍເຊັນ+watermark
    if (isDoc) {
      if (fileObj.file) {
        // ໄຟລ໌ຈິງ → PDF ຈິງ + watermark + Sign Field ຂອງ ຜู้เซ็นทุกคน (creator เห็นหมด: ເຊັนแล้ว→ลายเซ็น / pending→box)
        // sigType: ຄົນທີ່ມີໃບຮັບຮອງ LANIT (DIRECTORY.hasSig) → ເຊັນ digital ໂຊ stamp / ຄົນອື່ນ → ລາຍເຊັນຂຽນ
        const signers = d.signers.map((s) => ({
          id: s.id, name: nameOf(s.id), hasSig: s.status === 'signed', time: s.time,
          sigType: s.sigType || (DIRECTORY.find((p) => p.id === s.id)?.hasSig ? 'lanit' : 'img'),
        }))
        const signed = d.signers.filter((s) => s.status === 'signed' && s.time)
        const footerDate = signed.length ? signed[signed.length - 1].time : d.date
        // E2/E13: ไฟล์ที่เซ็นแบบต้นฉบับ (print→เซ็นมือ→สแกน) ไม่มี watermark เพราะเป็นไฟล์เซ็นจริงอยู่แล้ว
        setPreview({ name, file: fileObj.file, fileId: fileObj.id, srcUrl: fileObj.srcUrl, watermark: d.status !== 'done' && !fileObj.original, placements: d.placements || [], signers, footerDate, docId: d.id })
        return
      }
      setPreview({ name, mockup: true, mockDoc: d, mockFile: fileObj }); return
    }
    // ໄຟລ໌ແນບ: ຮູບ → placeholder / ໄຟລ໌ຈິງ → ເນື້ອໃນຈິງ / ອື່ນໆ → ຕົວຢ່າງ
    const isImg = /\.(jpe?g|png|webp|gif|bmp|heic)$/i.test(name)
    if (fileObj.file) { setPreview({ name, file: fileObj.file }); return }
    if (isImg) { setPreview({ name, imagePlaceholder: true }); return }
    const url = SAMPLE_PDFS[i % SAMPLE_PDFS.length]
    try {
      const blob = await (await fetch(url)).blob()
      setPreview({ name, file: new File([blob], /\.pdf$/i.test(name) ? name : `${name}.pdf`, { type: 'application/pdf' }) })
    } catch { setPreview({ name, url }) }
  }

  if (!d) return null
  const { done, total, pct } = progress(d)
  const dsty = docTypeStyle(d) // ສີ+ໄອຄอนຕາມປະເພດເອກະສານ (E11)
  const iCreated = d.creatorId === me
  const mySig = d.signers.find((s) => actingId(s) === me) // E3/E12: ตำแหน่งที่ me ต้อง act จริง (รวมที่รับมอบหมายมา)
  const myOwnSeat = d.signers.find((s) => s.id === me) // ที่นั่งที่ me เป็นเจ้าของเดิม (ใช้ตัดสิน มอบหมาย/ดึงกลับ)
  const myTurn = isMyTurn(d, me)
  // E3/E12: เอกสารลับ ห้ามมอบหมายให้คนนอกสาย (ใช้กฎเดียวกับ E14 @tag) · มอบได้เฉพาะที่นั่งของตัวเอง (กันมอบซ้อน/delegate-of-delegate)
  const isConfidential = docTypeOf(d) === 'ເອກະສານລັບ'
  const canAssign = myTurn && mySig?.id === me && !isConfidential
  const canRevoke = myOwnSeat?.assignedTo && myOwnSeat.status !== 'signed' && myOwnSeat.status !== 'rejected'
  const steps = [...new Set(d.signers.map((s) => s.step))].sort((a, b) => a - b)
  const minPending = Math.min(...d.signers.filter((s) => s.status !== 'signed' && s.status !== 'rejected').map((s) => s.step), Infinity)
  const orderType = steps.length === 1 ? 'ພ້ອມກັນ' : steps.length === d.signers.length ? 'ຕາມລຳດັບ' : 'ປະສົມ'
  const rejectedBy = d.signers.find((s) => s.status === 'rejected')
  const ctime = `${d.date} · 09:00`

  const act = (m) => { setFlash(m); setTimeout(() => setFlash(''), 2200) }

  let note = null
  if (d.status === 'cancelled') note = { cls: 'rej', text: `ຄຳຂໍນີ້ຖືກຍົກເລີກໂດຍຜູ້ສ້າງ${d.cancelReason ? ` — ${d.cancelReason}` : ''}` }
  else if (mySig?.status === 'rejected') note = { cls: 'rej', text: `ທ່ານໄດ້ປະຕິເສດການລົງນາມ${mySig.reason ? ` — ${mySig.reason}` : ''} · ຄຳຂໍນີ້ຖືກລັອກ` }
  else if (rejectedBy) note = { cls: 'rej', text: `${nameOf(rejectedBy.id)} ໄດ້ປະຕິເສດ${rejectedBy.reason ? ` — ${rejectedBy.reason}` : ''} · ຄຳຂໍນີ້ຖືກລັອກ` }

  const audit = [
    { ic: Icon.doc, t: `ສ້າງເອກະສານ ໂດຍ ${nameOf(d.creatorId)}`, tm: ctime },
    { ic: Icon.send, t: 'ສົ່ງຄຳຂໍລາຍເຊັນ', tm: `${d.date} · 09:05` },
    ...d.signers.filter((s) => s.status === 'signed').map((s) => ({ ic: Icon.checkCircle, t: `${nameOf(s.id)} ເຊັນແລ້ວ`, tm: s.time || d.date, ok: true })),
    ...d.signers.filter((s) => s.status === 'rejected').map((s) => ({ ic: Icon.warn, t: `${nameOf(s.id)} ປະຕິເສດ${s.reason ? ` — ${s.reason}` : ''}`, tm: 'ຕອນນີ້', rej: true })),
    ...(d.status === 'cancelled' ? [{ ic: Icon.warn, t: `ຍົກເລີກຄຳຂໍ${d.cancelReason ? ` — ${d.cancelReason}` : ''}`, tm: 'ຕອນນີ້', rej: true }]
      : minPending !== Infinity ? [{ ic: Icon.clock, t: `ລໍຖ້າ ${d.signers.filter((s) => s.step === minPending && s.status !== 'signed').map((s) => nameOf(s.id)).join(', ')} ລົງນາມ`, tm: 'ຕອນນີ້', now: true }] : []),
  ]

  // ── comment + @mention (E14) — tag ได้ทุกคนในบริษัท ยกเว้นเอกสารลับ (จำกัดเฉพาะคนในสายเดิม กันความลับรั่ว) ──
  // ຈັດກຸ່ມຕາມພะแนก (directorySections ດฉบับดียวกับ DirectoryPicker Step1) — ตัดหมวด "ตัวเอง" ออก (แท็กตัวเองไม่มีประโยชน์)
  const mentionSections = mentionQ === null ? [] : isConfidential
    ? [{ key: 'chain', label: 'ຄົນໃນສາຍ', people: d.signers.map((s) => ({ id: s.id, name: nameOf(s.id) })).filter((p) => p.name.toLowerCase().includes(mentionQ.toLowerCase())) }].filter((sec) => sec.people.length)
    : directorySections(me, mentionQ, '').filter((sec) => sec.key !== 'me')
  // ── contenteditable helpers (@mention ຕົວໜາ+ສີຟ້า inline) ──
  const escHtml = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const buildCeHtml = (text, ids) => {
    const names = [...new Set((ids || []).map((id) => nameOf(id)))].filter(Boolean).sort((a, b) => b.length - a.length)
    let html = escHtml(text)
    names.forEach((n) => {
      const e = escHtml(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      html = html.replace(new RegExp(`@${e}`, 'g'), `<span class="cmt-mention" contenteditable="false">@${escHtml(n)}</span>`)
    })
    return html
  }
  const readCe = () => (cmtInputRef.current?.innerText || '').replace(/\n$/, '')
  const setCeHtml = (text, ids) => {
    const el = cmtInputRef.current; if (!el) return
    el.innerHTML = text ? buildCeHtml(text, ids) : ''
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false)
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); el.focus()
  }
  const onCeInput = () => { const t = readCe(); setCmt(t); const m = t.match(/@([^\s@]*)$/); setMentionQ(m ? m[1] : null) }
  const pickMention = (s) => {
    const t = readCe().replace(/@([^\s@]*)$/, `@${s.name} `)
    const ids = mentionIds.includes(s.id) ? mentionIds : [...mentionIds, s.id]
    setMentionIds(ids); setMentionQ(null); setCmt(t); setCeHtml(t, ids)
  }
  const addComment = () => {
    const t = readCe()
    if (!t.trim() && !cmtAttach) return
    const mentions = mentionIds.filter((id) => t.includes(`@${nameOf(id)}`))
    const text = cmtAttach ? `${t.trim()} 📎 ${cmtAttach.label}`.trim() : t.trim()
    onComment(d.id, text, replyTo, mentions)
    setCmt(''); setReplyTo(null); setReplyToName(''); setMentionIds([]); setMentionQ(null); setCmtAttach(null); setAttachMenu(false)
    if (cmtInputRef.current) cmtInputRef.current.innerHTML = ''
  }
  const ATTACH_OPTS = [
    { label: 'ຖ່າຍຮູບ', ic: 'camera', accept: 'image/*', capture: 'environment' },
    { label: 'ຖ່າຍວິດີໂອ', ic: 'video', accept: 'video/*', capture: 'environment' },
    { label: 'ຮູບພາບ', ic: 'image', accept: 'image/*' },
    { label: 'ວິດີໂອ', ic: 'video', accept: 'video/*' },
    { label: 'ໄຟລ໌', ic: 'file', accept: '*/*' },
  ]
  const pickAttach = (o) => {
    setAttachMenu(false)
    const inp = attachFileRef.current
    if (!inp) return
    inp.accept = o.accept
    if (o.capture) inp.setAttribute('capture', o.capture); else inp.removeAttribute('capture')
    inp.value = ''
    inp.click()
  }
  const onAttachFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const isImg = f.type.startsWith('image/')
    const isVid = f.type.startsWith('video/')
    const kind = isImg ? 'image' : isVid ? 'video' : 'file'
    const sizeKb = Math.max(1, Math.round(f.size / 1024))
    setCmtAttach({ label: f.name, ic: kind, kind, size: sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`, url: (isImg || isVid) ? URL.createObjectURL(f) : null })
    cmtInputRef.current?.focus()
  }
  // ຕອບກັບ: root → ໃສ່ parentId=root / reply → ຕໍ່ໃນ thread ເດີມ (parentId=root) ພ້ອມ @mention ຄົນນັ້ນ
  const startReply = (c) => {
    const rootId = c.parentId || c.id
    setReplyTo(rootId); setReplyToName(nameOf(c.byId))
    if (c.parentId && c.byId !== me) {
      const t = `@${nameOf(c.byId)} `; const ids = mentionIds.includes(c.byId) ? mentionIds : [...mentionIds, c.byId]
      setCmt(t); setMentionIds(ids); setTimeout(() => setCeHtml(t, ids), 0)
    } else { setTimeout(() => cmtInputRef.current?.focus(), 0) }
  }
  const cancelReply = () => { setReplyTo(null); setReplyToName(''); setCmt(''); setMentionIds([]); if (cmtInputRef.current) cmtInputRef.current.innerHTML = '' }
  const confirmReject = (rsn) => { onReject(d.id, rsn); setRejectOpen(false); setRejPopup(true) }
  const confirmCancel = (rsn) => { onCancel(d.id, rsn); setCancelOpen(false); setCancelPopup(true) }
  const doRemind = () => { onRemind(d.id); act('ສົ່ງການແຈ້ງເຕືອນຫາຜູ້ລົງນາມແລ້ວ') }
  const replyName = replyToName
  const roots = d.comments.filter((c) => !c.parentId)
  const repliesOf = (id) => d.comments.filter((c) => c.parentId === id)

  const FileRow = ({ file, sub, alt, idx }) => {
    const name = file.name
    return (
      <div className="sum-file as-row dd-fileclick" onClick={() => openFile(file, idx, !alt)}>
        <span className={`file-badge sm ${alt ? 'alt' : ''}`}>{alt ? <Icon.layers /> : <Icon.pdf />}</span>
        <div className="dd-file-meta"><b>{name}</b><span>{sub}</span></div>
        <button className="icon-mini" title="ດາວໂຫລດ" onClick={(e) => { e.stopPropagation(); act(`ດາວໂຫລດ ${name}`) }}><Icon.download /></button>
        <button className="icon-mini" title="ແບ່ງປັນ" onClick={(e) => { e.stopPropagation(); act(`ສ້າງລິ້ງແບ່ງປັນ ${name}`) }}><Icon.share /></button>
      </div>
    )
  }

  const saveEdit = (id) => { if (editText.trim()) onEditComment(d.id, id, editText.trim()); setEditId(null) }
  const Comment = ({ c, reply }) => {
    const mine = c.byId === me
    const editing = editId === c.id
    return (
      <div className={`dd-cmt ${reply ? 'reply' : ''}`}>
        <div className="dd-cmt-av" style={avBg(c.byId)}>{!avatarOf(c.byId) && initials(nameOf(c.byId))}</div>
        <div className="dd-cmt-body">
          <div className="dd-cmt-head"><b>{nameOf(c.byId)}</b><span>{c.time}{c.edited ? ' · ແກ້ໄຂແລ້ວ' : ''}</span></div>
          {editing ? (
            <div className="dd-cmt-edit">
              <input value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)} autoFocus />
              <button className="dd-cmt-esave" onClick={() => saveEdit(c.id)}>ບັນທຶກ</button>
              <button className="dd-cmt-ecancel" onClick={() => setEditId(null)}>ຍົກເລີກ</button>
            </div>
          ) : <p>{renderMentions(c.text, c.mentions)}</p>}
          {!editing && (
            <div className="dd-cmt-acts">
              <button className="dd-cmt-reply" onClick={() => startReply(c)}><Icon.reply /> ຕອບກັບ</button>
              {mine && d.status === 'progress' && (<>
                <button className="dd-cmt-reply" onClick={() => { setEditId(c.id); setEditText(c.text) }}><Icon.pen /> ແກ້ໄຂ</button>
                <button className="dd-cmt-reply del" onClick={() => onDeleteComment(d.id, c.id)}><Icon.trash /> ລຶບ</button>
              </>)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header title="ລາຍລະອຽດເອກະສານ" onBack={onBack}
        right={<button className="header-help" title="ປະຫວັດກິດຈະກຳ" onClick={() => setActOpen(true)}><Icon.info /></button>} />
      <div className="scroll">
        {/* summary — ບໍ່ມີຊື່ໄຟລ໌ */}
        <div className="card">
          <div className="dd-top">
            <span className="dd-fileicon" style={{ background: dsty.soft, color: dsty.main }}>{Icon[dsty.icon]()}<em>{d.files.length} ໄຟລ໌</em></span>
            <div className="dd-titlewrap">
              <b className="dd-title">{d.title}</b>
              <div className="dd-tags">
                <span className={`doc-status dd-badge ${d.status === 'done' ? 'ok' : d.status === 'cancelled' ? 'cancel' : d.status === 'rejected' ? 'rej' : ''}`}>
                  {d.status === 'done' ? 'ສຳເລັດແລ້ວ' : d.status === 'cancelled' ? 'ຍົກເລີກແລ້ວ' : d.status === 'rejected' ? 'ຖືກປະຕິເສດ' : 'ກຳລັງດຳເນີນການ'}
                </span>
              </div>
            </div>
          </div>
          <div className="dd-progrow"><span>ຄວາມຄືບໜ້າການລົງນາມ</span><b>{done}/{total}</b></div>
          <div className="doc-prog"><span className="doc-prog-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        {note && <div className={`dd-note ${note.cls}`}>{note.cls === 'ok' ? <Icon.checkCircle /> : <Icon.warn />} {note.text}</div>}
        {flash && <div className="dd-note ok"><Icon.checkCircle /> {flash}</div>}

        {/* creator box: ໃຜສ້າງ · ເວລາ · ຈຳນວນຜູ້ລົງນາມ/ອະນຸມັດ/CC */}
        <div className="card dd-creator-card">
          <div className="dd-creator">
            <div className="dd-creator-av" style={avBg(d.creatorId)}>{!avatarOf(d.creatorId) && initials(nameOf(d.creatorId))}</div>
            <div className="dd-creator-info">
              <span className="dd-creator-lbl">ຜູ້ສ້າງຄຳຂໍ</span>
              <b>{nameOf(d.creatorId)}</b>
            </div>
          </div>
          <div className="dd-meta-list">
            {/* E10: ປະເພດ "ອື່ນໆ" ໂຊຊື່ທີ່ຜູ້ໃຊ້ພິມເອງ ແທນຊື່ legacy */}
            <div className="dd-meta-row"><span><Icon.layers /> ປະເພດເອກະສານ</span><b style={{ color: dsty.main }}>{d.otherTypeName ? `${d.otherTypeName} (ອື່ນໆ)` : docTypeOf(d)}</b></div>
            {d.docNo && <div className="dd-meta-row"><span><Icon.doc /> ເລກທີເອກະສານ</span><b>{d.docNo}</b></div>}
            <div className="dd-meta-row"><span><Icon.clock /> ສ້າງເມື່ອ</span><b>{ctime}</b></div>
            <div className="dd-meta-row"><span><Icon.pen /> ຜູ້ລົງນາມ</span><b>{d.signers.filter((s) => s.role !== 'approver').length} ຄົນ</b></div>
            {d.signers.some((s) => s.role === 'approver') && (
              <div className="dd-meta-row"><span><Icon.checkCircle /> ຜູ້ອະນຸມັດ</span><b>{d.signers.filter((s) => s.role === 'approver').length} ຄົນ</b></div>
            )}
            {d.cc && d.cc.length > 0 && (
              <div className="dd-meta-row"><span><Icon.mail /> ຮັບສຳເນົາ (CC)</span><b>{d.cc.length} ຄົນ</b></div>
            )}
          </div>
        </div>

        {/* documents — ຄລິກໄຟລ໌ເພື່ອເປີດเบิ่ง PDF ຈິງ · download/share ລາຍໄຟລ໌ */}
        <div className="card">
          <p className="dd-section">ໄຟລ໌ເຊັນ ({d.files.length})</p>
          {d.files.map((f, i) => <FileRow key={i} file={f} sub={`${f.pages} ໜ້າ`} idx={i} />)}
          {d.attachments.length > 0 && (<>
            <p className="dd-section sub">ໄຟລ໌ແນບ ({d.attachments.length})</p>
            {d.attachments.map((a, i) => <FileRow key={i} file={a} sub="ໄຟລ໌ປະກອບ" alt idx={d.files.length + i} />)}
          </>)}
        </div>

        {/* AI summary — ຕໍ່ໄຟລ໌ (ຫຼາຍไฟล์ = ຫຼາຍສະຫຼຸບ) */}
        <div className="card ai-card">
          <SectionHead icon={<Icon.sparkle />} title="ສະຫຼຸບໂດຍ AI" right={<span className="ai-badge">AI</span>} />
          {d.files.map((f, i) => (
            <div className="ai-file" key={i}>
              {d.files.length > 1 && <p className="ai-file-name"><Icon.pdf /> {f.name}</p>}
              <p className="ai-text">{f.summary || AI_SUMMARY}</p>
            </div>
          ))}
          <p className="ai-note">ສະຫຼຸບໂດຍ AI — ອາຈມີຄວາມຜິດພາດ ຄວນອ່ານເອກະສານສະບັບເຕັມ</p>
        </div>

        {/* signers timeline — group by step (ພ້ອມກັນ = ຂັ້ນດຽວກັນ, ຕາມລຳดับ = ແຍກຂັ້ນ) */}
        <div className="card">
          <p className="dd-section">{rolesLabel(d)} · {orderType}</p>
          <div className="dd-tl">
            {[...d.signers].sort((a, b) => a.step - b.step).map((s) => {
              const active = d.status === 'progress' && s.step === minPending && s.status !== 'signed' && s.status !== 'rejected'
              const isApprover = s.role === 'approver'
              return (
                <div className={`dd-tl-row ${s.status === 'signed' ? 'ok' : ''} ${s.status === 'rejected' ? 'rej' : ''} ${active ? 'now' : ''} ${actingId(s) === me ? 'me' : ''}`} key={s.id}>
                  {/* ໂຊ avatar ຂອງຄົນນັ້ນສະເໝີ + ຕິກຖືກ ຊ້ອນມຸມ ເມື່ອເຊັນແລ້ວ (ບໍ່ແທນທີ່ avatar) */}
                  <span className="dd-tl-av" style={avBg(s.id)}>
                    {!avatarOf(s.id) && initials(nameOf(s.id))}
                    {s.status === 'signed' && <span className="dd-tl-av-check"><Icon.check /></span>}
                    {s.status === 'rejected' && <span className="dd-tl-av-check rej"><Icon.x /></span>}
                  </span>
                  <div className="dd-tl-body">
                    <div className="dd-tl-name">
                      <b>{nameOf(s.id)}</b>
                      <span className={`role-tag ${isApprover ? 'approver' : 'signer'}`}>{isApprover ? 'ອະນຸມັດ' : 'ລົງນາມ'}</span>
                    </div>
                    {/* E3/E12: ระบุการมอบหมาย ให้เห็นทั้งฝั่งเจ้าของที่นั่งและผู้รับมอบ */}
                    {s.assignedTo && s.status !== 'signed' && <span className="dd-tl-time assign">→ ມອບໝາຍໃຫ້ {nameOf(s.assignedTo)} {isApprover ? 'ອະນຸມັດ' : 'ເຊັນ'}ແທນ</span>}
                    {/* E2/E13: ລະບຸວິທີເຊັນ — ຕົ້ນສະບັບ (ພິມ→ເຊັນມື→ສະແກນ) ຕ້ອງແຍກອອກຈາກເຊັນ digital ໃຫ້ກວດສອບໄດ້ */}
                    {s.status === 'signed' && <span className="dd-tl-time">{s.assignedTo ? `ເຊັນແທນໂດຍ ${nameOf(s.assignedTo)} · ` : ''}ເຊັນແລ້ວ{s.sigType === 'original' ? ' (ຕົ້ນສະບັບ)' : ''} · {s.time}</span>}
                    {s.status === 'rejected' && <span className="dd-tl-time rej">ປະຕິເສດ{s.reason ? ` · ${s.reason}` : ''}</span>}
                    {active && <span className="dd-tl-time now">ຮອບນີ້ · ກຳລັງລໍຖ້າ</span>}
                  </div>
                </div>
              )
            })}
          </div>
          {/* E3/E12: มอบหมายให้คนอื่นเซ็น/อนุมัติแทน — เฉพาะที่นั่งของตัวเอง, ไม่ใช่เอกสารลับ */}
          {canAssign && (
            <button className="dd-cmt-reply" style={{ marginTop: 10 }} onClick={() => setAssignOpen(true)}>
              <Icon.swap /> ມອບໝາຍໃຫ້ຄົນອື່ນ{mySig.role === 'approver' ? 'ອະນຸມັດ' : 'ເຊັນ'}ແທນ
            </button>
          )}
          {canRevoke && (
            <button className="dd-cmt-reply del" style={{ marginTop: 6 }} onClick={() => onRevokeAssign(d.id, myOwnSeat.id)}>
              <Icon.x /> ດຶງການມອບໝາຍຄືນຈາກ {nameOf(myOwnSeat.assignedTo)}
            </button>
          )}
        </div>

        {/* CC — ຮັບສຳເນົາ */}
        {d.cc && d.cc.length > 0 && (
          <div className="card">
            <p className="dd-section">ຮັບສຳເນົາ (CC) ({d.cc.length})</p>
            {d.cc.map((cid) => (
              <div className="signer-item cc-item" key={cid}>
                <div className="signer-avatar cc" style={avBg(cid)}>{!avatarOf(cid) && initials(nameOf(cid))}</div>
                <div className="signer-info"><b>{nameOf(cid)}</b><span className="signer-email">ຮັບສຳເນົາ · ບໍ່ຕ້ອງເຊັນ</span></div>
                <span className="role-tag cc">CC</span>
              </div>
            ))}
          </div>
        )}

        {/* comments (+ reply + @mention) */}
        <div className="card">
          <p className="dd-section">ຄວາມຄິດເຫັນ ({d.comments.length})</p>
          <div className="dd-cmts">
            {roots.length === 0 && <p className="empty-list sm">ຍັງບໍ່ມີຄວາມຄິດເຫັນ</p>}
            {roots.map((c) => (
              <div key={c.id}>
                <Comment c={c} />
                {repliesOf(c.id).map((r) => <Comment key={r.id} c={r} reply />)}
              </div>
            ))}
          </div>
          {d.status === 'progress' ? (<>
            {replyTo && <div className="dd-replybar"><span><Icon.reply /> ຕອບກັບ {replyName}</span><button onClick={cancelReply}><Icon.x /></button></div>}
            <div className="dd-cmt-wrap">
              {mentionSections.length > 0 && (
                <div className="mention-pop">
                  <p className="mention-title"><Icon.at /> ກ່າວເຖິງ (@)</p>
                  {mentionSections.map((sec) => (
                    <div key={sec.key}>
                      <p className="mention-sec-head">{sec.label}</p>
                      {sec.people.map((s) => (
                        <button key={s.id} className="mention-opt" onClick={() => pickMention(s)}>
                          <span className="mention-av" style={avBg(s.id)}>{!avatarOf(s.id) && initials(s.name)}</span>{s.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {attachMenu && (
                <div className="cmt-attach-menu">
                  {ATTACH_OPTS.map((o, i) => (
                    <button key={i} className="cmt-attach-opt" onClick={() => pickAttach(o)}>
                      <span className="cmt-attach-ic">{Icon[o.ic]()}</span>{o.label}
                    </button>
                  ))}
                </div>
              )}
              <input type="file" ref={attachFileRef} hidden onChange={onAttachFile} />
              {cmtAttach && (
                <div className="cmt-preview">
                  <button className="cmt-preview-x" onClick={() => setCmtAttach(null)}><Icon.x /></button>
                  {cmtAttach.kind === 'image' ? (
                    <img className="cmt-preview-media" src={cmtAttach.url} alt={cmtAttach.label} />
                  ) : cmtAttach.kind === 'video' ? (
                    <video className="cmt-preview-media" src={cmtAttach.url} controls playsInline />
                  ) : (
                    <div className="cmt-preview-fileic"><Icon.pdf /></div>
                  )}
                  <div className="cmt-preview-meta">
                    <span className="cmt-preview-badge">{cmtAttach.kind === 'image' ? 'ຮູບ' : cmtAttach.kind === 'video' ? 'ວິດີໂອ' : 'ໄຟລ໌'}</span>
                    <span className="cmt-preview-name">{cmtAttach.label}</span>
                    {cmtAttach.size && <span className="cmt-preview-size">{cmtAttach.size}</span>}
                  </div>
                </div>
              )}
              <div className="dd-cmt-input">
                <button className={`cmt-attach-btn ${attachMenu ? 'on' : ''}`} onClick={() => setAttachMenu((o) => !o)} title="ແນບ"><Icon.clip /></button>
                <div ref={cmtInputRef} className="cmt-ce" contentEditable suppressContentEditableWarning
                  data-ph={replyTo ? `ຕອບກັບ ${replyName}...` : 'ຄວາມຄິດເຫັນ... (@ ກ່າວເຖິງ)'}
                  onInput={onCeInput}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }} />
                <button className="dd-cmt-send" onClick={addComment}><Icon.send /></button>
              </div>
            </div>
          </>) : (
            <p className="dd-cmt-locked"><Icon.checkCircle /> {d.status === 'done' ? 'ຄຳຂໍນີ້ສຳເລັດແລ້ວ' : d.status === 'rejected' ? 'ຄຳຂໍນີ້ຖືກປະຕິເສດ' : 'ຄຳຂໍນີ້ຖືກຍົກເລີກ'} · ບໍ່ສາມາດເພີ່ມຄວາມຄິດເຫັນໄດ້</p>
          )}
        </div>
      </div>

      {/* context action */}
      <div className="footer">
        {d.status === 'cancelled' || d.status === 'rejected' ? (
          <button className="btn ghost" style={{ flex: 1 }} onClick={onBack}>ກັບໜ້າຫຼັກ</button>
        ) : d.status === 'done' ? (<>
          <button className="btn ghost" onClick={() => act('ສ້າງລິ້ງແບ່ງປັນທັງໝົດ')}><Icon.share /> ແບ່ງປັນທັງໝົດ</button>
          <button className="btn primary" onClick={() => act('ດາວໂຫລດເອກະສານທັງໝົດ')}><Icon.download /> ດາວໂຫລດທັງໝົດ</button>
        </>) : myTurn ? (<>
          <button className="btn danger" onClick={() => (iCreated ? setCancelOpen(true) : setRejectOpen(true))}><Icon.x /> {iCreated ? 'ຍົກເລີກຄຳຂໍ' : 'ປະຕິເສດ'}</button>
          {/* ຜູ້ອະນຸມັດ ບໍ່ມີຊ່ອງເຊັນ → ອະນຸມັດກົງ ບໍ່ຜ່ານໜ້າວາງລາຍເຊັນ (ບໍ່ດັ່ງນັ້ນຕິດ loop 0/0 ຊ່ອງ) */}
          {mySig?.role === 'approver'
            ? <button className="btn primary" onClick={() => setApproveOpen(true)}><Icon.check /> ອະນຸມັດ</button>
            : <button className="btn primary" onClick={() => onSign(d.id)}><Icon.pen /> ລົງນາມ</button>}
        </>) : iCreated ? (<>
          <button className="btn danger" onClick={() => setCancelOpen(true)}><Icon.x /> ຍົກເລີກຄຳຂໍ</button>
          <button className="btn primary" onClick={doRemind}><Icon.send /> ເຕືອນຜູ້ລົງນາມ</button>
        </>) : mySig?.status === 'signed' ? (<>
          <button className="btn ghost" onClick={() => act('ສ້າງລິ້ງແບ່ງປັນທັງໝົດ')}><Icon.share /> ແບ່ງປັນທັງໝົດ</button>
          <button className="btn primary" onClick={() => act('ດາວໂຫລດເອກະສານທັງໝົດ')}><Icon.download /> ດາວໂຫລດທັງໝົດ</button>
        </>) : mySig?.status === 'rejected' ? (
          <button className="btn ghost" style={{ flex: 1 }} onClick={onBack}>ກັບໜ້າຫຼັກ</button>
        ) : mySig ? (
          <button className="btn ghost" style={{ flex: 1 }} disabled>ລໍຖ້າຄິວກ່ອນໜ້າ</button>
        ) : (<>
          <button className="btn ghost" onClick={() => act('ສ້າງລິ້ງແບ່ງປັນທັງໝົດ')}><Icon.share /> ແບ່ງປັນທັງໝົດ</button>
          <button className="btn primary" onClick={() => act('ດາວໂຫລດເອກະສານທັງໝົດ')}><Icon.download /> ດາວໂຫລດທັງໝົດ</button>
        </>)}
      </div>

      {/* activity modal (i) */}
      {actOpen && (
        <div className="modal-overlay" onClick={() => setActOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b><Icon.info /> ປະຫວັດກິດຈະກຳ</b><button className="icon-mini" onClick={() => setActOpen(false)}><Icon.x /></button></div>
            <div className="dd-audit" style={{ padding: '16px 18px 22px' }}>
              {audit.map((a, i) => (
                <div className={`aud ${a.ok ? 'ok' : ''} ${a.now ? 'now' : ''} ${a.rej ? 'rej' : ''}`} key={i}>
                  <span className="aud-ic">{a.ic()}</span>
                  <div className="aud-body"><span className="aud-t">{a.t}</span><span className="aud-tm">{a.tm}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ອະນຸມັດ (approver) — ຢືນຢັນແລ້ວອະນຸມັດເລີຍ ບໍ່ຜ່ານໜ້າວາງລາຍເຊັນ */}
      {approveOpen && (
        <div className="modal-overlay dim" onClick={() => setApproveOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b><Icon.check /> ຢືນຢັນອະນຸມັດ</b><button className="icon-mini" onClick={() => setApproveOpen(false)}><Icon.x /></button></div>
            <p className="dd-approve-note">ອະນຸມັດ "{d.title}" — ລະບົບຈະບັນທຶກ, ແຈ້ງຜູ້ສ້າງ ແລະ ສົ່ງຕໍ່ໃຫ້ຄິວຖັດໄປ</p>
            <div className="success-btns" style={{ maxWidth: 'none', padding: '0 16px 18px' }}>
              <button className="btn ghost" onClick={() => setApproveOpen(false)}>ຍັງກ່ອນ</button>
              <button className="btn primary" onClick={() => { setApproveOpen(false); setApprovePopup(true) }}><Icon.check /> ຢືນຢັນອະນຸມັດ</button>
            </div>
          </div>
        </div>
      )}
      {approvePopup && (
        <ResultPopup title="ອະນຸມັດສຳເລັດ!" desc="ລະບົບໄດ້ບັນທຶກ ແລະ ແຈ້ງເຕືອນຜູ້ກ່ຽວຂ້ອງແລ້ວ"
          onOk={() => { setApprovePopup(false); onApprove && onApprove(d.id) }} />
      )}

      {/* ປະຕິເສດ — ໃສ່ເຫດຜົນ (ໃຊ້ ReasonModal ຮ່ວມກັບທຸກທີ່) */}
      {rejectOpen && (
        <ReasonModal title="ປະຕິເສດການລົງນາມ" hint="ກະລຸນາລະບຸເຫດຜົນ (ຜູ້ສ້າງຈະໄດ້ຮັບການແຈ້ງເຕືອນ)"
          placeholder="ເຫດຜົນທີ່ປະຕິເສດ..." confirmLabel="ຢືນຢັນປະຕິເສດ"
          onConfirm={confirmReject} onClose={() => setRejectOpen(false)} />
      )}

      {/* ຜົນລັບ: ປະຕິເສດ / ຍົກເລີກ — popup ດຽວກັນທຸກທີ່ */}
      {rejPopup && <ResultPopup danger title="ໄດ້ປະຕິເສດຄຳຂໍແລ້ວ" desc="ລະບົບໄດ້ແຈ້ງເຕືອນຜູ້ສ້າງແລ້ວ" onOk={() => { setRejPopup(false); onBack() }} />}
      {cancelPopup && <ResultPopup danger title="ໄດ້ຍົກເລີກຄຳຂໍແລ້ວ" desc="ລະບົບໄດ້ແຈ້ງເຕືອນຜູ້ລົງນາມທຸກຄົນແລ້ວ" onOk={() => { setCancelPopup(false); onBack() }} />}

      {/* ຍົກເລີກຄຳຂໍ — ໃສ່ເຫດຜົນ (ໃຊ້ ReasonModal ອັນດຽວກັນ) */}
      {cancelOpen && (
        <ReasonModal title="ຍົກເລີກຄຳຂໍ" hint="ຜູ້ລົງນາມທຸກຄົນຈະໄດ້ຮັບການແຈ້ງເຕືອນ ແລະ ຈະບໍ່ສາມາດລົງນາມໄດ້ອີກ — ກະລຸນາລະບຸເຫດຜົນ"
          placeholder="ເຫດຜົນທີ່ຍົກເລີກ..." confirmLabel="ຢືນຢັນຍົກເລີກ" cancelLabel="ບໍ່ຍົກເລີກ"
          onConfirm={confirmCancel} onClose={() => setCancelOpen(false)} />
      )}

      <FilePreviewModal file={preview} onClose={() => setPreview(null)} />

      {/* E3/E12: เลือกคนรับมอบหมาย — จัดกลุ่มตามแผนก (directorySections ตัวเดียวกับ @mention/DirectoryPicker) */}
      {assignOpen && (
        <div className="modal-overlay" onClick={() => { setAssignOpen(false); setAssignQ('') }}>
          <div className="modal-sheet tall" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b><Icon.swap /> ມອບໝາຍໃຫ້ຄົນອື່ນ{mySig?.role === 'approver' ? 'ອະນຸມັດ' : 'ເຊັນ'}ແທນ</b>
              <button className="icon-mini" onClick={() => { setAssignOpen(false); setAssignQ('') }}><Icon.x /></button></div>
            <div style={{ padding: '0 14px 14px' }}>
              <div className="home-search"><Icon.search /><input value={assignQ} onChange={(e) => setAssignQ(e.target.value)} placeholder="ຄົ້ນຫາຊື່..." autoFocus /></div>
            </div>
            <div style={{ padding: '0 8px 16px', maxHeight: '55vh', overflowY: 'auto' }}>
              {directorySections(me, assignQ, '').filter((sec) => sec.key !== 'me').map((sec) => (
                <div key={sec.key}>
                  <p className="mention-sec-head">{sec.label}</p>
                  {sec.people.map((p) => (
                    <button key={p.id} className="mention-opt" onClick={() => { onAssign(d.id, myOwnSeat.id, p.id); setAssignOpen(false); setAssignQ(''); act(`ມອບໝາຍໃຫ້ ${p.name} ແລ້ວ`) }}>
                      <span className="mention-av" style={avBg(p.id)}>{!avatarOf(p.id) && initials(p.name)}</span>{p.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
