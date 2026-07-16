import { useState, useEffect } from 'react'
import { Icon, initials, Header, ResultPopup, ReasonModal, ScreenPortal } from '../flow/shared.jsx'
import RequestScreen, { REQ_KINDS, KIND_META, ReqCard, RequestDetailBody } from './RequestScreen.jsx'
import KnowledgeScreen, { KnowledgeDetailBody } from './KnowledgeScreen.jsx'
import FilePreviewModal from '../flow/FilePreviewModal.jsx'
import { USERS, nameOf, colorOf, progress, isMyTurn, avatarOf, rolesLabel, sortPendingFirst, currentApprover } from './data.js'
import PointsRequest from './PointsRequest.jsx'

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
  const myTurn = isMyTurn(d, me)
  const rejected = d.signers.some((s) => s.status === 'rejected')
  const st = d.status === 'done'
    ? { t: 'ສຳເລັດແລ້ວ', c: 'done' }
    : d.status === 'cancelled'
      ? { t: 'ຍົກເລີກແລ້ວ', c: 'cancel' }
      : rejected ? { t: 'ຖືກປະຕິເສດ', c: 'rej' } : { t: 'ກຳລັງດຳເນີນການ', c: '' }
  return (
    <button className={`doc-card ${myTurn ? 'myturn' : ''}`} onClick={() => onOpen(d.id)}>
      <div className="doc-card-top">
        <span className="doc-card-icon"><Icon.doc /></span>
        <b className="doc-card-title">{d.title}</b>
        {myTurn ? <span className="doc-status turn"><Icon.pen /> ຮອບຂອງທ່ານ</span> : <span className={`doc-status ${st.c}`}>{st.t}</span>}
      </div>
      <p className="doc-meta">ສ້າງໂດຍ: {nameOf(d.creatorId)} · {d.date}</p>
      <div className="doc-chips">
        <span className="doc-chip"><Icon.doc /> {d.files.length} ໄຟລ໌</span>
        {d.attachments.length > 0 && <span className="doc-chip alt"><Icon.layers /> ໄຟລ໌ແນບ {d.attachments.length}</span>}
        {d.creatorId !== me && !d.signers.some((s) => s.id === me) && (d.cc || []).includes(me) && <span className="doc-chip cc"><Icon.users /> CC</span>}
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
      {d.status === 'progress' && !rejected && d.signers.some((s) => s.id === me && s.status === 'signed') &&
        <div className="doc-note-min"><Icon.clock /> ທ່ານໄດ້ເຊັນແລ້ວ · ລໍຖ້າຜູ້ອື່ນລົງນາມ</div>}
    </button>
  )
}

