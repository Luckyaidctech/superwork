import { useState, useEffect } from 'react'
import { Icon, initials, Header, ResultPopup, ReasonModal, ScreenPortal, DIRECTORY } from '../flow/shared.jsx'
import RequestScreen, { REQ_KINDS, KIND_META, ReqCard, RequestDetailBody } from './RequestScreen.jsx'
import KnowledgeScreen, { KnowledgeDetailBody } from './KnowledgeScreen.jsx'
import FilePreviewModal from '../flow/FilePreviewModal.jsx'
import { USERS, nameOf, colorOf, progress, isMyTurn, actingId, isInvolved, avatarOf, rolesLabel, sortPendingFirst, currentApprover, DOC_TYPES, docTypeOf, docTypeStyle, DOC_TYPE_STYLE, visibleDocs } from './data.js'
import PointsRequest from './PointsRequest.jsx'
import CommentBox from './CommentBox.jsx'

// avatar style: ຮູບໂປຣไฟล์ (ຖ້າມີ) ຫຼື ສີພື້ນ
const avBg = (id) => { const u = avatarOf(id); return u ? { backgroundImage: `url("${u}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: colorOf(id) } }

// ─────────── avatar ───────────
function Av({ id, done, rej }) {
  const url = avatarOf(id)
  return (
    <span className="doc-av" style={avBg(id)}>
      {!url && initials(nameOf(id))}
      {done && <span className="doc-av-check"><Icon.check /></span>}
    </span>
  )
}

// ─────────── document card ───────────
function DocCard({ d, me, onOpen }) {
  const { done, total, pct } = progress(d)
  const sty = docTypeStyle(d) // ສີ+ໄອຄอนຕາມປະເພດເອກະສານ (E11)
  const myTurn = isMyTurn(d, me)
  const rejected = d.signers.some((s) => s.status === 'rejected')
  // Lucky ສັ່ງປ່ຽນ 17/07: ຍกเลิก ribbon "ຮอบขອງท่าน" ลอยมุมการ์ด → ใช้ badge สถานะปกติ "ລໍຖ້າດຳເນີນการ" (Pending) แทนทุกใบที่ progress
  const st = d.status === 'done'
    ? { t: 'ສຳເລັດແລ້ວ', c: 'done' }
    : d.status === 'cancelled'
      ? { t: 'ຍົກເລີກແລ້ວ', c: 'cancel' }
      : rejected ? { t: 'ຖືກປະຕິເສດ', c: 'rej' } : { t: 'ລໍຖ້າດຳເນີນການ', c: 'wait' }
  return (
    <button className={`doc-card ${myTurn ? 'myturn' : ''}`} style={{ borderLeft: `4px solid ${sty.main}`, background: sty.soft }} onClick={() => onOpen(d.id)}>
      <div className="doc-card-top">
        <span className="doc-card-icon" style={{ background: sty.main, color: '#fff' }}>{Icon[sty.icon]()}</span>
        <b className="doc-card-title">{d.title}</b>
        <span className={`doc-status ${st.c}`}>{st.t}</span>
      </div>
      {d.docNo && <span className="doc-no">{d.docNo}</span>}
      <p className="doc-meta">ສ້າງໂດຍ: {nameOf(d.creatorId)} · {d.date}</p>
      <div className="doc-chips">
        <span className="doc-chip type" style={{ background: '#fff', color: sty.main }}>{docTypeOf(d)}</span>
        <span className="doc-chip"><Icon.doc /> {d.files.length} ໄຟລ໌</span>
        {d.attachments.length > 0 && <span className="doc-chip alt"><Icon.layers /> ໄຟລ໌ແນບ {d.attachments.length}</span>}
        {d.creatorId !== me && !d.signers.some((s) => isInvolved(s, me)) && (d.cc || []).includes(me) && <span className="doc-chip cc"><Icon.users /> CC</span>}
        {/* E3/E12: ຂໍ້ມູນມອບໝາຍ — ຊື່ເຕັມ + ສີຕາມການ໌ດ (Lucky 19/07) */}
        {(() => {
          const out = d.signers.find((s) => s.id === me && s.assignedTo)
          if (out) return <span className="doc-chip chip-wrap" style={{ color: sty.main, background: '#fff' }}><Icon.swap /> ມອບໃຫ້ {nameOf(out.assignedTo)}</span>
          const inn = d.signers.find((s) => s.assignedTo === me)
          if (inn) return <span className="doc-chip chip-wrap" style={{ color: sty.main, background: '#fff' }}><Icon.swap /> ຮັບມອບຈາກ {nameOf(inn.id)}</span>
          return null
        })()}
      </div>
      <p className="doc-prog-label">ດຳເນີນການແລ້ວ {done}/{total}</p>
      <div className="doc-prog"><span className="doc-prog-fill" style={{ width: `${pct}%` }} /></div>
      <div className="doc-signers">
        {/* ນັບແຍກ role → ຕົວເລກກົງກັບຈຳນວນຊ່ອງເຊັນໃນເອກະສານ (ຜູ້ອະນຸມັດບໍ່ມີຊ່ອງ) */}
        <span className="doc-signers-lbl"><Icon.users /> {rolesLabel(d)}</span>
        <div className="doc-avs">
          {d.signers.map((s, i) => <Av key={i} id={s.id} done={s.status === 'signed'} rej={s.status === 'rejected'} />)}
        </div>
        <span className="doc-pct">{pct}%</span>
      </div>
      {rejected && d.status !== 'done' && (() => {
        const rj = d.signers.find((s) => s.status === 'rejected')
        return <div className="doc-you rej"><span className="doc-you-txt"><b>{nameOf(rj.id)}</b>: {rj.reason || 'ໄດ້ປະຕິເສດການລົງນາມ'}</span></div>
      })()}
      {d.status === 'progress' && !rejected && d.signers.some((s) => actingId(s) === me && s.status === 'signed') &&
        <div className="doc-note-min"><Icon.clock /> ທ່ານໄດ້ເຊັນແລ້ວ · ລໍຖ້າຜູ້ອື່ນລົງນາມ</div>}
    </button>
  )
}

// ─────────── reusable dropdown ───────────
const CATS = [{ key: 'all', label: 'ທຸກສະຖານະ' }, { key: 'progress', label: 'ກຳລັງດຳເນີນການ' }, { key: 'done', label: 'ສຳເລັດແລ້ວ' }, { key: 'rejected', label: 'ຖືກປະຕິເສດ' }, { key: 'cancelled', label: 'ຍົກເລີກແລ້ວ' }]
// tab 1 "ຕ້ອງການລາຍເຊັນຂ້ອຍ" ທຸກໃບ = pending ຢູ່ແລ້ວສະເໝີ → ບໍ່ຕ້ອງກອງສະຖານະ, ກອງບົດບາດຂອງຂ້ອຍແທນ (ເຊັນ ຫຼື ອະນຸມັດ)
const ROLE_OPTS = [{ key: 'all', label: 'ທັງໝົດ' }, { key: 'signer', label: 'ຕ້ອງເຊັນ' }, { key: 'approver', label: 'ຕ້ອງອະນຸມັດ' }]
const CREATORS = [{ key: 'all', label: 'ຜູ້ສ້າງທັງໝົດ' }, { key: 'mine', label: 'ຂ້ອຍສ້າງ' }, { key: 'others', label: 'ຄົນອື່ນສ້າງ' }]
const TIMES = [{ key: 'all', label: 'ທຸກໄລຍະເວລາ' }, { key: '7d', label: '7 ວັນທີ່ຜ່ານມາ' }, { key: '30d', label: '30 ວັນທີ່ຜ່ານມາ' }, { key: 'custom', label: 'ກຳນົດຊ່ວງເອງ' }]
const parseDMY = (s) => { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d) }
const SORTS_SENT = [{ key: 'recent', label: 'ສົ່ງລ່າສຸດກ່ອນ' }, { key: 'oldest', label: 'ສົ່ງເກົ່າສຸດກ່ອນ' }, { key: 'az', label: 'ຊື່ເອກະສານ A-Z' }, { key: 'za', label: 'ຊື່ເອກະສານ Z-A' }]
const SORTS_SIGNED = [{ key: 'recent', label: 'ເຊັນລ່າສຸດກ່ອນ' }, { key: 'oldest', label: 'ເຊັນເກົ່າສຸດກ່ອນ' }, { key: 'az', label: 'ຊື່ເອກະສານ A-Z' }, { key: 'za', label: 'ຊື່ເອກະສານ Z-A' }]

function FilterDropdown({ btnLabel, title, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fdrop">
      <button className="home-filter" onClick={() => setOpen(true)}>{btnLabel} <Icon.chevron /></button>
      {open && (
        <div className="fsheet-overlay" onClick={() => setOpen(false)}>
          <div className="fsheet" onClick={(e) => e.stopPropagation()}>
            {title && <p className="fsheet-title">{title}</p>}
            {options.map((o) => (
              <button key={o.key} className={`sort-opt ${value === o.key ? 'on' : ''}`} onClick={() => { onChange(o.key); setOpen(false) }}>
                {o.label}{value === o.key && <Icon.check />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────── time dropdown (มีช่วงวันที่ในตัว popup) ───────────
function TimeDropdown({ value, onChange, range, setRange }) {
  const [open, setOpen] = useState(false)
  const label = value === 'custom' && (range.from || range.to)
    ? `${range.from || '...'} → ${range.to || '...'}`
    : TIMES.find((t) => t.key === value).label
  return (
    <div className="fdrop">
      <button className="home-filter" onClick={() => setOpen(true)}>{label} <Icon.chevron /></button>
      {open && (
        <div className="fsheet-overlay" onClick={() => setOpen(false)}>
          <div className="fsheet" onClick={(e) => e.stopPropagation()}>
            <p className="fsheet-title">ໄລຍະເວລາ</p>
            {TIMES.map((o) => (
              <button key={o.key} className={`sort-opt ${value === o.key ? 'on' : ''}`} onClick={() => { onChange(o.key); if (o.key !== 'custom') setOpen(false) }}>
                {o.label}{value === o.key && <Icon.check />}
              </button>
            ))}
            {value === 'custom' && (
              <div className="date-range-pop">
                <label><span>ວັນທີເລີ່ມ</span><input type="date" value={range.from} max={range.to || undefined} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} /></label>
                <label><span>ວັນທີສິ້ນສຸດ</span><input type="date" value={range.to} min={range.from || undefined} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} /></label>
                <div className="date-range-btns">
                  <button className="drp-clear" onClick={() => setRange({ from: '', to: '' })}>ລ້າງ</button>
                  <button className="drp-apply" onClick={() => setOpen(false)}>ນຳໃຊ້</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────── list view ───────────
// filter 4 tab ຕ້ອງຄືກັນໝົດ ຕາມລຳດັບ: ປະເພດເອກະສານ → ສະຖານະ → ຜູ້ສ້າງ → ໄລຍະເວລາ → ຈັດລຳດັບ
// ຕ່າງກັນຈຸດດຽວ: tab ປະຫວັດທັງໝົດ ບໍ່ມີ "ກຳລັງດຳເນີນການ" (Lucky ສັ່ງ 17/07)
// filter ປະເພດເອກະສານ — ໃຊ້ທຸກ tab ຂອງໂມດູນ Sign (ຫົວໜ້າ/Lucky ສັ່ງ 17/07)
const DTYPES = [{ key: 'all', label: 'ທຸກປະເພດ' }, ...DOC_TYPES.map((t) => ({ key: t, label: t }))]
function DocList({ docs, me, onOpen, empty, creatorMode, mode = 'cc' }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [role, setRole] = useState('all') // ສະເພາະ tab tosign: ບົດບາດຂອງຂ້ອຍໃນໃບນັ້ນ
  const [dir, setDir] = useState('all') // ສະເພາະ tab history: ທິດທາງມອບໝາຍ (Lucky 19/07)
  const [dtype, setDtype] = useState('all') // ປະເພດເອກະສານ
  const [who, setWho] = useState('all')
  const [time, setTime] = useState('all')
  const [range, setRange] = useState({ from: '', to: '' })
  const [sort, setSort] = useState('recent')
  const [sortOpen, setSortOpen] = useState(false)
  const SORTS = mode === 'history' ? SORTS_SIGNED : SORTS_SENT
  const isTosign = mode === 'tosign'
  const STATUS_OPTS = mode === 'history' ? CATS.filter((c) => c.key !== 'progress') : CATS
  const REF = new Date().getDate() // ໄລຍະເວລາ ນັບຈາກມື້ນີ້ຈິງ (realtime)

  let list = docs.filter((d) => {
    // ຄົ້ນຫາໄດ້ທັງ ຊື່ເອກະສານ ແລະ ຊື່ຜູ້ສ້າງ (ທຸກ tab)
    if (q) {
      const s = q.trim().toLowerCase()
      if (!d.title.toLowerCase().includes(s) && !nameOf(d.creatorId).toLowerCase().includes(s)
        && !(d.docNo || '').toLowerCase().includes(s)) return false
    }
    if (dtype !== 'all' && docTypeOf(d) !== dtype) return false
    if (isTosign) { if (role !== 'all' && d.signers.find((s) => s.id === me)?.role !== role) return false }
    else if (cat !== 'all' && d.status !== cat) return false
    // tab history: ກອງທິດທາງມອບໝາຍ (Lucky 19/07 — ປະຫວັດການມອບໝາຍຕ້ອງຊອກເຫັນຈາກ tab ນີ້ໄດ້)
    if (mode === 'history' && dir !== 'all') {
      if (dir === 'out' && !d.signers.some((s) => s.id === me && s.assignedTo)) return false
      if (dir === 'in' && !d.signers.some((s) => s.assignedTo === me)) return false
    }
    if (who === 'mine' && d.creatorId !== me) return false
    if (who === 'others' && d.creatorId === me) return false
    if (time === '7d' && REF - d.ts > 7) return false
    if (time === '30d' && REF - d.ts > 30) return false
    if (time === 'custom') {
      const dt = parseDMY(d.date)
      if (range.from && dt < new Date(range.from)) return false
      if (range.to && dt > new Date(range.to)) return false
    }
    return true
  })
  list = [...list].sort((a, b) => {
    // ຄ່າເລີ່ມຕົ້ນ recent = ສ້າງໃໝ່ສຸດ ຂຶ້ນກ່ອນ (Lucky ສັ່ງ 17/07 — tab 1 ບໍ່ຈັດຄິວກ່ອນແລ້ວ)
    if (sort === 'recent') return b.ts - a.ts
    if (sort === 'oldest') return a.ts - b.ts
    if (sort === 'az') return a.title.localeCompare(b.title, 'lo')
    return b.title.localeCompare(a.title, 'lo')
  })
  const catLabel = (STATUS_OPTS.find((c) => c.key === cat) || STATUS_OPTS[0]).label
  const roleLabel = ROLE_OPTS.find((r) => r.key === role).label
  const timeLabel = TIMES.find((t) => t.key === time).label

  return (
    <>
      <div className="home-search"><Icon.search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ຄົ້ນຫາເອກະສານ, ເລກທີ ຫຼື ຊື່ຜູ້ສ້າງ..." /></div>
      {/* ລຳດັບ filter ຄືກັນທຸກ tab: ປະເພດ → ສະຖານະ → ຜູ້ສ້າງ → ໄລຍະເວລາ → ຈັດລຳດັບ */}
      <div className="home-filters">
        <FilterDropdown btnLabel={dtype === 'all' ? 'ທຸກປະເພດ' : dtype} title="ປະເພດເອກະສານ" options={DTYPES} value={dtype} onChange={setDtype} />
        {isTosign
          ? <FilterDropdown btnLabel={`${roleLabel} (${list.length})`} title="ບົດບາດຂອງທ່ານ" options={ROLE_OPTS} value={role} onChange={setRole} />
          : <FilterDropdown btnLabel={`${catLabel} (${list.length})`} title="ສະຖານະ" options={STATUS_OPTS} value={cat} onChange={setCat} />}
        {/* history ມີກອງທິດທາງມອບໝາຍເພີ່ມ (Lucky 19/07) — tab ອື່ນຄົງ 5 ຕົວເດີມ */}
        {mode === 'history' && (
          <FilterDropdown btnLabel={ASSIGN_FILTERS.find((f) => f.key === dir).label} title="ທິດທາງມອບໝາຍ" options={ASSIGN_FILTERS} value={dir} onChange={setDir} />
        )}
        <FilterDropdown btnLabel={CREATORS.find((c) => c.key === who).label} title="ຜູ້ສ້າງ" options={CREATORS} value={who} onChange={setWho} />
        <TimeDropdown value={time} onChange={setTime} range={range} setRange={setRange} />
        <div className="sort-wrap">
          <button className="home-filter" onClick={() => setSortOpen(true)}><Icon.sort /> {SORTS.find((s) => s.key === sort).label}</button>
          {sortOpen && (
            <div className="fsheet-overlay" onClick={() => setSortOpen(false)}>
              <div className="fsheet" onClick={(e) => e.stopPropagation()}>
                <p className="fsheet-title">ຈັດລຳດັບຕາມ</p>
                {SORTS.map((s) => (
                  <button key={s.key} className={`sort-opt ${sort === s.key ? 'on' : ''}`} onClick={() => { setSort(s.key); setSortOpen(false) }}>
                    {s.label}{sort === s.key && <Icon.check />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {list.length === 0 ? <p className="empty-list">{empty || 'ບໍ່ພົບເອກະສານ'}</p> : list.map((d) => <DocCard key={d.id} d={d} me={me} onOpen={onOpen} />)}
    </>
  )
}

// ─────────── overview ───────────
function Donut({ pct }) {
  const r = 52, c = 2 * Math.PI * r, len = (c * pct) / 100
  return (
    <svg viewBox="0 0 140 140" width="128" height="128">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#d97706" strokeWidth="17" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="#16a34a" strokeWidth="17" strokeDasharray={`${len} ${c - len}`} strokeLinecap="round" transform="rotate(-90 70 70)" />
      <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="800" fill="#1a2233">{pct}%</text>
      <text x="70" y="86" textAnchor="middle" fontSize="10" fill="#8b93a7">ລົງນາມແລ້ວ</text>
    </svg>
  )
}

const PERIODS = [{ key: 'week', label: 'ອາທິດນີ້' }, { key: 'month', label: 'ເດືອນນີ້' }, { key: 'all', label: 'ທັງໝົດ' }]
// ຖານ trend 3 ເດືອນກ່ອນ (mock) — ເດືອນປັດຈຸບັນຄິດจาก docs ຈິງ
const TREND_BASE = [{ m: 'ເມສາ', total: 6, done: 5 }, { m: 'ພຶດສະພາ', total: 9, done: 7 }, { m: 'ມິຖຸນາ', total: 8, done: 7 }]

function PeriodDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fdrop ov-period">
      <button className="home-filter" onClick={() => setOpen((o) => !o)}>{PERIODS.find((p) => p.key === value).label} <Icon.chevron /></button>
      {open && (<>
        <div className="sort-backdrop" onClick={() => setOpen(false)} />
        <div className="sort-pop">
          {PERIODS.map((p) => (
            <button key={p.key} className={`sort-opt ${value === p.key ? 'on' : ''}`} onClick={() => { onChange(p.key); setOpen(false) }}>
              {p.label}{value === p.key && <Icon.check />}
            </button>
          ))}
        </div>
      </>)}
    </div>
  )
}

function Overview({ docs, me, onOpen }) {
  const [period, setPeriod] = useState('all')
  const [drill, setDrill] = useState(null) // { title, list }
  const REF = new Date().getDate() // realtime — ນັບໄລຍະເວລາຈາກມື້ນີ້ຈິງ
  const inPeriod = (d) => (period === 'all' ? true : period === 'week' ? REF - d.ts <= 7 : REF - d.ts <= 30)
  // E3/E12: นับ "เกี่ยวข้อง" แบบกว้าง (isInvolved) — ทั้งเจ้าของที่นั่งเดิม + ผู้รับมอบหมาย
  const scoped = docs.filter((d) => (d.creatorId === me || d.signers.some((s) => isInvolved(s, me)) || (d.cc || []).includes(me)) && inPeriod(d))

  // ── ຕາມແຫຼ່ງ (source) ──
  const created = scoped.filter((d) => d.creatorId === me)
  const received = scoped.filter((d) => d.creatorId !== me && d.signers.some((s) => isInvolved(s, me)))
  const ccMe = scoped.filter((d) => d.creatorId !== me && !d.signers.some((s) => isInvolved(s, me)) && (d.cc || []).includes(me))
  // ── ຕາມການກະທຳ ──
  const waitMe = scoped.filter((d) => isMyTurn(d, me))
  const waitOthers = scoped.filter((d) => d.creatorId === me && d.status === 'progress')
  // "ຂ້ອຍລົງນາມແລ້ວ" = me act ຈິງ (actingId) — ບໍ່ໃຊ້ isInvolved ເພາະຖ້າมอบไปให้คนอื่นเซ็น ไม่ถือว่า "ฉันเซ็น"
  const signedMe = scoped.filter((d) => d.signers.some((s) => actingId(s) === me && s.status === 'signed'))
  // ── ຕາມສະຖານະ ──
  const progressList = scoped.filter((d) => d.status === 'progress')
  const doneList = scoped.filter((d) => d.status === 'done')
  const rejectedList = scoped.filter((d) => d.status === 'rejected' || d.signers.some((s) => s.status === 'rejected'))
  const cancelledList = scoped.filter((d) => d.status === 'cancelled')
  let sg = 0, tot = 0
  scoped.forEach((d) => d.signers.forEach((s) => { tot++; if (s.status === 'signed') sg++ }))
  const pct = tot ? Math.round((sg / tot) * 100) : 0

  const stats = [
    { n: scoped.length, label: 'ເອກະສານທັງໝົດ', icon: Icon.doc, c: '#1f3fb5', bg: '#eaeefb', list: scoped },
    { n: created.length, label: 'ຂ້ອຍສ້າງ', icon: Icon.pen, c: '#7c3aed', bg: '#efe9fe', list: created },
    { n: received.length, label: 'ຮັບຈາກຄົນອື່ນ', icon: Icon.mail, c: '#0891b2', bg: '#e0f5fa', list: received },
    { n: waitMe.length, label: 'ລໍຖ້າຂ້ອຍລົງນາມ', icon: Icon.clock, c: '#d97706', bg: '#fdf0dd', list: waitMe },
    { n: signedMe.length, label: 'ຂ້ອຍລົງນາມແລ້ວ', icon: Icon.checkCircle, c: '#16a34a', bg: '#e7f6ec', list: signedMe },
    { n: doneList.length, label: 'ສຳເລັດແລ້ວ', icon: Icon.checkCircle, c: '#059669', bg: '#dcfce7', list: doneList },
  ]
  const srcMax = Math.max(created.length, received.length, ccMe.length, 1)
  const srcRows = [
    { label: 'ຂ້ອຍສ້າງ', n: created.length, c: '#7c3aed', list: created },
    { label: 'ຮັບຈາກຄົນອື່ນ (ຜູ້ເຊັນ)', n: received.length, c: '#0891b2', list: received },
    { label: 'ໄດ້ຮັບສຳເນົາ (CC)', n: ccMe.length, c: '#64748b', list: ccMe },
  ]
  const statusRows = [
    { label: 'ກຳລັງດຳເນີນການ', n: progressList.length, c: '#2563eb', list: progressList },
    { label: 'ສຳເລັດແລ້ວ', n: doneList.length, c: '#16a34a', list: doneList },
    { label: 'ຖືກປະຕິເສດ', n: rejectedList.length, c: '#dc2626', list: rejectedList },
    { label: 'ຍົກເລີກ', n: cancelledList.length, c: '#94a3b8', list: cancelledList },
  ]
  const statusMax = Math.max(...statusRows.map((r) => r.n), 1)
  const trend = [...TREND_BASE, { m: 'ກໍລະກົດ', total: scoped.length, done: scoped.filter((d) => d.status === 'done').length }]
  const maxT = Math.max(...trend.map((t) => t.total), 1)
  const urgent = waitMe.slice(0, 3)

  return (
    <>
      <div className="ov-head"><h2 className="ov-title">e-Signature</h2><PeriodDropdown value={period} onChange={setPeriod} /></div>

      <div className="ov-stats">
        {stats.map((s, i) => (
          <button className="ov-stat" key={i} onClick={() => setDrill({ title: s.label, list: s.list })}>
            <span className="ov-stat-icon" style={{ background: s.bg, color: s.c }}>{s.icon()}</span>
            <b className="ov-stat-n">{s.n}</b><span className="ov-stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <b className="ov-donut-title">ຕາມແຫຼ່ງເອກະສານ</b>
        <div className="ov-brk">
          {srcRows.map((r, i) => (
            <button className="ov-brk-row" key={i} onClick={() => setDrill({ title: r.label, list: r.list })}>
              <span className="ov-brk-label">{r.label}</span>
              <span className="ov-brk-track"><span className="ov-brk-fill" style={{ width: `${(r.n / srcMax) * 100}%`, background: r.c }} /></span>
              <b className="ov-brk-n" style={{ color: r.c }}>{r.n}</b>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <b className="ov-donut-title">ຕາມສະຖານະ</b>
        <div className="ov-brk">
          {statusRows.map((r, i) => (
            <button className="ov-brk-row" key={i} onClick={() => setDrill({ title: r.label, list: r.list })}>
              <span className="ov-brk-label">{r.label}</span>
              <span className="ov-brk-track"><span className="ov-brk-fill" style={{ width: `${(r.n / statusMax) * 100}%`, background: r.c }} /></span>
              <b className="ov-brk-n" style={{ color: r.c }}>{r.n}</b>
            </button>
          ))}
        </div>
      </div>

      <div className="card ov-donut-card">
        <b className="ov-donut-title">ຄວາມຄືບໜ້າການລົງນາມ</b>
        <div className="ov-donut-row">
          <Donut pct={pct} />
          <div className="ov-legend">
            <button className="ov-leg" onClick={() => setDrill({ title: 'ລົງນາມແລ້ວ', list: signedMe })}><span className="ov-dot" style={{ background: '#16a34a' }} /> ລົງນາມແລ້ວ <b>{sg}</b></button>
            <button className="ov-leg" onClick={() => setDrill({ title: 'ຍັງລໍຖ້າ', list: scoped.filter((d) => d.status === 'progress') })}><span className="ov-dot" style={{ background: '#d97706' }} /> ຍັງບໍ່ລົງນາມ <b>{tot - sg}</b></button>
          </div>
        </div>
      </div>

      <div className="card">
        <b className="ov-donut-title">ສະຖິຕິການອະນຸມັດ</b>
        <div className="ov-bars">
          {trend.map((t, i) => (
            <div className="ov-bar-col" key={i}>
              <div className="ov-bar-track">
                <div className="ov-bar total" style={{ height: `${(t.total / maxT) * 100}%` }}><em>{t.total}</em></div>
                <div className="ov-bar done" style={{ height: `${(t.done / maxT) * 100}%` }} />
              </div>
              <span className="ov-bar-label">{t.m}</span>
            </div>
          ))}
        </div>
        <div className="ov-bar-legend">
          <span><i style={{ background: '#1f3fb5' }} /> ຄຳຂໍທັງໝົດ</span>
          <span><i style={{ background: '#16a34a' }} /> ສຳເລັດ</span>
        </div>
      </div>

      <div className="card">
        <b className="ov-donut-title">ເອກະສານຮີບດ່ວນ</b>
        {urgent.length === 0
          ? <p className="empty-list sm">ບໍ່ມີເອກະສານທີ່ລໍຖ້າທ່ານ</p>
          : urgent.map((d) => {
            const usty = docTypeStyle(d)
            return (
              <div className="ov-urgent" key={d.id}>
                <span className="ov-urgent-ic" style={{ background: usty.main, color: '#fff' }}>{Icon[usty.icon]()}</span>
                <div className="ov-urgent-body"><b>{d.title}</b><span className="ov-urgent-time">{REF - d.ts <= 0 ? 'ມື້ນີ້' : `${REF - d.ts} ວັນກ່ອນ`}</span></div>
                <button className="ov-urgent-go" onClick={() => onOpen(d.id)}>ໄປເຊັນ</button>
              </div>
            )
          })}
      </div>

      {drill && (
        <ScreenPortal>
        <div className="modal-overlay" onClick={() => setDrill(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b>{drill.title} ({drill.list.length})</b><button className="icon-mini" onClick={() => setDrill(null)}><Icon.x /></button></div>
            <div className="modal-list">
              {drill.list.length === 0
                ? <p className="empty-list sm">ບໍ່ມີເອກະສານ</p>
                : drill.list.map((d) => {
                  const dsty = docTypeStyle(d)
                  return (
                    <button className="drill-row" key={d.id} onClick={() => { setDrill(null); onOpen(d.id) }}>
                      <span className="drill-ic" style={{ background: dsty.main, color: '#fff' }}>{Icon[dsty.icon]()}</span>
                      <div className="drill-info"><b>{d.title}</b><span>{d.docNo ? `${d.docNo} · ` : ''}ສ້າງໂດຍ {nameOf(d.creatorId)} · {d.date}</span></div>
                      <span className={`doc-status ${d.status === 'done' ? 'done' : d.status === 'rejected' ? 'rej' : ''}`}>{d.status === 'done' ? 'ສຳເລັດ' : d.status === 'rejected' ? 'ປະຕິເສດ' : 'ດຳເນີນການ'}</span>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
        </ScreenPortal>
      )}
    </>
  )
}

// ─────────── Approval Center (bottom tab ອະນຸມັດ) — ລວມ request ທຸກປະເພດຈາກ Superwork · ຂໍລາຍເຊັນ ຢູ່ທຳອິດ ───────────
// icon ຕ້ອງກົງກັບ ໂມດູນ "ຄຳຂໍ" (REQ_KINDS) ແລະ ສື່ຄວາມໝາຍຖືກ:
// ລາພັກ = ຄັນຮົ່ມ (ບໍ່ແມ່ນຮູບຄົນ) · ວຽກນອກ = ກະເປົາ · ຈອງ = ປະຕິທິນຕິກ (ບໍ່ແມ່ນປຶ້ມ) · ຄວາມຮູ້ = ຫຼອດໄຟ (ບໍ່ແມ່ນເອກະສານ)
const AC_CATS = [
  { key: 'all', label: 'ທັງໝົດ', icon: Icon.layers },
  { key: 'esign', label: 'ຂໍລາຍເຊັນ', icon: Icon.pen },
  { key: 'ot', label: 'ໂອທີ', icon: Icon.clock },
  { key: 'leave', label: 'ລາພັກ', icon: Icon.umbrella },
  { key: 'offsite', label: 'ວຽກນອກສະຖານທີ', icon: Icon.briefcase },
  { key: 'booking', label: 'ການຈອງ', icon: Icon.calCheck },
  { key: 'knowledge', label: 'ຄວາມຮູ້', icon: Icon.bulb },
  { key: 'points', label: 'ຄະແນນ', icon: Icon.chart },
]
const AC_ICON = { esign: Icon.pen, ot: Icon.clock, leave: Icon.umbrella, offsite: Icon.briefcase, booking: Icon.calCheck, knowledge: Icon.bulb, points: Icon.chart }
const AC_LABEL = { esign: 'ຂໍລາຍເຊັນ', ot: 'ໂອທີ', leave: 'ລາພັກ', offsite: 'ວຽກນອກສະຖານທີ', booking: 'ການຈອງ', knowledge: 'ຄວາມຮູ້', points: 'ຄະແນນ' }
// ສີປະຈຳປະເພດ approval ໃສ່ທີ່ "ການ໌ດ" (ຂອບຊ້າຍ+ພື້ນອ່ອນ) — ຜອ./Lucky 19/07: ເບິ່ງການ໌ດແວບດຽວຮູ້ປະເພດ · tab ເທິງຄົງເດີມ
// [main, soft] — main ຊຸດດຽວກັບ .req-card-ic ໃນ styles.css (ຫ້າມໃຫ້ 2 ບ່ອນນີ້ຄົນລະສີ)
const AC_CARD_COLOR = { ot: ['#7c3aed', '#efe9fe'], leave: ['#8b5e3c', '#f3ece6'], offsite: ['#0891b2', '#e0f5fa'], booking: ['#0d9488', '#d9f2ef'], knowledge: ['#d97706', '#fdf0dd'], points: ['#16a34a', '#e7f6ec'] }
// ຂໍ້ມູນຄຳຂໍ (leave/offsite/ot/booking/knowledge) ຢູ່ໃນ App.jsx (initialReqs) → ສົ່ງລົງມາທາງ props
// ເພື່ອໃຫ້ ໂມດູນ "ຄຳຂໍ" ແລະ "ການອະນຸມັດ" ເຫັນຂໍ້ມູນຊຸດດຽວກັນ
// ໃຊ້ class badge ດຽວກັບການ໌ດຄຳຂໍ (.req-badge) → ທຸກການ໌ດໃນ tab "ທັງໝົດ" ໜ້າຕາເທົ່າກັນ
const AC_STATUS = { approved: { t: 'ອະນຸມັດແລ້ວ', c: 'done' }, progress: { t: 'ລໍຖ້າອະນຸມັດ', c: 'wait' }, rejected: { t: 'ປະຕິເສດ', c: 'rej' }, cancelled: { t: 'ຍົກເລີກ', c: 'cancel' }, draft: { t: 'ຮ່າງ', c: 'cancel' } }
const AC_SF = [{ key: 'all', label: 'ທັງໝົດ' }, { key: 'waiting', label: 'ລໍຖ້າອະນຸມັດ' }, { key: 'approved', label: 'ອະນຸມັດແລ້ວ' }, { key: 'rejected', label: 'ປະຕິເສດ' }]

function ApprovalCenter({ docs, me, onOpen, pointsReqs = [], director, onPointsComment, onPointsEditComment, onPointsDeleteComment, onPointsAction, reqs = {}, onReqAction, onCancelReq, onReqComment, onReqEditComment, onReqDeleteComment, openReqId, onConsumeOpen, openReq, onConsumeOpenReq }) {
  const [cat, setCat] = useState('all')
  const [sf, setSf] = useState('all')
  const [acDetail, setAcDetail] = useState(null) // request detail (mock ຫຼື points req)
  const [acFlash, setAcFlash] = useState('')
  const [acPopup, setAcPopup] = useState(null) // { msg, ok } dark success popup
  const [acPreview, setAcPreview] = useState(null) // ໄຟລ໌ແນບ ທີ່ກຳລັງເປີດເບິ່ງ
  const [rejMode, setRejMode] = useState(false)
  const [cancelMode, setCancelMode] = useState(false)
  const acAct = (m) => { setAcDetail(null); setRejMode(false); setAcFlash(m); setTimeout(() => setAcFlash(''), 2200) }
  // เปิด detail ของ req ที่เพิ่งสร้าง (หลังกด "ເບิ่งรายละเอียด")
  useEffect(() => {
    if (!openReqId) return
    const r = pointsReqs.find((p) => p.id === openReqId)
    if (r) { setCat('points'); setAcDetail({ kind: 'points', id: r.id, title: `+${r.points} · ${r.targetName}`, by: nameOf(r.by), date: r.date, status: r.status, note: r.projectName, req: r }) }
    onConsumeOpen && onConsumeOpen()
  }, [openReqId])
  // ເປີດຈາກແຈ້ງເຕືອນ (ຜູ້ອະນຸມັດ) → ໄປ tab ຂອງໝວດນັ້ນ + ເປີດ detail ໃຫ້ເລີຍ
  useEffect(() => {
    if (!openReq) return
    if (openReq.kind === 'points') {
      const r = pointsReqs.find((p) => p.id === openReq.id)
      if (r) { setCat('points'); setAcDetail({ kind: 'points', id: r.id, title: `+${r.points} · ${r.targetName}`, by: nameOf(r.by), date: r.date, status: r.status, note: r.projectName, req: r }) }
    } else {
      const r = (reqs[openReq.kind] || []).find((x) => x.id === openReq.id)
      if (r) { setCat(openReq.kind); setAcDetail({ kind: openReq.kind, ...r, by: nameOf(r.byId) }) }
    }
    onConsumeOpenReq && onConsumeOpenReq()
  }, [openReq])
  const detailReq = acDetail?.req ? pointsReqs.find((p) => p.id === acDetail.req.id) : null // live points req
  // request ຂໍລາຍເຊັນ: ລໍຖ້າ me (esign) + ທີ່ me ເຊັນແລ້ວ (approved) + ທີ່ me ປະຕິເສດ (rejected) → ຢູ່ຄົบทุก tab (E3/E12: actingId รองรับ delegation)
  const esignItems = docs
    .filter((d) => d.signers.some((s) => actingId(s) === me) && (isMyTurn(d, me) || d.signers.some((s) => actingId(s) === me && (s.status === 'signed' || s.status === 'rejected'))))
    .map((d) => {
      const mine = d.signers.find((s) => actingId(s) === me)
      const status = mine.status === 'signed' ? 'approved' : mine.status === 'rejected' ? 'rejected' : 'esign'
      // recvFrom: ໃບນີ້ຖືກມອບໝາຍມາໃຫ້ me ເຮັດແທນ — ການ໌ດຕ້ອງບອກ (Lucky 19/07: ເບິ່ງນອກບໍ່ຮູ້ວ່າແມ່ນໃບຮັບມອບ)
      return { kind: 'esign', id: d.id, title: d.title, byId: d.creatorId, by: nameOf(d.creatorId), date: d.date, status, myRole: mine.role, recvFrom: mine.assignedTo === me ? mine.id : null, docId: d.id, docNo: d.docNo, docType: docTypeOf(d), signers: d.signers }
    })
  const esignPending = esignItems.filter((i) => i.status === 'esign').length // badge = ທີ່ລໍຖ້າ me ເຊັນ
  // ⚠ ຄະແນນ: ຍັງໂຊຂອງຕົນເອງຢູ່ — ເພາະໂມດູນ "ຄຳຂໍ" ຍັງບໍ່ມີ tab ຄະແນນ ໃຫ້ມັນຢູ່
  //   ຖ້າກອງອອກຕອນນີ້ ຄຳຂໍຄະແນນຂອງຕົນເອງຈະຫາຍໄປເລີຍ (ບໍ່ມີບ່ອນເບິ່ງ)
  //   → ຕ້ອງເພີ່ມ tab ຄະແນນ ໃນໂມດູນ "ຄຳຂໍ" ກ່ອນ ຈຶ່ງກອງໄດ້
  const pointsItems = pointsReqs.map((r) => ({ kind: 'points', id: r.id, title: `+${r.points} · ${r.targetName}`, byId: r.by, by: nameOf(r.by), date: r.date, status: r.status, note: r.projectName, sub: r.target === 'task' ? 'Task' : 'Activity', proj: r.projectName, req: r }))
  // ໂມດູນ "ການອະນຸມັດ" = ຄຳຂໍຂອງ "ຄົນອື່ນ" ເທົ່ານັ້ນ (ຂອງຕົນເອງ ຢູ່ໂມດູນ "ຄຳຂໍ" — ບໍ່ຊ້ຳກັນ
  // ແລະ ຕົນເອງ ອະນຸມັດຄຳຂໍຕົນເອງບໍ່ໄດ້ຢູ່ແລ້ວ)
  //   + ໂພສຄວາມຮູ້ທີ່ຍັງເປັນ "ຮ່າງ" (draft) → ຍັງບໍ່ໄດ້ສົ່ງ ຜູ້ອະນຸມັດບໍ່ຄວນເຫັນ
  const mockItems = (k) => (reqs[k] || []).filter((m) => m.byId !== me && m.status !== 'draft').map((m) => ({ kind: k, ...m, by: nameOf(m.byId) }))
  const base = cat === 'all'
    ? [...esignItems, ...pointsItems, ...Object.keys(reqs).flatMap(mockItems)]
    : cat === 'esign' ? esignItems
      : cat === 'points' ? pointsItems
        : mockItems(cat)
  const matchSf = (m) => sf === 'all'
    || (sf === 'waiting' && (m.status === 'esign' || m.status === 'progress'))
    || (sf === 'approved' && m.status === 'approved')
    || (sf === 'rejected' && (m.status === 'rejected' || m.status === 'cancelled'))
  // ທີ່ລໍຖ້າອະນຸມັດ ຂຶ້ນກ່ອນ ແລ້ວຮຽງຕາມວັນທີ (ໃກ້ຮອດກ່ອນ) — ທຸກ tab
  const list = sortPendingFirst(base.filter(matchSf))

  // ── badge ແຕ່ລະ tab = ຈຳນວນທີ່ "ລໍຖ້າຂ້ອຍດຳເນີນການ" ຈິງ ──
  //    ຂໍລາຍເຊັນ: ຮອບຂ້ອຍເຊັນ · ຄະແນນ: ຂ້ອຍເປັນ director · ຄຳຂໍທົ່ວໄປ: ຂອງຄົນອື່ນ ທີ່ຍັງລໍຖ້າ
  const pendingOf = (k) => {
    if (k === 'esign') return esignPending
    // ຄະແນນ: ນັບຄຳຂໍທີ່ຍັງລໍຖ້າ ຂອງຄົນອື່ນ (ໃຫ້ຕົວເລກ ກົງກັບການ໌ດທີ່ໂຊໃນ tab)
    if (k === 'points') return pointsReqs.filter((r) => r.status === 'progress' && r.by !== me).length
    if (k === 'all') return AC_CATS.filter((c) => c.key !== 'all').reduce((n, c) => n + pendingOf(c.key), 0)
    // badge = ຈຳນວນທີ່ຍັງ "ລໍຖ້າອະນຸມັດ" ໃນ tab ນັ້ນ — ຕ້ອງກົງກັບການ໌ດ pending ທີ່ເຫັນໃນ list
    return (reqs[k] || []).filter((r) => r.byId !== me && r.status === 'progress').length
  }

  const Card = (m) => {
    // ຄຳຂໍທົ່ວໄປ → ໃຊ້ການ໌ດອັນດຽວກັບໂມດູນ "ຄຳຂໍ" + ສີ/ປ້າຍປະເພດ (ສະເພາະໃນ Approval — ໂມດູນ ຄຳຂໍ ຄົງເດີມ)
    if (KIND_META[m.kind]) return <ReqCard key={m.id} r={m} kind={m.kind} showBy accent={AC_CARD_COLOR[m.kind]} kindLabel={AC_LABEL[m.kind]} onOpen={() => setAcDetail(m)} />
    const isEsign = m.kind === 'esign'
    const st = isEsign
      // badge ບອກຕາມບົດບາດຈິງ: approver = ອະນຸມັດ / signer = ລົງນາມ (Take ຮັບມອບອະນຸມັດ ແຕ່ເຫັນ "ລໍຖ້າລົງນາມ" → ສັບສົນ, Lucky 19/07)
      ? (m.status === 'esign' ? { t: m.myRole === 'approver' ? 'ລໍຖ້າອະນຸມັດ' : 'ລໍຖ້າລົງນາມ', c: 'wait' } : m.status === 'approved' ? { t: m.myRole === 'approver' ? 'ອະນຸມັດແລ້ວ' : 'ເຊັນແລ້ວ', c: 'done' } : { t: 'ປະຕິເສດ', c: 'rej' })
      : AC_STATUS[m.status] || AC_STATUS.progress
    const CardIcon = AC_ICON[m.kind] || Icon.checkCircle
    // Lucky ເຄາະ 19/07: ໃນ Approval ການ໌ດ ຂໍລາຍເຊັນ = ສີນ້ຳເງິນດຽວ (ພາສາສີ = ຊະນິດ request) · ປະເພດເອກະສານບອກດ້ວຍ chip ຕົວໜັງສື
    //   ສີຕາມປະເພດເອກະສານ (E11) ໃຊ້ສະເພາະ module e-Sign — ຫ້າມເອົາ 11 ສີມາປົນໃນ Approval ອີກ
    const kc = isEsign ? ['#1f3fb5', '#e7edfb'] : AC_CARD_COLOR[m.kind]
    // ໂຄງດຽວກັບ ReqCard → badge ຢູ່ແຖວດຽວກັບຫົວຂໍ້ ທຸກການ໌ດ (ບໍ່ແມ່ນລອຍກາງ)
    return (
      <button className="req-card" key={m.id}
        style={kc ? { borderLeft: `4px solid ${kc[0]}`, background: kc[1] } : undefined}
        onClick={() => (isEsign ? onOpen(m.docId) : setAcDetail(m))}>
        <span className={`req-card-ic ${m.kind}`}><CardIcon /></span>
        <div className="req-card-body">
          <div className="req-card-top">
            <b>{m.title}</b>
            <span className={`req-badge ${st.c}`}>{st.t}</span>
          </div>
          <span className="req-card-when">
            <Icon.calendar /> {m.date}
            {m.proj && <><Icon.layers /> {m.proj}</>}
          </span>
          <div className="req-chips">
            <span className="req-chip">{AC_LABEL[m.kind]}</span>
            {/* ຂໍລາຍເຊັນ: ບອກປະເພດເອກະສານ ເທິງການ໌ດເລີຍ (Lucky 19/07) */}
            {isEsign && m.docType && <span className="req-chip" style={{ color: kc[0], background: '#fff' }}>{m.docType}</span>}
            {m.sub && <span className="req-chip hl">{m.sub}</span>}
            {/* ເລກທີ = ເທົາກາງ (Lucky ເຄາະ 19/07) */}
            {m.docNo && <span className="req-chip">{m.docNo}</span>}
            {/* ໃບທີ່ຮັບມອບມາ — ຊື່ເຕັມ ຫ້າມຕັດ + ສີຕາມການ໌ດ (Lucky 19/07) */}
            {m.recvFrom && <span className="req-chip chip-wrap" style={{ color: kc[0], background: '#fff' }}><Icon.swap /> ຮັບມອບຈາກ {nameOf(m.recvFrom)}</span>}
          </div>
          {/* ຜູ້ຂໍ (ຜູ້ສ້າງ request) — ໂຊທຸກປະເພດ ຮວມທັງ ຂໍລາຍເຊັນ (ລາຍລະອຽດຜູ້ເຊັນ ຢູ່ໜ້າ detail) */}
          {m.byId && (
            <span className="req-card-by">
              <span className="req-card-av" style={avBg(m.byId)}>{!avatarOf(m.byId) && initials(m.by)}</span>
              <b>{m.by}</b>
            </span>
          )}
        </div>
        <Icon.chevron />
      </button>
    )
  }
  return (
    <>
      {/* tab ເທິງ = ຮູບແບບເດີມ (Lucky 19/07: ສີໃສ່ທີ່ການ໌ດ ບໍ່ແມ່ນ tab) */}
      <div className="ac-cats">
        {AC_CATS.map((c) => (
          <button key={c.key} className={`ac-cat ${cat === c.key ? 'on' : ''}`} onClick={() => setCat(c.key)}>
            {c.icon()}<span>{c.label}</span>{pendingOf(c.key) > 0 && <em>{pendingOf(c.key)}</em>}
          </button>
        ))}
      </div>
      <div className="ac-sf">
        {AC_SF.map((s) => (
          <button key={s.key} className={`ac-sf-btn ${sf === s.key ? 'on' : ''}`} onClick={() => setSf(s.key)}>{s.label}</button>
        ))}
      </div>
      {list.length === 0 ? <p className="empty-list">ບໍ່ມີຄຳຂໍ</p> : list.map(Card)}
      <p className="ac-note">* ໂອທີ, ລາພັກ, ການຈອງ, ຄວາມຮູ້, ຄະແນນ = request ຈາກ Superwork (ຕົວຢ່າງ)</p>
      {acFlash && <div className="ac-flash"><Icon.checkCircle /> {acFlash}</div>}
      {acDetail && (
        <ScreenPortal>
        <div className="app ac-detail-screen">
          <Header title="ລາຍລະອຽດຄຳຂໍ" onBack={() => { setAcDetail(null); setRejMode(false) }} />
          <div className="scroll">
            <div className="ac-detail">
              {detailReq ? (() => {
                const cur = detailReq.current ?? 0, total = cur + detailReq.points
                const pctUp = cur ? Math.round((detailReq.points / cur) * 100) : 100
                return (<>
                  {/* HERO */}
                  <div className="ptd-hero">
                    <div className="ptd-hero-top"><span className="ptd-hero-label"><Icon.chart /> ຂໍເພີ່ມຄະແນນ Workboard</span></div>
                    <div className="ptd-hero-num">+{detailReq.points} <em>ຄະແນນ</em></div>
                    <div className="ptd-hero-bar"><span className="cur" style={{ width: `${(cur / (total || 1)) * 100}%` }} /><span className="add" style={{ width: `${(detailReq.points / (total || 1)) * 100}%` }} /></div>
                    <div className="ptd-hero-stats"><span>ປັດຈຸບັນ <b>{cur}</b></span><span className="up">▲ {pctUp}%</span><span>ໃໝ່ <b>{total}</b></span></div>
                  </div>
                  {/* INFO ROWS (ຂໍ້ຄວາມເຕັມ ບໍ່ຕັດ) */}
                  <div className="ptd-info">
                    <div className="ptd-info-row"><span className="ptd-info-ic blue"><Icon.chart /></span><div className="ptd-info-txt"><span>{detailReq.target === 'task' ? 'Task' : 'Activity'}</span><b>{detailReq.targetName}</b></div></div>
                    <div className="ptd-info-row"><span className="ptd-info-ic"><Icon.layers /></span><div className="ptd-info-txt"><span>ໂຄງການ (Project)</span><b>{detailReq.projectName}</b></div></div>
                    <div className="ptd-info-row"><span className="ptd-info-av" style={avBg(detailReq.by)}>{!avatarOf(detailReq.by) && initials(nameOf(detailReq.by))}</span><div className="ptd-info-txt"><span>ຜູ້ຂໍຄະແນນ</span><b>{nameOf(detailReq.by)}</b></div></div>
                    <div className="ptd-info-row"><span className="ptd-info-ic"><Icon.clock /></span><div className="ptd-info-txt"><span>ວັນທີຂໍ</span><b>{detailReq.date}</b></div></div>
                  </div>
                  {/* REASON */}
                  {detailReq.justify && <div className="ptd-reason"><span className="ptd-reason-label"><Icon.info /> ເຫດຜົນ</span><p>{detailReq.justify}</p></div>}
                  {/* TIMELINE CARD */}
                  <div className="ptd-tl-card">
                    <p className="ptd-card-label">ສະຖານະຄຳຂໍ</p>
                    <div className="ptd-timeline">
                      <div className="ptd-tl-item done"><span className="ptd-tl-dot"><Icon.check /></span><div><b>ສ້າງຄຳຂໍ</b><span>{nameOf(detailReq.by)} · {detailReq.date}</span></div></div>
                      <div className={`ptd-tl-item ${detailReq.status !== 'progress' ? 'done' : 'now'}`}><span className={`ptd-tl-dot ${detailReq.status === 'rejected' ? 'rej' : ''}`}>{detailReq.status === 'approved' ? <Icon.check /> : detailReq.status === 'rejected' ? <Icon.x /> : <Icon.clock />}</span><div><b>{detailReq.status === 'approved' ? 'ອະນຸມັດແລ້ວ' : detailReq.status === 'rejected' ? 'ຖືກປະຕິເສດ' : 'ລໍຖ້າອະນຸມັດ'}</b><span>{nameOf(director)}</span></div></div>
                    </div>
                  </div>
                </>)
              })() : (
                // ຄຳຂໍທົ່ວໄປ (ລາພັກ/ວຽກນອກ/ໂອທີ/ຈອງ/ຄວາມຮູ້) → ໃຊ້ໜ້າດຽວກັບໂມດູນ "ຄຳຂໍ" 100%
                acDetail.kind === 'knowledge' ? (
                  // ໂພສຄວາມຮູ້ → ໃຊ້ໜ້າດຽວກັບໂມດູນ "ຄວາມຮູ້" (ບໍ່ແມ່ນໜ້າຄຳຂໍລາ)
                  <KnowledgeDetailBody post={(reqs.knowledge || []).find((r) => r.id === acDetail.id) || acDetail}
                    me={me} onPreview={setAcPreview} />
                ) : (
                  <RequestDetailBody req={(reqs[acDetail.kind] || []).find((r) => r.id === acDetail.id) || acDetail}
                    kind={acDetail.kind} me={me} onPreview={setAcPreview}
                    onComment={onReqComment} onEditComment={onReqEditComment} onDeleteComment={onReqDeleteComment} />
                )
              )}

              {detailReq && (
                <div className="ptd-cmt-card">
                  <p className="ptd-card-label">ຄວາມຄິດເຫັນ ({detailReq.comments.length})</p>
                  <CommentBox
                    comments={detailReq.comments} me={me} useFullDirectory
                    locked={detailReq.status !== 'progress'}
                    lockedMsg={detailReq.status === 'approved' ? 'ຄຳຂໍນີ້ອະນຸມັດແລ້ວ' : 'ຄຳຂໍນີ້ຖືກປະຕິເສດ'}
                    onAdd={(t, parentId, mentions) => onPointsComment(detailReq.id, t, parentId, mentions)}
                    onEdit={(cid, t) => onPointsEditComment(detailReq.id, cid, t)}
                    onDelete={(cid) => onPointsDeleteComment(detailReq.id, cid)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ປຸ່ມ — ຢູ່ນອກ .scroll ຈຶ່ງລອຍຕິດລຸ່ມໄດ້ */}
          {(() => {
                const isProgress = (detailReq || acDetail).status === 'progress'
                // ຄຳຂໍຂອງຕົນເອງ → ບໍ່ມີສິດອະນຸມັດ/ປະຕິເສດ (ໂຊປຸ່ມ ຍົກເລີກ ແທນ)
                const isMine = detailReq ? detailReq.by === me : acDetail.byId === me
                // ຄຳຂໍທົ່ວໄປ: ອະນຸມັດໄດ້ສະເພາະ "ຄິວປັດຈຸບັນ" (ຫຼາຍຂັ້ນ) · ຄະແນນ: director
                const liveReq = detailReq ? null : (reqs[acDetail.kind] || []).find((x) => x.id === acDetail.id) || acDetail
                const turn = liveReq ? currentApprover(liveReq, acDetail.kind) : null
                const canAct = !isMine && isProgress && (detailReq ? me === director : turn?.id === me)
                const canCancel = isMine && isProgress
                const doApprove = () => {
                  if (detailReq) onPointsAction(detailReq.id, 'approved')
                  else onReqAction(acDetail.kind, acDetail.id, 'approved')
                  setAcPopup({ msg: 'ອະນຸມັດຄຳຂໍສຳເລັດ!' })
                }
                const doReject = (rsn) => {
                  if (detailReq) onPointsAction(detailReq.id, 'rejected', rsn)
                  else onReqAction(acDetail.kind, acDetail.id, 'rejected', rsn)
                  setRejMode(false)
                  setAcPopup({ msg: 'ໄດ້ປະຕິເສດຄຳຂໍແລ້ວ', danger: true })
                }
                const doCancel = (rsn) => { onCancelReq(acDetail.kind, acDetail.id, rsn); setCancelMode(false); setAcPopup({ msg: 'ໄດ້ຍົກເລີກຄຳຂໍແລ້ວ', danger: true }) }
                return (<>
                  {/* ປຸ່ມລອຍຕິດລຸ່ມ — ບໍ່ຕ້ອງເລື່ອນຫາ */}
                  <div className="rf-foot">
                    {canAct ? (
                      <div className="success-btns" style={{ maxWidth: 'none' }}>
                        <button className="btn danger" onClick={() => setRejMode(true)}><Icon.x /> ປະຕິເສດ</button>
                        <button className="btn primary" onClick={doApprove}><Icon.check /> ອະນຸມັດ</button>
                      </div>
                    ) : canCancel && !detailReq ? (
                      <button className="btn danger" style={{ width: '100%' }} onClick={() => setCancelMode(true)}><Icon.x /> ຍົກເລີກຄຳຂໍ</button>
                    ) : (<>
                      {!isMine && isProgress && turn && (
                        <p className="rf-turnnote"><Icon.clock /> ຮອດຮອບຂອງ {turn.name} ({turn.role})</p>
                      )}
                      <button className="btn ghost" style={{ width: '100%' }} onClick={() => setAcDetail(null)}>ປິດ</button>
                    </>)}
                  </div>
                  {rejMode && (
                    <ReasonModal title="ປະຕິເສດຄຳຂໍ" hint="ກະລຸນາລະບຸເຫດຜົນ (ຜູ້ຂໍຈະໄດ້ຮັບການແຈ້ງເຕືອນ)"
                      placeholder="ເຫດຜົນທີ່ປະຕິເສດ..." confirmLabel="ຢືນຢັນປະຕິເສດ"
                      onConfirm={doReject} onClose={() => setRejMode(false)} />
                  )}
                  {cancelMode && (
                    <ReasonModal title="ຍົກເລີກຄຳຂໍ" hint="ກະລຸນາລະບຸເຫດຜົນທີ່ຍົກເລີກ" placeholder="ເຫດຜົນ..."
                      confirmLabel="ຢືນຢັນຍົກເລີກ" cancelLabel="ບໍ່ຍົກເລີກ" onConfirm={doCancel} onClose={() => setCancelMode(false)} />
                  )}
                </>)
          })()}
          {acPreview && <FilePreviewModal file={acPreview} onClose={() => setAcPreview(null)} />}
          {/* ຜົນລັບ: ອະນຸມັດ / ປະຕິເສດ — popup ດຽວກັນທຸກທີ່ */}
          {acPopup && (
            <ResultPopup danger={!!acPopup.danger} title={acPopup.msg} desc="ລະບົບໄດ້ບັນທຶກ ແລະ ແຈ້ງເຕືອນຜູ້ກ່ຽວຂ້ອງແລ້ວ"
              onOk={() => { setAcPopup(null); setAcDetail(null); setRejMode(false) }} />
          )}
        </div>
        </ScreenPortal>
      )}
    </>
  )
}

// ─────────── notification panel ───────────
function NotiPanel({ notis, onClose, onOpen }) {
  return (
    <div className="modal-overlay noti-overlay" onClick={onClose}>
      <div className="noti-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="noti-head"><b><Icon.bell /> ການແຈ້ງເຕືອນ</b><button className="icon-mini" onClick={onClose}><Icon.x2 /></button></div>
        <div className="noti-list">
          {notis.length === 0 ? <p className="empty-list">ຍັງບໍ່ມີການແຈ້ງເຕືອນ</p> : notis.map((n) => (
            <button key={n.id} className={`noti-item ${n.read ? '' : 'unread'}`} onClick={() => { onClose(); if (n.docId) onOpen(n.docId) }}>
              <span className="noti-dot" />
              <div className="noti-body"><p>{n.text}</p><span>{n.time}</span></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────── main ───────────
// 6 tab ຫຼັກ — tab bar ເລື່ອນຊ້າຍຂວາໄດ້ (scrollable) — tab 6 = ມອບໝາຍ (E3/E12)
const TABS = [
  { key: 'tosign', label: 'ຕ້ອງການລາຍເຊັນຂ້ອຍ', icon: Icon.pen },
  { key: 'created', label: 'ລໍຖ້າຜູ້ອື່ນເຊັນ', icon: Icon.clock },
  { key: 'cc', label: 'ໄດ້ຮັບສຳເນົາ', icon: Icon.users },
  { key: 'history', label: 'ປະຫວັດທັງໝົດ', icon: Icon.doc },
  { key: 'assigned', label: 'ມອບໝາຍ', icon: Icon.swap },
  { key: 'reports', label: 'ລາຍງານ & ສະຖິຕິ', icon: Icon.chart },
]

// ─────────── noti: ໄອຄອນ · ສີ · ຫົວຂໍ້ ຕາມປະເພດ (ຄືແອັບຈິງ) ───────────
const NOTI_META = {
  sign:      { icon: Icon.pen,         cls: 'blue',   title: 'ຄຳຂໍລົງນາມ' },
  reminder:  { icon: Icon.bell,        cls: 'amber',  title: 'ເຕືອນລົງນາມ' },
  signed:    { icon: Icon.checkCircle, cls: 'green',  title: 'ມີການລົງນາມ' },
  approved:  { icon: Icon.checkCircle, cls: 'green',  title: 'ອະນຸມັດແລ້ວ' },
  done:      { icon: Icon.checkCircle, cls: 'green',  title: 'ສຳເລັດຄົບຖ້ວນ' },
  rejected:  { icon: Icon.warn,        cls: 'red',    title: 'ຖືກປະຕິເສດ' },
  cancelled: { icon: Icon.x2,          cls: 'red',    title: 'ຍົກເລີກຄຳຂໍ' },
  comment:   { icon: Icon.chat,        cls: 'violet', title: 'ຄວາມຄິດເຫັນ' },
  reply:     { icon: Icon.reply,       cls: 'violet', title: 'ຕອບກັບຄຳເຫັນ' },
  mention:   { icon: Icon.at,          cls: 'violet', title: 'ກ່າວເຖິງທ່ານ' },
  cc:        { icon: Icon.mail,        cls: 'slate',  title: 'ໄດ້ຮັບສຳເນົາ (CC)' },
  info:      { icon: Icon.bell,        cls: 'slate',  title: 'ການແຈ້ງເຕືອນ' },
}
function NotiCard({ n, onOpen, onOpenReq }) {
  const m = NOTI_META[n.kind] || NOTI_META.info
  // ແຈ້ງເຕືອນຈາກ ເອກະສານເຊັນ → ເປີດເອກະສານ · ຈາກຄຳຂໍ → ເປີດຄຳຂໍ
  const go = () => { if (n.docId) onOpen(n.docId); else if (n.req) onOpenReq(n.req) }
  return (
    <button className={`noti-card kind-${m.cls} ${n.read ? '' : 'unread'} ${n.docId || n.req ? 'tap' : ''}`} onClick={go}>
      <span className="noti-ic">{m.icon()}</span>
      <div className="noti-c">
        <b className="noti-title">{m.title}</b>
        <p className="noti-txt">{n.text}</p>
        <span className="noti-time">{n.time}</span>
      </div>
      {!n.read && <span className="noti-unread" />}
    </button>
  )
}

// ─────────── tab 6: ມອບໝາຍ (E3/E12) — มอบไปให้คนอื่น + ได้รับมอบจากคนอื่น ───────────
// ตัวกรองใช้ dropdown แบบเดียวกับ tab อื่นทั้ง module (Lucky 18/07: ห้ามทำ pattern แปลกแยก) — ทุก option ต้องมี seed รองรับ
// ຕົວກອງຄົບຊຸດຄືກັນກັບ tab ອື່ນ: ທິດທາງ → ສະຖານະ → ໄລຍະເວລາ → ຈັດລຳດັບ (Lucky 19/07)
const ASSIGN_FILTERS = [{ key: 'all', label: 'ທິດທາງທັງໝົດ' }, { key: 'out', label: 'ມອບໄປ' }, { key: 'in', label: 'ໄດ້ຮັບມອບ' }]
const ASSIGN_STATUS = [{ key: 'all', label: 'ທຸກສະຖານະ' }, { key: 'wait', label: 'ຍັງບໍ່ດຳເນີນການ' }, { key: 'done', label: 'ດຳເນີນການແລ້ວ' }, { key: 'rej', label: 'ປະຕິເສດ' }]
const ASSIGN_SORTS = [{ key: 'recent', label: 'ມອບລ່າສຸດກ່ອນ' }, { key: 'oldest', label: 'ມອບເກົ່າສຸດກ່ອນ' }, { key: 'az', label: 'ຊື່ເອກະສານ A-Z' }, { key: 'za', label: 'ຊື່ເອກະສານ Z-A' }]
const seatStatusKey = (seat) => (seat.status === 'signed' ? 'done' : seat.status === 'rejected' ? 'rej' : 'wait')
function AssignedTab({ docs, me, onOpen }) {
  const [q, setQ] = useState('') // ຄົ້ນຫາ — ຄືກັບ tab ອື່ນ (Lucky 19/07 ຕິວ່າຂາດ)
  const [filter, setFilter] = useState('all')
  const [stFilter, setStFilter] = useState('all')
  const [time, setTime] = useState('all')
  const [range, setRange] = useState({ from: '', to: '' })
  const [sort, setSort] = useState('recent')
  const REF = new Date().getDate() // ໄລຍະເວລາ ນັບຈາກມື້ນີ້ຈິງ (realtime — ຄືກັບ DocList)
  // ໃບໜຶ່ງອາດມີທັງ "ມອບໄປ" ແລະ "ໄດ້ຮັບມອບ" — ແຍກເປັນ entry ຄົນລະອັນ ໃຫ້ສະຖານະຕົງກັບທີ່ນັ່ງນັ້ນຈິງ
  const entries = []
  docs.forEach((d) => {
    d.signers.forEach((s) => {
      if (s.id === me && s.assignedTo) entries.push({ d, seat: s, dir: 'out' })
      if (s.assignedTo === me) entries.push({ d, seat: s, dir: 'in' })
    })
  })
  const inTime = (d) => {
    if (time === '7d') return REF - d.ts <= 7
    if (time === '30d') return REF - d.ts <= 30
    if (time === 'custom' && (range.from || range.to)) {
      const t = parseDMY(d.date)
      if (range.from && t < new Date(range.from)) return false
      if (range.to && t > new Date(range.to)) return false
    }
    return true
  }
  // ຄົ້ນຫາ: ຊື່ເອກະສານ + ເລກທີ + ຊື່ຄູ່ມອບໝາຍ + ຜູ້ສ້າງ
  const matchQ = (e) => {
    if (!q.trim()) return true
    const s = q.trim().toLowerCase()
    const counterpart = e.dir === 'out' ? e.seat.assignedTo : e.seat.id
    return e.d.title.toLowerCase().includes(s) || (e.d.docNo || '').toLowerCase().includes(s)
      || nameOf(counterpart).toLowerCase().includes(s) || nameOf(e.d.creatorId).toLowerCase().includes(s)
  }
  const byDir = (k) => (k === 'all' ? entries : entries.filter((e) => e.dir === k))
  const list = byDir(filter)
    .filter((e) => (stFilter === 'all' || seatStatusKey(e.seat) === stFilter) && inTime(e.d) && matchQ(e))
    .sort((a, b) => {
      if (sort === 'oldest') return a.d.ts - b.d.ts
      if (sort === 'az') return a.d.title.localeCompare(b.d.title, 'lo')
      if (sort === 'za') return b.d.title.localeCompare(a.d.title, 'lo')
      // recent (default): ຄ້າງກ່ອນ + ໃໝ່ສຸດຂຶ້ນກ່ອນ — ຄືກັບ list ອື່ນທັງແອັບ
      return ((seatStatusKey(a.seat) === 'wait' ? 0 : 1) - (seatStatusKey(b.seat) === 'wait' ? 0 : 1)) || (b.d.ts - a.d.ts)
    })
  const dirLabel = ASSIGN_FILTERS.find((f) => f.key === filter).label
  const stLabel = ASSIGN_STATUS.find((f) => f.key === stFilter).label
  const sortLabel = ASSIGN_SORTS.find((f) => f.key === sort).label
  return (
    <>
      <div className="home-search"><Icon.search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ຄົ້ນຫາເອກະສານ, ເລກທີ ຫຼື ຊື່ຄົນ..." /></div>
      <div className="home-filters">
        <FilterDropdown btnLabel={`${dirLabel} (${byDir(filter).length})`} title="ທິດທາງ" options={ASSIGN_FILTERS} value={filter} onChange={setFilter} />
        <FilterDropdown btnLabel={`${stLabel} (${list.length})`} title="ສະຖານະ" options={ASSIGN_STATUS} value={stFilter} onChange={setStFilter} />
        <TimeDropdown value={time} onChange={setTime} range={range} setRange={setRange} />
        <FilterDropdown btnLabel={sortLabel} title="ຈັດລຳດັບ" options={ASSIGN_SORTS} value={sort} onChange={setSort} />
      </div>
      {list.length === 0 ? <p className="empty-list">ບໍ່ມີການມອບໝາຍໃນເງື່ອນໄຂນີ້</p> : list.map(({ d, seat, dir }) => {
        const isOut = dir === 'out'
        const counterpart = isOut ? seat.assignedTo : seat.id
        const actLabel = seat.role === 'approver' ? 'ອະນຸມັດ' : 'ເຊັນ'
        const sty = docTypeStyle(d)
        return (
          <button className="req-card" key={`${d.id}-${dir}-${seat.id}`} style={{ borderLeft: `4px solid ${sty.main}` }} onClick={() => onOpen(d.id)}>
            <span className="req-card-ic" style={{ background: sty.main }}><Icon.swap /></span>
            <div className="req-card-body">
              <div className="req-card-top">
                <b>{d.title}</b>
                {/* ສະຖານະບອກຊັດ: ຄົນທີ່ຮັບໜ້າທີ່ ດຳເນີນການແລ້ວຫຼືຍັງ (Lucky 18/07) */}
                <span className={`req-badge ${seat.status === 'signed' ? 'done' : seat.status === 'rejected' ? 'rej' : 'wait'}`}>
                  {seat.status === 'signed' ? `${actLabel}ແລ້ວ` : seat.status === 'rejected' ? 'ປະຕິເສດແລ້ວ' : `ຍັງບໍ່ໄດ້${actLabel}`}
                </span>
              </div>
              <span className="req-card-when"><Icon.calendar /> {d.date}{d.docNo && <><Icon.doc /> {d.docNo}</>}</span>
              <div className="req-chips">
                {/* ຊື່ເຕັມ + ສີຕາມການ໌ດ (Lucky 19/07) */}
                <span className="req-chip chip-wrap" style={{ color: sty.main, background: '#fff' }}>{isOut ? `ມອບໃຫ້ ${nameOf(counterpart)}` : `ຮັບມອບຈາກ ${nameOf(counterpart)}`}</span>
                <span className="req-chip">{actLabel}ແທນ</span>
              </div>
            </div>
            <Icon.chevron />
          </button>
        )
      })}
    </>
  )
}

// ─────────── Dashboard (tab หลัก — Lucky 19/07: shell ใหม่ 4 tabs, อิง visual แอป Superwork จริง) ───────────
// tile น้ำเงินเดียว (#1f3fb5) + ไอคอนขาว + badge แดงนับงานค้าง — แบบแอปจริง แต่มีแค่ 4 module ตามสั่ง
const DASH_MODULES = [
  { key: 'approve', label: 'Approvals', icon: Icon.checkCircle },
  { key: 'sign', label: 'My e-Signature', icon: Icon.pen },
  { key: 'request', label: 'Requests', icon: Icon.reqDoc },
  { key: 'knowledge', label: 'Knowledge', icon: Icon.bulb },
]

function DashboardTab({ me, counts, onOpenModule }) {
  const totalWait = counts.approve // ລວມທຸກຢ່າງທີ່ລໍຖ້າ me ຢູ່ແລ້ວ (esign ຮອບຂ້ອຍ + ຄຳຂໍທີ່ຂ້ອຍເປັນຜູ້ອະນຸມັດ)
  return (
    <div className="dash">
      {/* hero ນ້ຳເງິນເຂັ້ມ ແບບແອບຈິງ: logo + Welcome + avatar */}
      <div className="dash-hero">
        <div className="dash-hero-top">
          <b className="dash-hero-brand">Superwork</b>
          <span className="dash-hero-av" style={avBg(me)}>{!avatarOf(me) && initials(nameOf(me))}</span>
        </div>
        <h2 className="dash-hero-welcome">Welcome to AIDC</h2>
        <p className="dash-hero-name">{nameOf(me)}</p>
      </div>
      {/* strip ງານຄ້າງ — ແບບ strip Attendance ຂອງແອບຈິງ */}
      {totalWait > 0 && (
        <button className="dash-alert" onClick={() => onOpenModule('approve')}>
          <span className="dash-alert-ic"><Icon.clock /></span>
          <div className="dash-alert-txt"><b>ລໍຖ້າທ່ານດຳເນີນການ</b><span>ມີ {totalWait} ລາຍການ ແຕະເພື່ອເປີດ Approvals</span></div>
          <Icon.chevron />
        </button>
      )}
      {/* module grid — icon tile ແບບແອບຈິງ (ແຖວດຽວ 4 ອັນ) */}
      <div className="card dash-card">
        <div className="dash-grid">
          {DASH_MODULES.map((m) => (
            <button key={m.key} className="dash-mod" onClick={() => onOpenModule(m.key)}>
              <span className="dash-mod-ic">
                {m.icon()}
                {counts[m.key] > 0 && <span className="dash-mod-badge">{counts[m.key]}</span>}
              </span>
              <span className="dash-mod-lbl">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Chat: placeholder — Lucky 19/07 "khong can lam gi" (ຍັງບໍ່ເຮັດຫຍັງ ພຽງມີ tab ໄວ້)
function ChatTab() {
  return (
    <div className="chat-empty">
      <span className="chat-empty-ic"><Icon.chat /></span>
      <b>Chat</b>
      <p>ສົນທະນາພາຍໃນທີມ — ກຳລັງພັດທະນາ</p>
    </div>
  )
}

function ProfileTab({ me, setMe, onOpenSettings }) {
  const u = USERS.find((x) => x.id === me)
  const rec = DIRECTORY.find((p) => p.id === me)
  return (
    <div className="profile-tab">
      <div className="card prof-card">
        <span className="user-opt-av xl" style={avBg(me)}>{!avatarOf(me) && initials(nameOf(me))}</span>
        <b>{nameOf(me)}</b>
        <span className="prof-role">{u?.role}</span>
        {rec?.email && <span className="prof-email"><Icon.mail /> {rec.email}</span>}
      </div>
      <div className="card prof-menu">
        <button className="prof-row" onClick={onOpenSettings}>
          <span className="prof-row-ic"><Icon.gear /></span>
          <div><b>ຕັ້ງຄ່າ</b><span>ລາຍເຊັນ · ຄວາມປອດໄພ · ສາຍອະນຸມັດ</span></div>
          <Icon.chevron />
        </button>
      </div>
      <div className="card prof-menu">
        <p className="dd-section"><Icon.swap /> ສະຫຼັບຜູ້ໃຊ້ (demo)</p>
        {USERS.map((x) => (
          <button key={x.id} className={`user-opt ${me === x.id ? 'on' : ''}`} onClick={() => setMe(x.id)}>
            <span className="user-opt-av" style={avBg(x.id)}>{!avatarOf(x.id) && initials(x.name)}</span>
            <span className="user-opt-info"><b>{x.name}</b><em>{x.role}</em></span>
            {me === x.id && <Icon.check />}
          </button>
        ))}
      </div>
    </div>
  )
}

const MODULE_NAVS = ['approve', 'sign', 'request', 'knowledge'] // module ເປີດຈາກ Dashboard — bottom nav ຄ້າງທີ່ Dashboard

export default function HomeScreen({ me, setMe, docs, notis, pointsReqs = [], director, onCreatePoints, onPointsComment, onPointsEditComment, onPointsDeleteComment, onPointsAction, reqs = {}, onReqAction, onCreateReq, onCancelReq, onReqComment, onReqEditComment, onReqDeleteComment,
  onCreateKn, onSubmitKn, onKnLike, onKnView, onMarkRead, onNew, onOpenDoc, onOpenFromNoti, onOpenSettings }) {
  const [tab, setTab] = useState('tosign')
  // shell ใหม่ (Lucky 19/07): 4 tabs หลัก chat/dash/noti/profile — module เดิม 4 ตัวเปิดจาก Dashboard
  const [nav, setNav] = useState('dash')
  const [userMenu, setUserMenu] = useState(false)
  const [fabMenu, setFabMenu] = useState(false)
  const [pointsForm, setPointsForm] = useState(false)
  const [openReqId, setOpenReqId] = useState(null) // เปิด detail ของ points req หลังสร้าง
  const [openReq, setOpenReq] = useState(null) // { kind, id } — ເປີດຄຳຂໍ ຈາກແຈ້ງເຕືອນ

  // tab 1 ຕ້ອງການລາຍເຊັນຂ້ອຍ = ທຸກເອກະສານທີ່ຍັງລໍຂ້ອຍ ເຊັນ/ອະນຸມັດ (ຈາກຄົນອື່ນ ຫຼື ຂ້ອຍສ້າງເອງກໍນັບ)
  //   ຮອດຮອບຂ້ອຍ ຂຶ້ນກ່ອນ — ເຊັນໄດ້ຈາກນີ້ ຫຼື ຈາກໂມດູນ Approval ກໍໄດ້ (2 ທາງເຂົ້າ ເອກະສານດຽວກັນ)
  // tab 2 ລໍຖ້າຜູ້ອື່ນເຊັນ = request ທີ່ຂ້ອຍສ້າງ ແລະ ຍັງບໍ່ສຳເລັດ
  // tab 3 ລົງນາມແລ້ວ = ຄົນອື່ນສ້າງ+ຂ້ອຍເຊັນແລ້ວ  ຫຼື  ຂ້ອຍສ້າງ+ເຊັນຄົບແລ້ວ (ບໍ່ແຍກຕາມຜູ້ສ້າງ)
  const toSign = docs
    .filter((d) => d.status === 'progress' && d.signers.some((s) => actingId(s) === me && s.status !== 'signed' && s.status !== 'rejected'))
    .sort((a, b) => (isMyTurn(b, me) ? 1 : 0) - (isMyTurn(a, me) ? 1 : 0))
  const created = docs.filter((d) => d.creatorId === me && d.status !== 'done')
  // tab ປະຫວັດທັງໝົດ = ໃບທີ່ຂ້ອຍກ່ຽວຂ້ອງ (ສ້າງ / ຢູ່ໃນສາຍເຊັນ / ໄດ້ CC) ທີ່ "ຈົບແລ້ວ"
  //   ໃບທີ່ຍັງຄ້າງ (progress) ບໍ່ນັບເປັນປະຫວັດ — ຢູ່ tab 1/2/3 ຢູ່ແລ້ວ (Lucky ສັ່ງ 17/07)
  const history = docs.filter((d) => d.status !== 'progress'
    && (d.creatorId === me || d.signers.some((s) => isInvolved(s, me)) || (d.cc || []).includes(me)))
  // ໄດ້ຮັບ CC = ຄົນອื่นสร้าง + ฉันไม่ได้เป็นผู้เซ็น + ฉันอยู่ใน cc
  const ccDocs = docs.filter((d) => d.creatorId !== me && !d.signers.some((s) => isInvolved(s, me)) && (d.cc || []).includes(me))
  const myNotis = notis.filter((n) => n.forId === me)
  const unread = myNotis.filter((n) => !n.read).length
  // badge tosign = ຈຳນວນທີ່ໂຊໃນ tab ຈິງ (ກົງກັບການ໌ດ — ບໍ່ນັບສະເພາະຮອບຂ້ອຍ)
  const badge = { tosign: toSign.length, created: created.filter((d) => d.status === 'progress').length }
  // badge ໂມດູນ "ຄຳຂໍ" = ຄຳຂໍ "ຂອງຂ້ອຍ" ທີ່ຍັງລໍຖ້າຜົນອະນຸມັດ
  // (ທີ່ຄົນອື່ນສົ່ງມາໃຫ້ຂ້ອຍອະນຸມັດ ຢູ່ໂມດູນ "ການອະນຸມັດ" — ບໍ່ນັບຢູ່ນີ້)
  const reqPending = REQ_KINDS.reduce((n, k) => n + (reqs[k.key] || []).filter((r) => r.byId === me && r.status === 'progress').length, 0)
  // badge ຄວາມຮູ້ = ຮ່າງ + ທີ່ຍັງລໍຖ້າກວດສອບ ຂອງຂ້ອຍ (ສິ່ງທີ່ຂ້ອຍຕ້ອງຕາມ)
  const knPending = (reqs.knowledge || []).filter((p) => p.byId === me && (p.status === 'draft' || p.status === 'progress')).length
  // Dashboard: ຈຳນວນຄ້າງຕໍ່ module — approve ນັບແບບດຽວກັບ pendingOf('all') ໃນ ApprovalCenter (ຕ້ອງກົງກັນ)
  const approvalPending = docs.filter((d) => isMyTurn(d, me)).length
    + pointsReqs.filter((r) => r.status === 'progress' && r.by !== me).length
    + Object.keys(reqs).reduce((n, k) => n + (reqs[k] || []).filter((r) => r.byId !== me && r.status === 'progress').length, 0)
  const dashCounts = { approve: approvalPending, sign: toSign.length, request: reqPending, knowledge: knPending }
  const inModule = MODULE_NAVS.includes(nav) // ຢູ່ໃນ module → header ມີປຸ່ມກັບ Dashboard
  const TITLE = { chat: 'Chat', dash: 'Dashboard', noti: 'ການແຈ້ງເຕືອນ', profile: 'ໂປຣໄຟລ໌', approve: 'ການອະນຸມັດ', sign: 'My e-Signature', request: 'ຄຳຂໍ', knowledge: 'ຄວາມຮູ້' }

  return (
    <div className="app home">
      {/* Dashboard ມີ hero ຂອງຕົນເອງ → ເຊື່ອງ header ປົກກະຕິ */}
      {nav !== 'dash' && (
      <div className="home-header">
        <div className="home-title-row">
          <h1>{TITLE[nav] || 'My e-Signature'}</h1>
          {/* user pill ຢູ່ຊ້າຍ (Lucky ສັ່ງ) — ລາຍງານ ກາຍເປັນ tab 5 ແລ້ວ ເຫຼືອປຸ່ມ ຕັ້ງຄ່າ */}
          <div className="home-actions right">
            {nav === 'sign' && <button className="home-iconbtn" onClick={onOpenSettings} title="ຕັ້ງຄ່າ"><Icon.gear /></button>}
          </div>
          <div className="home-actions left">
            {inModule && <button className="home-iconbtn" onClick={() => setNav('dash')} title="ກັບ Dashboard"><Icon.back /></button>}
            <div className="user-wrap">
              <button className="user-pill" onClick={() => setUserMenu((o) => !o)}>
                <span className="user-pill-av" style={avBg(me)}>{!avatarOf(me) && initials(nameOf(me))}</span>
                <Icon.chevron />
              </button>
              {userMenu && (<>
                <div className="sort-backdrop" onClick={() => setUserMenu(false)} />
                <div className="user-menu left">
                  {/* ໂປຣໄຟລ໌ຂອງຂ້ອຍ — ຍ້າຍມາຈາກ tab ລຸ່ມ (ໄດ້ slot ໃຫ້ "ຄວາມຮູ້") */}
                  <div className="user-me">
                    <span className="user-opt-av lg" style={avBg(me)}>{!avatarOf(me) && initials(nameOf(me))}</span>
                    <div className="user-me-info">
                      <b>{nameOf(me)}</b>
                      <span>{USERS.find((u) => u.id === me)?.role}</span>
                    </div>
                    <button className="home-iconbtn" title="ຕັ້ງຄ່າ" onClick={() => { setUserMenu(false); onOpenSettings() }}><Icon.gear /></button>
                  </div>
                  <p className="user-menu-title"><Icon.swap /> ສະຫຼັບຜູ້ໃຊ້ (demo)</p>
                  {USERS.map((u) => (
                    <button key={u.id} className={`user-opt ${me === u.id ? 'on' : ''}`} onClick={() => { setMe(u.id); setUserMenu(false); setTab('tosign') }}>
                      <span className="user-opt-av" style={avBg(u.id)}>{!avatarOf(u.id) && initials(u.name)}</span>
                      <span className="user-opt-info"><b>{u.name}</b><em>{u.role}</em></span>
                      {me === u.id && <Icon.check />}
                    </button>
                  ))}
                </div>
              </>)}
            </div>
          </div>
        </div>
        {nav === 'sign' && (
          <div className="home-tabs">
            {TABS.map((t) => (
              <button key={t.key} className={`home-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                <span className="home-tab-ic">
                  {t.icon()}
                  {badge[t.key] > 0 && <span className="home-tab-badge">{badge[t.key]}</span>}
                </span>
                <span className="home-tab-lbl">{t.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      <div className="scroll home-scroll">
        {nav === 'dash' ? (
          <DashboardTab me={me} counts={dashCounts} onOpenModule={(k) => setNav(k)} />
        ) : nav === 'chat' ? (
          <ChatTab />
        ) : nav === 'profile' ? (
          <ProfileTab me={me} setMe={setMe} onOpenSettings={onOpenSettings} />
        ) : nav === 'approve' ? (
          <ApprovalCenter docs={docs} me={me} onOpen={onOpenDoc} pointsReqs={pointsReqs} director={director} onPointsComment={onPointsComment} onPointsEditComment={onPointsEditComment} onPointsDeleteComment={onPointsDeleteComment} onPointsAction={onPointsAction} reqs={reqs} onReqAction={onReqAction} onCancelReq={onCancelReq}
            onReqComment={onReqComment} onReqEditComment={onReqEditComment} onReqDeleteComment={onReqDeleteComment}
            openReqId={openReqId} onConsumeOpen={() => setOpenReqId(null)}
            openReq={openReq} onConsumeOpenReq={() => setOpenReq(null)} />
        ) : nav === 'request' ? (
          <RequestScreen me={me} director={director} reqs={reqs} onReqAction={onReqAction} onCreateReq={onCreateReq} onCancelReq={onCancelReq}
            onReqComment={onReqComment} onReqEditComment={onReqEditComment} onReqDeleteComment={onReqDeleteComment}
            openReq={openReq} onConsumeOpenReq={() => setOpenReq(null)} />
        ) : nav === 'noti' ? (
          myNotis.length === 0
            ? <p className="empty-list">ຍັງບໍ່ມີການແຈ້ງເຕືອນ</p>
            : myNotis.map((n) => <NotiCard key={n.id} n={n} onOpen={onOpenFromNoti} onOpenReq={(r) => {
              // ຄຳຂໍຂອງຂ້ອຍ → ໂມດູນ ຄຳຂໍ/ຄວາມຮູ້ · ຂອງຄົນອື่ນ (ຂ້ອຍເປັນຜູ້ອະນຸມັດ) → ໂມດູນ ອະນຸມັດ (ມີປຸ່ມ)
              const rec = r.kind === 'points' ? null : (reqs[r.kind] || []).find((x) => x.id === r.id)
              const mine = rec?.byId === me
              setNav(r.kind === 'points' || !mine ? 'approve' : r.kind === 'knowledge' ? 'knowledge' : 'request')
              setOpenReq(r)
            }} />)
        ) : nav === 'knowledge' ? (
          <KnowledgeScreen me={me} posts={reqs.knowledge || []}
            onCreateKn={onCreateKn} onSubmitKn={onSubmitKn} onKnLike={onKnLike} onKnView={onKnView}
            onReqComment={onReqComment} onReqEditComment={onReqEditComment} onReqDeleteComment={onReqDeleteComment}
            openReq={openReq} onConsumeOpenReq={() => setOpenReq(null)} />
        ) : tab === 'tosign'
          ? <DocList key="tosign" mode="tosign" docs={toSign} me={me} onOpen={onOpenDoc} empty="ບໍ່ມີເອກະສານທີ່ລໍຖ້າລາຍເຊັນທ່ານ" creatorMode />
          : tab === 'cc'
            ? <DocList key="cc" mode="cc" docs={ccDocs} me={me} onOpen={onOpenDoc} empty="ຍັງບໍ່ມີເອກະສານທີ່ໄດ້ຮັບ CC" creatorMode />
            : tab === 'created'
              ? <DocList key="created" mode="created" docs={created} me={me} onOpen={onOpenDoc} empty="ທ່ານຍັງບໍ່ໄດ້ສ້າງເອກະສານ" />
              : tab === 'history'
                ? <DocList key="history" mode="history" docs={history} me={me} onOpen={onOpenDoc} empty="ຍັງບໍ່ມີປະຫວັດເອກະສານ" creatorMode />
                : tab === 'assigned'
                  ? <AssignedTab docs={docs} me={me} onOpen={onOpenDoc} />
                  : <Overview docs={visibleDocs(docs, me)} me={me} onOpen={onOpenDoc} />}
      </div>

      {/* FAB: e-Sign → ສ້າງເອກະສານ · Dashboard/Approval → ເມນູສ້າງຄຳຂໍ — tab ອື่น (chat/noti/profile) ບໍ່ມີ FAB
          ໂມດູນທີ່ມີ FAB ຂອງຕົນເອງ (request/knowledge) ບໍ່ໂຊ FAB ກາງ ບໍ່ດັ່ງນັ້ນຈະຊ້ອນກັນ 2 ປຸ່ມ */}
      {['sign', 'approve', 'dash'].includes(nav) && (
        <button className="fab fab-float" onClick={() => (nav === 'sign' ? onNew() : setFabMenu(true))}><Icon.plus /></button>
      )}
      {fabMenu && (
        <div className="modal-overlay" onClick={() => setFabMenu(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b><Icon.plus /> ສ້າງຄຳຂໍໃໝ່</b><button className="icon-mini" onClick={() => setFabMenu(false)}><Icon.x /></button></div>
            <div className="fab-opts">
              <button className="fab-opt" onClick={() => { setFabMenu(false); setPointsForm(true) }}>
                <span className="fab-opt-ic points"><Icon.chart /></span>
                <div><b>ຂໍຄະແນນ Workboard</b><span>ຂໍຄະແນນ ໃຫ້ Activity ຫຼື Task</span></div><Icon.chevron />
              </button>
              <button className="fab-opt" onClick={() => { setFabMenu(false); onNew() }}>
                <span className="fab-opt-ic esign"><Icon.pen /></span>
                <div><b>ຂໍ e-Signature</b><span>ສ້າງເອກະສານ ຂໍລາຍເຊັນ / ອະນຸມັດ</span></div><Icon.chevron />
              </button>
              <button className="fab-opt" onClick={() => setFabMenu(false)}>
                <span className="fab-opt-ic work"><Icon.book /></span>
                <div><b>Work request</b><span>ຄຳຂໍວຽກ — ກຳລັງພັດທະນາ (ໄວໆນີ້)</span></div><Icon.chevron />
              </button>
            </div>
          </div>
        </div>
      )}
      {pointsForm && <PointsRequest me={me} onSubmit={onCreatePoints} onViewDetail={(r) => { setPointsForm(false); setNav('approve'); setOpenReqId(r.id) }} onClose={() => setPointsForm(false)} />}

      <div className="home-bottomnav">
        {[
          // shell ใหม่ (Lucky 19/07): 4 tabs — Chat / Dashboard / Noti / Profile · module 4 ตัวย้ายเข้า Dashboard
          { key: 'chat', label: 'Chat', icon: Icon.chat },
          { key: 'dash', label: 'Dashboard', icon: Icon.grid },
          { key: 'noti', label: 'Noti', icon: Icon.bell, badge: unread },
          { key: 'profile', label: 'Profile', icon: Icon.user },
        ].map((b) => (
          <button key={b.key} className={`bnav ${nav === b.key || (b.key === 'dash' && inModule) ? 'active' : ''}`} onClick={() => { setNav(b.key); if (b.key === 'noti') onMarkRead() }}>
            <span className="bnav-ic">{b.icon()}{b.badge > 0 && <span className="bnav-badge">{b.badge}</span>}</span>
            <span>{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
