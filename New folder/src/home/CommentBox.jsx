import { useState, useRef } from 'react'
import { Icon, initials, directorySections } from '../flow/shared.jsx'
import { nameOf, colorOf, avatarOf } from './data.js'

const avBg = (id) => { const u = avatarOf(id); return u ? { backgroundImage: `url("${u}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: colorOf(id) } }

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

const ATTACH_OPTS = [
  { label: 'ຖ່າຍຮູບ', ic: 'camera', accept: 'image/*', capture: 'environment' },
  { label: 'ຖ່າຍວິດີໂອ', ic: 'video', accept: 'video/*', capture: 'environment' },
  { label: 'ຮູບພາບ', ic: 'image', accept: 'image/*' },
  { label: 'ວິດີໂອ', ic: 'video', accept: 'video/*' },
  { label: 'ໄຟລ໌', ic: 'file', accept: '*/*' },
]

// ── ກ່ອງຄວາມຄິດເຫັນ ໃຊ້ຮ່ວມ: ຂໍລາຍເຊັນ · ລາພັກ · ວຽກນອກ · ໂອທີ ──
// ຄົບ: ຕອບກັບ · ແກ້ໄຂ · ລຶບ · @mention · ແນບຮູບ/ວິດີໂອ/ໄຟລ໌ (ຜູ້ຖືກ @ ໄດ້ຮັບແຈ້ງເຕືອນ)
// people = ລາຍชื่อจำกัด (ใช้ตอนอยากปิดกั้น เช่น เอกสารลับ) · useFullDirectory = true → mention ได้ทุกคนในบริษัท (E14) จัดกลุ่มตามแผนก
export default function CommentBox({ comments = [], me, people = [], useFullDirectory, locked, lockedMsg, onAdd, onEdit, onDelete }) {
  const [cmt, setCmt] = useState('')
  const [mentionIds, setMentionIds] = useState([])
  const [mentionQ, setMentionQ] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [replyName, setReplyName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [attachMenu, setAttachMenu] = useState(false)
  const [attach, setAttach] = useState(null)
  const ceRef = useRef(null)
  const fileRef = useRef(null)

  const roots = comments.filter((c) => !c.parentId)
  const repliesOf = (id) => comments.filter((c) => c.parentId === id)
  // useFullDirectory → ຈัดกลุ่มตามแผนก (directorySections ตัวเดียวกับ DirectoryPicker/DocDetail) · ไม่ใช่ → flat list ตาม people ที่ส่งมา
  const mentionSections = mentionQ === null ? [] : useFullDirectory
    ? directorySections(me, mentionQ, '').filter((sec) => sec.key !== 'me')
    : [{ key: 'p', label: '', people: people.filter((p) => p.name.toLowerCase().includes(mentionQ.toLowerCase())) }].filter((sec) => sec.people.length)

  // ── contenteditable: @mention ເປັນ chip ຕົວໜາ+ສີຟ້າ inline ──
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
  const readCe = () => (ceRef.current?.innerText || '').replace(/\n$/, '')
  const setCeHtml = (text, ids) => {
    const el = ceRef.current; if (!el) return
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
  const add = () => {
    const t = readCe()
    if (!t.trim() && !attach) return
    const mentions = mentionIds.filter((id) => t.includes(`@${nameOf(id)}`))
    onAdd(attach ? `${t.trim()} 📎 ${attach.label}`.trim() : t.trim(), replyTo, mentions)
    setCmt(''); setReplyTo(null); setReplyName(''); setMentionIds([]); setMentionQ(null); setAttach(null); setAttachMenu(false)
    if (ceRef.current) ceRef.current.innerHTML = ''
  }
  const pickAttach = (o) => {
    setAttachMenu(false)
    const inp = fileRef.current; if (!inp) return
    inp.accept = o.accept
    if (o.capture) inp.setAttribute('capture', o.capture); else inp.removeAttribute('capture')
    inp.value = ''; inp.click()
  }
  const onAttachFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const isImg = f.type.startsWith('image/'); const isVid = f.type.startsWith('video/')
    const kb = Math.max(1, Math.round(f.size / 1024))
    setAttach({ label: f.name, kind: isImg ? 'image' : isVid ? 'video' : 'file', size: kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`, url: (isImg || isVid) ? URL.createObjectURL(f) : null })
    ceRef.current?.focus()
  }
  // ຕອບກັບ: reply ໃນ thread ເດີມ + @ ຄົນນັ້ນໃຫ້ອັດຕະໂນມັດ
  const startReply = (c) => {
    setReplyTo(c.parentId || c.id); setReplyName(nameOf(c.byId))
    if (c.byId !== me) {
      const t = `@${nameOf(c.byId)} `; const ids = mentionIds.includes(c.byId) ? mentionIds : [...mentionIds, c.byId]
      setCmt(t); setMentionIds(ids); setTimeout(() => setCeHtml(t, ids), 0)
    } else setTimeout(() => ceRef.current?.focus(), 0)
  }
  const cancelReply = () => { setReplyTo(null); setReplyName(''); setCmt(''); setMentionIds([]); if (ceRef.current) ceRef.current.innerHTML = '' }
  const saveEdit = (id) => { if (editText.trim()) onEdit(id, editText.trim()); setEditId(null) }

  const Comment = ({ c, reply }) => (
    <div className={`dd-cmt ${reply ? 'reply' : ''}`}>
      <div className="dd-cmt-av" style={avBg(c.byId)}>{!avatarOf(c.byId) && initials(nameOf(c.byId))}</div>
      <div className="dd-cmt-body">
        <div className="dd-cmt-head"><b>{nameOf(c.byId)}</b><span>{c.time}{c.edited ? ' · ແກ້ໄຂແລ້ວ' : ''}</span></div>
        {editId === c.id ? (
          <div className="dd-cmt-edit">
            <input value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)} autoFocus />
            <button className="dd-cmt-esave" onClick={() => saveEdit(c.id)}>ບັນທຶກ</button>
            <button className="dd-cmt-ecancel" onClick={() => setEditId(null)}>ຍົກເລີກ</button>
          </div>
        ) : <p>{renderMentions(c.text, c.mentions)}</p>}
        {editId !== c.id && !locked && (
          <div className="dd-cmt-acts">
            <button className="dd-cmt-reply" onClick={() => startReply(c)}><Icon.reply /> ຕອບກັບ</button>
            {c.byId === me && (<>
              <button className="dd-cmt-reply" onClick={() => { setEditId(c.id); setEditText(c.text) }}><Icon.pen /> ແກ້ໄຂ</button>
              <button className="dd-cmt-reply del" onClick={() => onDelete(c.id)}><Icon.trash /> ລຶບ</button>
            </>)}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="card">
      <p className="dd-section">ຄວາມຄິດເຫັນ ({comments.length})</p>
      <div className="dd-cmts">
        {roots.length === 0 && <p className="empty-list sm">ຍັງບໍ່ມີຄວາມຄິດເຫັນ</p>}
        {roots.map((c) => (
          <div key={c.id}>
            <Comment c={c} />
            {repliesOf(c.id).map((r) => <Comment key={r.id} c={r} reply />)}
          </div>
        ))}
      </div>
      {locked ? (
        <p className="dd-cmt-locked"><Icon.checkCircle /> {lockedMsg} · ບໍ່ສາມາດເພີ່ມຄວາມຄິດເຫັນໄດ້</p>
      ) : (<>
        {replyTo && <div className="dd-replybar"><span><Icon.reply /> ຕອບກັບ {replyName}</span><button onClick={cancelReply}><Icon.x /></button></div>}
        <div className="dd-cmt-wrap">
          {mentionSections.length > 0 && (
            <div className="mention-pop">
              <p className="mention-title"><Icon.at /> ກ່າວເຖິງ (@)</p>
              {mentionSections.map((sec) => (
                <div key={sec.key}>
                  {sec.label && <p className="mention-sec-head">{sec.label}</p>}
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
          <input type="file" ref={fileRef} hidden onChange={onAttachFile} />
          {attach && (
            <div className="cmt-preview">
              <button className="cmt-preview-x" onClick={() => setAttach(null)}><Icon.x /></button>
              {attach.kind === 'image' ? <img className="cmt-preview-media" src={attach.url} alt={attach.label} />
                : attach.kind === 'video' ? <video className="cmt-preview-media" src={attach.url} controls playsInline />
                  : <div className="cmt-preview-fileic"><Icon.pdf /></div>}
              <div className="cmt-preview-meta">
                <span className="cmt-preview-badge">{attach.kind === 'image' ? 'ຮູບ' : attach.kind === 'video' ? 'ວິດີໂອ' : 'ໄຟລ໌'}</span>
                <span className="cmt-preview-name">{attach.label}</span>
                {attach.size && <span className="cmt-preview-size">{attach.size}</span>}
              </div>
            </div>
          )}
          <div className="dd-cmt-input">
            <button className={`cmt-attach-btn ${attachMenu ? 'on' : ''}`} onClick={() => setAttachMenu((o) => !o)} title="ແນບ"><Icon.clip /></button>
            <div ref={ceRef} className="cmt-ce" contentEditable suppressContentEditableWarning
              data-ph={replyTo ? `ຕອບກັບ ${replyName}...` : 'ຄວາມຄິດເຫັນ... (@ ກ່າວເຖິງ)'}
              onInput={onCeInput}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add() } }} />
            <button className="dd-cmt-send" onClick={add}><Icon.send /></button>
          </div>
        </div>
      </>)}
    </div>
  )
}