// ─────────── reusable dropdown ───────────
const CATS = [{ key: 'all', label: 'ທຸກສະຖານະ' }, { key: 'progress', label: 'ກຳລັງດຳເນີນການ' }, { key: 'done', label: 'ສຳເລັດແລ້ວ' }, { key: 'rejected', label: 'ຖືກປະຕິເສດ' }, { key: 'cancelled', label: 'ຍົກເລີກແລ້ວ' }]
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
function DocList({ docs, me, onOpen, empty, creatorMode }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [who, setWho] = useState('all')
  const [time, setTime] = useState('all')
  const [range, setRange] = useState({ from: '', to: '' })
  const [sort, setSort] = useState('recent')
  const [sortOpen, setSortOpen] = useState(false)
  const SORTS = creatorMode ? SORTS_SIGNED : SORTS_SENT // tab 2 (ເຊັນແລ້ວ) = ເຊັນລ່າສຸດ/ເກົ່າສຸດ
  const REF = 14

  let list = docs.filter((d) => {
    if (q && !d.title.toLowerCase().includes(q.trim().toLowerCase())) return false
    if (cat !== 'all' && d.status !== cat) return false
    if (creatorMode && who === 'mine' && d.creatorId !== me) return false
    if (creatorMode && who === 'others' && d.creatorId === me) return false
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
    if (sort === 'recent') return b.ts - a.ts
    if (sort === 'oldest') return a.ts - b.ts
    if (sort === 'az') return a.title.localeCompare(b.title, 'lo')
    return b.title.localeCompare(a.title, 'lo')
  })
  const catLabel = CATS.find((c) => c.key === cat).label
  const timeLabel = TIMES.find((t) => t.key === time).label

  return (
    <>
      <div className="home-search"><Icon.search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ຄົ້ນຫາເອກະສານ..." /></div>
      <div className="home-filters">
        {creatorMode && <FilterDropdown btnLabel={CREATORS.find((c) => c.key === who).label} title="ຜູ້ສ້າງ" options={CREATORS} value={who} onChange={setWho} />}
        <FilterDropdown btnLabel={`${catLabel} (${list.length})`} title="ສະຖານະ" options={CATS} value={cat} onChange={setCat} />
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
  const REF = 14
  const inPeriod = (d) => (period === 'all' ? true : period === 'week' ? REF - d.ts <= 7 : REF - d.ts <= 30)
  const scoped = docs.filter((d) => (d.creatorId === me || d.signers.some((s) => s.id === me) || (d.cc || []).includes(me)) && inPeriod(d))

  // ── ຕາມແຫຼ່ງ (source) ──
  const created = scoped.filter((d) => d.creatorId === me)
  const received = scoped.filter((d) => d.creatorId !== me && d.signers.some((s) => s.id === me))
  const ccMe = scoped.filter((d) => d.creatorId !== me && !d.signers.some((s) => s.id === me) && (d.cc || []).includes(me))
  // ── ຕາມການກະທຳ ──
  const waitMe = scoped.filter((d) => isMyTurn(d, me))
  const waitOthers = scoped.filter((d) => d.creatorId === me && d.status === 'progress')
  const signedMe = scoped.filter((d) => d.signers.some((s) => s.id === me && s.status === 'signed'))
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
          : urgent.map((d) => (
            <div className="ov-urgent" key={d.id}>
              <span className="ov-urgent-ic"><Icon.pen /></span>
              <div className="ov-urgent-body"><b>{d.title}</b><span className="ov-urgent-time">{REF - d.ts <= 0 ? 'ມື້ນີ້' : `${REF - d.ts} ວັນກ່ອນ`}</span></div>
              <button className="ov-urgent-go" onClick={() => onOpen(d.id)}>ໄປເຊັນ</button>
            </div>
          ))}
      </div>

      {drill && (
        <ScreenPortal>
        <div className="modal-overlay" onClick={() => setDrill(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b>{drill.title} ({drill.list.length})</b><button className="icon-mini" onClick={() => setDrill(null)}><Icon.x /></button></div>
            <div className="modal-list">
              {drill.list.length === 0
                ? <p className="empty-list sm">ບໍ່ມີເອກະສານ</p>
                : drill.list.map((d) => (
                  <button className="drill-row" key={d.id} onClick={() => { setDrill(null); onOpen(d.id) }}>
                    <span className="drill-ic"><Icon.doc /></span>
                    <div className="drill-info"><b>{d.title}</b><span>ສ້າງໂດຍ {nameOf(d.creatorId)} · {d.date}</span></div>
                    <span className={`doc-status ${d.status === 'done' ? 'done' : d.status === 'rejected' ? 'rej' : ''}`}>{d.status === 'done' ? 'ສຳເລັດ' : d.status === 'rejected' ? 'ປະຕິເສດ' : 'ດຳເນີນການ'}</span>
                  </button>
                ))}
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
  const [cmtText, setCmtText] = useState('')
  const [cmtReplyTo, setCmtReplyTo] = useState(null) // { id, name } กำลังตอบกลับ
  const [cmtEditId, setCmtEditId] = useState(null)
  const [cmtEditText, setCmtEditText] = useState('')
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
  // request ຂໍລາຍເຊັນ: ລໍຖ້າ me (esign) + ທີ່ me ເຊັນແລ້ວ (approved) + ທີ່ me ປະຕິເສດ (rejected) → ຢູ່ຄົບທຸກ tab
  const esignItems = docs
    .filter((d) => d.signers.some((s) => s.id === me) && (isMyTurn(d, me) || d.signers.some((s) => s.id === me && (s.status === 'signed' || s.status === 'rejected'))))
    .map((d) => {
      const mine = d.signers.find((s) => s.id === me)
      const status = mine.status === 'signed' ? 'approved' : mine.status === 'rejected' ? 'rejected' : 'esign'
      return { kind: 'esign', id: d.id, title: d.title, byId: d.creatorId, by: nameOf(d.creatorId), date: d.date, status, docId: d.id, signers: d.signers }
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
    // ຄຳຂໍທົ່ວໄປ → ໃຊ້ການ໌ດອັນດຽວກັບໂມດູນ "ຄຳຂໍ" (ຄົບ: ປະເພດ · ວັນເວລາ · ຊົ່ວໂມງ · ເຫດຜົນ · ໄຟລ໌ແນບ · ຜູ້ຂໍ+avatar)
    if (KIND_META[m.kind]) return <ReqCard key={m.id} r={m} kind={m.kind} showBy onOpen={() => setAcDetail(m)} />
    const isEsign = m.kind === 'esign'
    const st = isEsign
      ? (m.status === 'esign' ? { t: 'ລໍຖ້າລົງນາມ', c: 'wait' } : m.status === 'approved' ? { t: 'ເຊັນແລ້ວ', c: 'done' } : { t: 'ປະຕິເສດ', c: 'rej' })
      : AC_STATUS[m.status] || AC_STATUS.progress
    const CardIcon = AC_ICON[m.kind] || Icon.checkCircle
    // ໂຄງດຽວກັບ ReqCard → badge ຢູ່ແຖວດຽວກັບຫົວຂໍ້ ທຸກການ໌ດ (ບໍ່ແມ່ນລອຍກາງ)
    return (
      <button className="req-card" key={m.id} onClick={() => (isEsign ? onOpen(m.docId) : setAcDetail(m))}>
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
            {m.sub && <span className="req-chip hl">{m.sub}</span>}
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

              {detailReq && (() => {
                const roots = detailReq.comments.filter((c) => !c.parentId)
                const repliesOf = (id) => detailReq.comments.filter((c) => c.parentId === id)
                const sendCmt = () => { if (cmtText.trim()) { onPointsComment(detailReq.id, cmtText.trim(), cmtReplyTo?.id); setCmtText(''); setCmtReplyTo(null) } }
                const saveEdit = (c) => { if (cmtEditText.trim()) onPointsEditComment(detailReq.id, c.id, cmtEditText.trim()); setCmtEditId(null) }
                const CmtItem = (c, reply) => {
                  const mine = c.byId === me
                  const editing = cmtEditId === c.id
                  return (
                    <div className={`dd-cmt ${reply ? 'reply' : ''}`} key={c.id}>
                      <div className="dd-cmt-av" style={avBg(c.byId)}>{!avatarOf(c.byId) && initials(nameOf(c.byId))}</div>
                      <div className="dd-cmt-body">
                        <div className="dd-cmt-head"><b>{nameOf(c.byId)}</b><span>{c.time}{c.edited ? ' · ແກ້ໄຂແລ້ວ' : ''}</span></div>
                        {editing ? (
                          <div className="dd-cmt-edit"><input value={cmtEditText} onChange={(e) => setCmtEditText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(c)} autoFocus />
                            <button className="dd-cmt-esave" onClick={() => saveEdit(c)}>ບັນທຶກ</button><button className="dd-cmt-ecancel" onClick={() => setCmtEditId(null)}>ຍົກເລີກ</button></div>
                        ) : <p>{c.text}</p>}
                        {!editing && detailReq.status === 'progress' && (
                          <div className="dd-cmt-acts">
                            <button className="dd-cmt-reply" onClick={() => setCmtReplyTo({ id: reply ? c.parentId : c.id, name: nameOf(c.byId) })}><Icon.reply /> ຕອບກັບ</button>
                            {mine && (<>
                              <button className="dd-cmt-reply" onClick={() => { setCmtEditId(c.id); setCmtEditText(c.text) }}><Icon.pen /> ແກ້ໄຂ</button>
                              <button className="dd-cmt-reply del" onClick={() => onPointsDeleteComment(detailReq.id, c.id)}><Icon.trash /> ລຶບ</button>
                            </>)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
                return (
                  <div className="ptd-cmt-card">
                    <p className="ptd-card-label">ຄວາມຄິດເຫັນ ({detailReq.comments.length})</p>
                    {detailReq.comments.length === 0 && <p className="empty-list sm" style={{ padding: '4px 0 10px' }}>ຍັງບໍ່ມີຄວາມຄິດເຫັນ</p>}
                    {roots.map((c) => (<div key={c.id}>{CmtItem(c, false)}{repliesOf(c.id).map((r) => CmtItem(r, true))}</div>))}
                    {cmtReplyTo && <div className="dd-replybar"><span><Icon.reply /> ຕອບກັບ {cmtReplyTo.name}</span><button onClick={() => setCmtReplyTo(null)}><Icon.x /></button></div>}
                    <div className="dd-cmt-input" style={{ marginTop: 10 }}>
                      <input value={cmtText} onChange={(e) => setCmtText(e.target.value)} placeholder={cmtReplyTo ? `ຕອບກັບ ${cmtReplyTo.name}...` : 'ຂຽນຄວາມຄິດເຫັນ...'} onKeyDown={(e) => e.key === 'Enter' && sendCmt()} />
                      <button className="dd-cmt-send" onClick={sendCmt}><Icon.send /></button>
                    </div>
                  </div>
                )
              })()}
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
const TABS = [
  { key: 'created', label: 'ລໍຖ້າຜູ້ອື່ນ', icon: Icon.clock },
  { key: 'signed', label: 'ລົງນາມແລ້ວ', icon: Icon.checkCircle },
  { key: 'cc', label: 'ໄດ້ຮັບ CC', icon: Icon.users },
  { key: 'overview', label: 'ພາບລວມ', icon: Icon.chart },
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

export default function HomeScreen({ me, setMe, docs, notis, pointsReqs = [], director, onCreatePoints, onPointsComment, onPointsEditComment, onPointsDeleteComment, onPointsAction, reqs = {}, onReqAction, onCreateReq, onCancelReq, onReqComment, onReqEditComment, onReqDeleteComment,
  onCreateKn, onSubmitKn, onKnLike, onKnView, onMarkRead, onNew, onOpenDoc, onOpenFromNoti, onOpenSettings }) {
  const [tab, setTab] = useState('created')
  const [nav, setNav] = useState('sign')
  const [userMenu, setUserMenu] = useState(false)
  const [fabMenu, setFabMenu] = useState(false)
  const [pointsForm, setPointsForm] = useState(false)
  const [openReqId, setOpenReqId] = useState(null) // เปิด detail ของ points req หลังสร้าง
  const [openReq, setOpenReq] = useState(null) // { kind, id } — ເປີດຄຳຂໍ ຈາກແຈ້ງເຕືອນ

  // tab 1 ລໍຖ້າຜູ້ອື່ນ = request ທີ່ຂ້ອຍສ້າງ ແລະ ຍັງບໍ່ສຳເລັດ
  // tab 2 ລົງນາມແລ້ວ = ຄົນອື່ນສ້າງ+ຂ້ອຍເຊັນແລ້ວ  ຫຼື  ຂ້ອຍສ້າງ+ເຊັນຄົບແລ້ວ (ບໍ່ແຍກຕາມຜູ້ສ້າງ)
  const created = docs.filter((d) => d.creatorId === me && d.status !== 'done')
  const signed = docs.filter((d) =>
    (d.creatorId !== me && d.signers.some((s) => s.id === me && s.status === 'signed')) ||
    (d.creatorId === me && d.status === 'done'))
  // ໄດ້ຮັບ CC = ຄົນອื่นสร้าง + ฉันไม่ได้เป็นผู้เซ็น + ฉันอยู่ใน cc
  const ccDocs = docs.filter((d) => d.creatorId !== me && !d.signers.some((s) => s.id === me) && (d.cc || []).includes(me))
  const myNotis = notis.filter((n) => n.forId === me)
  const unread = myNotis.filter((n) => !n.read).length
  const badge = { created: created.filter((d) => d.status === 'progress').length, signed: signed.length }
  // badge ໂມດູນ "ຄຳຂໍ" = ຄຳຂໍ "ຂອງຂ້ອຍ" ທີ່ຍັງລໍຖ້າຜົນອະນຸມັດ
  // (ທີ່ຄົນອື່ນສົ່ງມາໃຫ້ຂ້ອຍອະນຸມັດ ຢູ່ໂມດູນ "ການອະນຸມັດ" — ບໍ່ນັບຢູ່ນີ້)
  const reqPending = REQ_KINDS.reduce((n, k) => n + (reqs[k.key] || []).filter((r) => r.byId === me && r.status === 'progress').length, 0)
  // badge ຄວາມຮູ້ = ຮ່າງ + ທີ່ຍັງລໍຖ້າກວດສອບ ຂອງຂ້ອຍ (ສິ່ງທີ່ຂ້ອຍຕ້ອງຕາມ)
  const knPending = (reqs.knowledge || []).filter((p) => p.byId === me && (p.status === 'draft' || p.status === 'progress')).length

  return (
    <div className="app home">
      <div className="home-header">
        <div className="home-title-row">
          <h1>{nav === 'approve' ? 'ການອະນຸມັດ' : nav === 'request' ? 'ຄຳຂໍ' : nav === 'knowledge' ? 'ຄວາມຮູ້' : 'My e-Signature'}</h1>
          <div className="home-actions">
            {nav === 'sign' && <button className="home-iconbtn" onClick={onOpenSettings} title="ຕັ້ງຄ່າ"><Icon.gear /></button>}
            <div className="user-wrap">
              <button className="user-pill" onClick={() => setUserMenu((o) => !o)}>
                <span className="user-pill-av" style={avBg(me)}>{!avatarOf(me) && initials(nameOf(me))}</span>
                <Icon.chevron />
              </button>
              {userMenu && (<>
                <div className="sort-backdrop" onClick={() => setUserMenu(false)} />
                <div className="user-menu">
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
                    <button key={u.id} className={`user-opt ${me === u.id ? 'on' : ''}`} onClick={() => { setMe(u.id); setUserMenu(false); setTab('created') }}>
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

      <div className="scroll home-scroll">
        {nav === 'approve' ? (
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
        ) : tab === 'overview'
          ? <Overview docs={docs} me={me} onOpen={onOpenDoc} />
          : tab === 'cc'
            ? (<><p className="cc-note"><Icon.users /> ເອກະສານທີ່ທ່ານໄດ້ຮັບສຳເນົາ (CC) — ເບິ່ງໄດ້ ບໍ່ຕ້ອງເຊັນ</p><DocList docs={ccDocs} me={me} onOpen={onOpenDoc} empty="ຍັງບໍ່ມີເອກະສານທີ່ໄດ້ຮັບ CC" creatorMode /></>)
            : tab === 'created'
              ? <DocList docs={created} me={me} onOpen={onOpenDoc} empty="ທ່ານຍັງບໍ່ໄດ້ສ້າງເອກະສານ" />
              : <DocList docs={signed} me={me} onOpen={onOpenDoc} empty="ຍັງບໍ່ມີເອກະສານທີ່ທ່ານລົງນາມແລ້ວ" creatorMode />}
      </div>

      {/* ໂມດູນທີ່ມີ FAB ຂອງຕົນເອງ (ສ້າງຕາມ tab ທີ່ເປີດຢູ່) → ບໍ່ໂຊ FAB ກາງ ບໍ່ດັ່ງນັ້ນຈະຊ້ອນກັນ 2 ປຸ່ມ
          ເພີ່ມໂມດູນໃໝ່ທີ່ມີ FAB ເອງ → ຕ້ອງເພີ່ມຊື່ໃສ່ນີ້ນຳ */}
      {!['request', 'knowledge'].includes(nav) && (
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
          // label ອັງກິດ (Lucky ຂໍ) — ຫົວຂໍ້ຂ້າງໃນ ຍັງເປັນລາວ
          { key: 'approve', label: 'Approval', icon: Icon.checkCircle },
          { key: 'sign', label: 'e-Sign', icon: Icon.pen },
          { key: 'request', label: 'Request', icon: Icon.reqDoc, badge: reqPending },
          // ໂປຣໄຟລ໌ ຍ້າຍໄປຢູ່ user-pill ເທິງຫົວ (ມີສະຫຼັບຜູ້ໃຊ້ຢູ່ແລ້ວ) → ໄດ້ slot ໃຫ້ "ຄວາມຮູ້"
          { key: 'knowledge', label: 'Knowledge', icon: Icon.bulb, badge: knPending },
          { key: 'noti', label: 'Alerts', icon: Icon.bell, badge: unread },
        ].map((b) => (
          <button key={b.key} className={`bnav ${nav === b.key ? 'active' : ''}`} onClick={() => { setNav(b.key); if (b.key === 'noti') onMarkRead() }}>
            <span className="bnav-ic">{b.icon()}{b.badge > 0 && <span className="bnav-badge">{b.badge}</span>}</span>
            <span>{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
