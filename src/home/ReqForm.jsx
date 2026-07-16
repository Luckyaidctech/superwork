import { useState, useMemo, useRef } from 'react'
import { Icon, Header, initials } from '../flow/shared.jsx'
import { approvalChain, reqTime, fmtH, daysBetween, PROJECTS, DAY_TYPES } from './data.js'
import DateRangeSheet from './DateRangeSheet.jsx'
import TimeSheet from './TimeSheet.jsx'
import PickSheet from './PickSheet.jsx'
import FilePreviewModal from '../flow/FilePreviewModal.jsx'

// ── ເວລາເຮັດວຽກຂອງບໍລິສັດ (ແກ້ບ່ອນດຽວ ມີຜົນທຸກຟອມ) ──
const WORK = { from: '08:30', to: '18:00' }

// ── ຄ່າຕັ້ງແຕ່ລະໝວດ — ໂຄງຟອມອັນດຽວກັນໝົດ, ຕ່າງແຕ່ field ສະເພາະ ──
const CFG = {
  leave: {
    title: 'ສ້າງຄຳຂໍລາພັກ', icon: Icon.umbrella,
    typeLabel: 'ປະເພດການລາ', typePh: 'ເລືອກປະເພດການລາ',
    types: ['ລາປ່ວຍ', 'ລາກິດ', 'ລາພັກປະຈຳປີ', 'ລາເບິ່ງແຍງຄອບຄົວ', 'ລາຄອດບຸດ'],
    reasonPh: 'ບອກເຫດຜົນທີ່ຂໍລາ...',
    reasonChips: ['ວຽກສ່ວນຕົວ', 'ເລື່ອງຄອບຄົວ', 'ພັກຜ່ອນ', 'ເດີນທາງຕ່າງແຂວງ', 'ຕິດຕໍ່ລາຊະການ', 'ນັດພົບແພດ'],
    range: true, from: WORK.from, to: WORK.to,
    presets: [['ເຕັມມື້', WORK.from, WORK.to], ['ຄຶ່ງເຊົ້າ', WORK.from, '12:00'], ['ຄຶ່ງບ່າຍ', '13:00', WORK.to]],
  },
  offsite: {
    title: 'ສ້າງຄຳຂໍວຽກນອກສະຖານທີ', icon: Icon.briefcase,
    typeLabel: 'ປະເພດວຽກ', typePh: 'ເລືອກປະເພດວຽກ',
    types: ['ພົບລູກຄ້າ', 'ຕິດຕັ້ງລະບົບ ໜ້າງານ', 'ອົບຮົມ ນອກສະຖານທີ', 'ທົດສອບລະບົບ ໜ້າງານ', 'ສຳຫຼວດ ໜ້າງານ'],
    location: true, // ສະຖານທີ (ແທນ ໝາຍເຫດ ໃນການ໌ດ)
    locChips: ['ນະຄອນຫຼວງວຽງຈັນ', 'ທະນາຄານ BCEL', 'BOL', 'ໂຮງງານ HAIXIN', 'ແຂວງ ຈຳປາສັກ'],
    reasonPh: 'ລາຍລະອຽດວຽກທີ່ໄປເຮັດ...',
    reasonChips: ['ພົບລູກຄ້າ ນອກຫ້ອງການ', 'ຕິດຕັ້ງ / ແກ້ໄຂ ໜ້າງານ', 'ອົບຮົມ ໃຫ້ລູກຄ້າ'],
    range: true, from: WORK.from, to: WORK.to,
    presets: [['ເຕັມມື້', WORK.from, WORK.to], ['ຄຶ່ງເຊົ້າ', WORK.from, '12:00'], ['ຄຶ່ງບ່າຍ', '13:00', WORK.to]],
  },
  ot: {
    title: 'ສ້າງຄຳຂໍໂອທີ', icon: Icon.clock,
    project: true, // ເລືອກໂຄງການ → ກິດຈະກຳ (ຫົວຂໍ້ຄຳຂໍ = ຊື່ໂຄງການ)
    dayType: true, // ວັນທຳມະດາ / ວັນພັກ — ອັດຕາໂອທີຕ່າງກັນ
    reasonPh: 'ບອກຜູ້ອະນຸມັດວ່າ ເປັນຫຍັງຈຶ່ງຕ້ອງເຮັດໂອທີ...',
    reasonChips: ['ວຽກດ່ວນ ໃກ້ກຳນົດສົ່ງ', 'ລູກຄ້າຮ້ອງຂໍ', 'ບຳລຸງຮັກສາລະບົບ'],
    // ໂອທີ ເລີ່ມຫຼັງເລີກວຽກ (18:00)
    range: false, from: WORK.to, to: '20:00',
    presets: [['1 ຊົ່ວໂມງ', WORK.to, '19:00'], ['2 ຊົ່ວໂມງ', WORK.to, '20:00'], ['3 ຊົ່ວໂມງ', WORK.to, '21:00']],
  },
}
const LUNCH = { from: 12 * 60, to: 13 * 60 }
const MAX_REASON = 500
const TODAY = '15/07/2026'

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const toISO = (d) => { const [dd, mm, yy] = d.split('/'); return `${yy}-${mm}-${dd}` }
const fromISO = (d) => { const [yy, mm, dd] = d.split('-'); return `${dd}/${mm}/${yy}` }
const M_SHORT = ['ມ.ກ.', 'ກ.ພ.', 'ມີ.ນ.', 'ເມ.ສ.', 'ພ.ພ.', 'ມິ.ຖ.', 'ກ.ລ.', 'ສ.ຫ.', 'ກ.ຍ.', 'ຕ.ລ.', 'ພ.ຈ.', 'ທ.ວ.']
const fmtDate = (s) => { const [dd, mm, yy] = s.split('/').map(Number); return `${dd} ${M_SHORT[mm - 1]} ${yy}` }
const fmtDateShort = (a, b) => {
  const [d1, m1, y1] = a.split('/').map(Number); const [, m2, y2] = b.split('/').map(Number)
  if (y1 !== y2) return `${d1} ${M_SHORT[m1 - 1]} ${y1}`
  return m1 === m2 ? `${d1}` : `${d1} ${M_SHORT[m1 - 1]}`
}
const addDays = (d, n) => { const [dd, mm, yy] = d.split('/').map(Number); const x = new Date(yy, mm - 1, dd + n); return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}` }

export default function ReqForm({ kind, me, onSubmit, onClose }) {
  const c = CFG[kind] || CFG.leave
  const [type, setType] = useState('')
  const [project, setProject] = useState('')
  const [activity, setActivity] = useState('')
  const [tasks, setTasks] = useState([]) // ໜ້າວຽກທີ່ຕິກ (ຫຼາຍອັນ)
  const [dayType, setDayType] = useState(DAY_TYPES[0].v)
  const [loc, setLoc] = useState('')
  const [date, setDate] = useState(TODAY)
  const [dateTo, setDateTo] = useState(TODAY)
  const [from, setFrom] = useState(c.from)
  const [to, setTo] = useState(c.to)
  const [reason, setReason] = useState('')
  const [files, setFiles] = useState([])
  const [cal, setCal] = useState(false)
  const [time, setTime] = useState(null) // 'from' | 'to' — ກຳລັງເລືອກເວລາອັນໃດ
  const [pick, setPick] = useState(null) // 'type' | 'project' | 'activity' — ກຳລັງເລືອກອັນໃດ
  const [preview, setPreview] = useState(null) // ໄຟລ໌ແນບ ທີ່ກຳລັງເປີດເບິ່ງ
  const [tried, setTried] = useState(false)
  const fileRef = useRef(null)
  const refs = { type: useRef(null), project: useRef(null), loc: useRef(null), reason: useRef(null), time: useRef(null) }

  const calc = useMemo(() => reqTime({ date, dateTo: c.range ? dateTo : date, from, to }), [from, to, date, dateTo, c.range])
  const chain = useMemo(() => approvalChain(me, kind), [me, kind]) // ໂອທີ: ຫົວໜ້າຢ່າງດຽວ
  const activities = PROJECTS.find((p) => p.name === project)?.activities || []
  // ໜ້າວຽກ ທັງໝົດ ຂອງກິດຈະກຳທີ່ເລືອກ
  const taskList = activities.find((a) => a.name === activity)?.tasks || []

  const pickFrom = (iso) => {
    if (!iso) return
    const d = fromISO(iso)
    setDate(d)
    if (daysBetween(d, dateTo) < 1) setDateTo(d)
  }

  // ── ກວດຄວາມຄົບຖ້ວນ → ບອກເລີຍວ່າຂາດຫຍັງ ──
  const missing = []
  if (c.types && !type) missing.push({ k: 'type', t: c.typeLabel })
  if (c.project && !project) missing.push({ k: 'project', t: 'ໂຄງການ' })
  if (c.project && project && !activity) missing.push({ k: 'project', t: 'ກິດຈະກຳ' })
  if (c.project && activity && !tasks.length) missing.push({ k: 'project', t: 'ໜ້າວຽກ' })
  if (c.location && loc.trim().length < 2) missing.push({ k: 'loc', t: 'ສະຖານທີ' })
  if (reason.trim().length < 3) missing.push({ k: 'reason', t: 'ເຫດຜົນ' })
  if (calc.total <= 0) missing.push({ k: 'time', t: 'ເວລາ' })
  const ok = missing.length === 0

  const pickFiles = (e) => {
    const fs = [...e.target.files].map((f) => ({ name: f.name, size: f.size, type: f.type, file: f, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null }))
    setFiles((p) => [...p, ...fs]); e.target.value = ''
  }
  const submit = () => {
    setTried(true)
    if (!ok) { refs[missing[0].k]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    onSubmit({
      title: c.project ? project : type,
      date, ...(c.range && calc.days > 1 ? { dateTo } : {}), from, to,
      // ວຽກນອກ: ໝາຍເຫດ = ສະຖານທີ (ການ໌ດໂຊເປັນ chip 📍) · ອື່ນໆ: ໝາຍເຫດ = ເຫດຜົນ
      note: c.location ? loc.trim() : reason.trim(),
      ...(c.location ? { detail: reason.trim() } : {}),
      ...(c.project ? { activity, tasks } : {}),
      ...(c.dayType ? { dayType } : {}),
      hours: fmtH(calc.total), days: calc.days, files, approvers: chain.map((p) => p.id),
    })
  }

  return (
    <div className="app rf-screen">
      <Header title={c.title} onBack={onClose} />
      <div className="scroll rf-scroll">

        {/* ປະເພດ (ລາພັກ / ວຽກນອກ) */}
        {c.types && (
          <section className={`rf-card ${tried && !type ? 'err' : ''}`} ref={refs.type}>
            <div className="rf-head"><span className="rf-head-ic">{c.icon()}</span><b>{c.typeLabel}</b><i className="rf-req">ຈຳເປັນ</i></div>
            <button className={`rf-pick ${type ? '' : 'ph'}`} onClick={() => setPick('type')}>
              {type || c.typePh}<Icon.chevron />
            </button>
          </section>
        )}

        {/* ວັນເວລາ */}
        <section className={`rf-card ${tried && calc.total <= 0 ? 'err' : ''}`} ref={refs.time}>
          <div className="rf-head"><span className="rf-head-ic"><Icon.calendar /></span><b>ວັນເວລາ</b></div>

          <div className="rf-box">
            <button className="rf-box-row tap" onClick={() => setCal(true)}>
              <span className="rf-box-lb"><Icon.calendar /> ວັນທີ</span>
              <b className="rf-box-val">{c.range && calc.days > 1 ? `${fmtDateShort(date, dateTo)} – ${fmtDate(dateTo)}` : fmtDate(date)}</b>
              {c.range && <span className="rf-box-tag">{calc.days} ມື້</span>}
              <Icon.chevron />
            </button>
            <div className="rf-box-row">
              <span className="rf-box-lb"><Icon.clock /> ເວລາ</span>
              <button className="rf-time" onClick={() => setTime('from')}>{from}</button>
              <span className="rf-box-sep">–</span>
              <button className="rf-time" onClick={() => setTime('to')}>{to}</button>
            </div>
          </div>

          <div className="rf-quick">
            <button className={`rf-qchip ${date === TODAY ? 'on' : ''}`} onClick={() => pickFrom(toISO(TODAY))}>ມື້ນີ້</button>
            <button className={`rf-qchip ${date === addDays(TODAY, 1) ? 'on' : ''}`} onClick={() => pickFrom(toISO(addDays(TODAY, 1)))}>ມື້ອື່ນ</button>
            {c.presets.map(([t, f, e2]) => (
              <button key={t} className={`rf-qchip ${from === f && to === e2 ? 'on' : ''}`} onClick={() => { setFrom(f); setTo(e2) }}>{t}</button>
            ))}
          </div>

          {/* ປະເພດວັນ (ໂອທີ — ອັດຕາຕ່າງກັນ) 4 ແບບ ຕາມລະບົບຈິງ */}
          {c.dayType && (<>
            <label className="rf-label" style={{ marginTop: 12 }}>ປະເພດວັນ</label>
            <button className="rf-pick" onClick={() => setPick('dayType')}>
              <span className="rf-pick-dot">
                <span className="pk-dot" style={{ '--d': DAY_TYPES.find((d) => d.v === dayType)?.dot }} />
                {dayType}
              </span>
              <Icon.chevron />
            </button>
          </>)}

          <div className="rf-bar" title="06:00 – 22:00">
            <span className="rf-bar-fill" style={{ left: `${((toMin(from) - 360) / 960) * 100}%`, width: `${((toMin(to) - toMin(from)) / 960) * 100}%` }} />
            {calc.cut > 0 && <span className="rf-bar-lunch" style={{ left: `${((LUNCH.from - 360) / 960) * 100}%`, width: `${((LUNCH.to - LUNCH.from) / 960) * 100}%` }} />}
          </div>
          <div className="rf-bar-legend"><span>06:00</span><span>14:00</span><span>22:00</span></div>

          {calc.cut > 0 && <p className="rf-lunch"><Icon.info /> ພັກທ່ຽງ 12:00–13:00 ບໍ່ຖືກນັບ <b>−{fmtH(calc.cut)}</b></p>}
          <div className="rf-total">
            <span>ລວມ{c.range && calc.days > 1 ? ` (${calc.days} ມື້ × ${fmtH(calc.perDay)})` : ''}{c.dayType && dayType === 'ວັນພັກ' ? ' · ວັນພັກ' : ''}</span>
            <b>{fmtH(calc.total)}</b>
          </div>
        </section>

        {/* ວຽກ: ໂຄງການ → ກິດຈະກຳ → ຕິກໜ້າວຽກ (ຫຼາຍອັນໄດ້) — ຢູ່ຫຼັງ "ວັນເວລາ" */}
        {c.project && (
          <section className={`rf-card ${tried && (!project || !activity || !tasks.length) ? 'err' : ''}`} ref={refs.project}>
            <div className="rf-head"><span className="rf-head-ic"><Icon.layers /></span><b>ວຽກ</b><i className="rf-req">ຈຳເປັນ</i></div>
            <label className="rf-label">ໂຄງການ</label>
            <button className={`rf-pick ${project ? '' : 'ph'}`} onClick={() => setPick('project')}>
              {project || 'ເລືອກໂຄງການ'}<Icon.chevron />
            </button>
            <label className="rf-label">ກິດຈະກຳ</label>
            <button className={`rf-pick ${activity ? '' : 'ph'}`} disabled={!project} onClick={() => setPick('activity')}>
              {activity || (project ? 'ເລືອກກິດຈະກຳ' : 'ເລືອກໂຄງການກ່ອນ')}<Icon.chevron />
            </button>
            {/* ໜ້າວຽກ ຂອງກິດຈະກຳທີ່ເລືອກ → ຕິກໄດ້ຫຼາຍອັນ */}
            {activity && (<>
              <label className="rf-label">ໜ້າວຽກ <em className="rf-hint-sm">ຕິກໄດ້ຫຼາຍອັນ · ເລືອກແລ້ວ {tasks.length}</em></label>
              <div className="rf-tasks">
                {taskList.map((t) => (
                  <button key={t} className={`rf-task ${tasks.includes(t) ? 'on' : ''}`}
                    onClick={() => setTasks((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}>
                    <span className="rf-task-box">{tasks.includes(t) && <Icon.check />}</span>
                    {t}
                  </button>
                ))}
              </div>
            </>)}
          </section>
        )}

        {/* ສະຖານທີ (ວຽກນອກ) */}
        {c.location && (
          <section className={`rf-card ${tried && loc.trim().length < 2 ? 'err' : ''}`} ref={refs.loc}>
            <div className="rf-head"><span className="rf-head-ic"><Icon.pin /></span><b>ສະຖານທີ</b><i className="rf-req">ຈຳເປັນ</i></div>
            <input className="rf-input" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="ເຊັ່ນ: ທະນາຄານ BCEL, ນະຄອນຫຼວງວຽງຈັນ" />
            <div className="rf-chips" style={{ marginTop: 10 }}>
              {c.locChips.map((l) => (
                <button key={l} className={`rf-chip sm ${loc === l ? 'on' : ''}`} onClick={() => setLoc(l)}>{l}</button>
              ))}
            </div>
          </section>
        )}

        {/* ເຫດຜົນ */}
        <section className={`rf-card ${tried && reason.trim().length < 3 ? 'err' : ''}`} ref={refs.reason}>
          <div className="rf-head"><span className="rf-head-ic"><Icon.doc /></span><b>ເຫດຜົນ</b><i className="rf-req">ຈຳເປັນ</i>
            <span className="rf-count">{reason.length}/{MAX_REASON}</span></div>
          <textarea className="rf-input rf-ta" rows={3} maxLength={MAX_REASON} value={reason}
            onChange={(e) => setReason(e.target.value)} placeholder={c.reasonPh} />
          <div className="rf-chips" style={{ marginTop: 10 }}>
            {c.reasonChips.map((r) => (
              <button key={r} className={`rf-chip sm ${reason === r ? 'on' : ''}`} onClick={() => setReason(r)}>{r}</button>
            ))}
          </div>
        </section>

        {/* ໄຟລ໌ແນບ */}
        <section className="rf-card">
          <div className="rf-head"><span className="rf-head-ic"><Icon.clip /></span><b>ໄຟລ໌ແນບ</b><i className="rf-opt">ບໍ່ບັງຄັບ</i></div>
          <button className="rf-drop" onClick={() => fileRef.current?.click()}>
            <Icon.upload />
            <b>ແຕະເພື່ອແນບໄຟລ໌</b>
            <span>pdf, jpg, png, doc · ບໍ່ເກີນ 10 MB</span>
          </button>
          <input ref={fileRef} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.heic,.webp,.doc,.docx" onChange={pickFiles} />
          {files.length > 0 && (
            <div className="rf-files">
              {files.map((f, i) => (
                <div className="rf-file" key={i}>
                  {/* ແຕະທີ່ໄຟລ໌ → ເປີດເບິ່ງໄດ້ເລີຍ ຕັ້ງແຕ່ຢູ່ໃນຟອມ (ບໍ່ຕ້ອງລໍສົ່ງກ່ອນ) */}
                  <button className="rf-file-open" onClick={() => setPreview({ name: f.name, file: f.file })}>
                    {f.url ? <img src={f.url} alt="" /> : <span className="rf-file-ic"><Icon.doc /></span>}
                    <div><b>{f.name}</b><span>{(f.size / 1024).toFixed(0)} KB</span></div>
                    <Icon.eye />
                  </button>
                  <button className="icon-mini" title="ລຶບ" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}><Icon.x /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ສາຍອະນຸມັດ */}
        <section className="rf-card">
          <div className="rf-head"><span className="rf-head-ic"><Icon.checkCircle /></span><b>ສາຍອະນຸມັດ</b><i className="rf-opt">ອັດຕະໂນມັດ</i></div>
          <div className="rf-chain">
            {chain.map((p, i) => (
              <div className="rf-step" key={p.id}>
                <span className={`rf-step-n ${i === 0 ? 'first' : ''}`}>{i + 1}</span>
                <span className="rf-step-av">{initials(p.name)}</span>
                <div><b>{p.name}</b><span>{p.role}</span></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="rf-foot">
        {tried && !ok && <p className="rf-missing"><Icon.warn /> ຍັງຂາດ: {missing.map((m) => m.t).join(' · ')}</p>}
        <button className={`btn primary rf-submit ${ok ? '' : 'soft'}`} onClick={submit}><Icon.send /> ສົ່ງຄຳຂໍ</button>
      </div>

      {pick === 'type' && (
        <PickSheet label={c.typeLabel} options={c.types} value={type}
          onPick={(v) => { setType(v); setPick(null) }} onClose={() => setPick(null)} />
      )}
      {pick === 'project' && (
        <PickSheet label="ເລືອກໂຄງການ" options={PROJECTS.map((p) => p.name)} value={project}
          onPick={(v) => { setProject(v); setActivity(''); setTasks([]); setPick(null) }} onClose={() => setPick(null)} />
      )}
      {pick === 'activity' && (
        <PickSheet label="ເລືອກກິດຈະກຳ" options={activities.map((a) => a.name)} value={activity}
          onPick={(v) => { setActivity(v); setTasks([]); setPick(null) }} onClose={() => setPick(null)} />
      )}
      {pick === 'dayType' && (
        <PickSheet label="ເລືອກປະເພດວັນ" options={DAY_TYPES} value={dayType}
          onPick={(v) => { setDayType(v); setPick(null) }} onClose={() => setPick(null)} />
      )}
      {time && (
        <TimeSheet value={time === 'from' ? from : to} label={time === 'from' ? 'ເລືອກເວລາເລີ່ມ' : 'ເລືອກເວລາຈົບ'}
          onConfirm={(v) => { if (time === 'from') setFrom(v); else setTo(v); setTime(null) }}
          onClose={() => setTime(null)} />
      )}
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
      {cal && (
        <DateRangeSheet from={date} to={c.range ? dateTo : date} single={!c.range}
          onConfirm={(s, e) => { setDate(s); setDateTo(c.range ? e : s); setCal(false) }}
          onClose={() => setCal(false)} />
      )}
    </div>
  )
}
