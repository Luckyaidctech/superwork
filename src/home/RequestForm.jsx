import { useState } from 'react'
import { Icon } from '../flow/shared.jsx'

// ຫົວຂໍ້ໃຫ້ເລືອກ ຕາມແຕ່ລະປະເພດ (ໄວ + ບໍ່ຕ້ອງພິມເອງ)
const PRESET = {
  leave: { title: 'ຂໍລາພັກ', opts: ['ລາປ່ວຍ', 'ລາກິດ', 'ລາພັກປະຈຳປີ', 'ລາເບິ່ງແຍງຄອບຄົວ'], noteLabel: 'ເຫດຜົນ', notePh: 'ເຊັ່ນ: ວຽກສ່ວນຕົວ', from: '08:30', to: '17:30' },
  offsite: { title: 'ຂໍວຽກນອກສະຖານທີ', opts: ['ພົບລູກຄ້າ', 'ຕິດຕັ້ງລະບົບ ໜ້າງານ', 'ອົບຮົມ ນອກສະຖານທີ', 'ທົດສອບລະບົບ ໜ້າງານ'], noteLabel: 'ສະຖານທີ', notePh: 'ເຊັ່ນ: ທະນາຄານ BCEL', from: '08:00', to: '17:00' },
  ot: { title: 'ຂໍໂອທີ', opts: ['AIDC work', 'Dev super work', 'ແກ້ໄຂ ດ່ວນ', 'ທົດສອບລະບົບ'], noteLabel: 'ລາຍລະອຽດວຽກ', notePh: 'ເຊັ່ນ: ວຽກດ່ວນ ໃກ້ກຳນົດສົ່ງ', from: '17:30', to: '20:30' },
}

// ຄິດຊົ່ວໂມງ ຈາກ ເວລາເລີ່ມ-ຈົບ → '3h 0m'
const calcHours = (from, to) => {
  const [fh, fm] = from.split(':').map(Number)
  const [th, tm] = to.split(':').map(Number)
  let mins = (th * 60 + tm) - (fh * 60 + fm)
  if (mins < 0) mins += 24 * 60
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function RequestForm({ kind, onSubmit, onClose }) {
  const p = PRESET[kind]
  const [title, setTitle] = useState(p.opts[0])
  const [date, setDate] = useState('15/07/2026')
  const [from, setFrom] = useState(p.from)
  const [to, setTo] = useState(p.to)
  const [note, setNote] = useState('')
  const ok = title && date && note.trim().length >= 2

  const submit = () => {
    if (!ok) return
    onSubmit({ title, date, from, to, note: note.trim(), ...(kind === 'ot' ? { hours: calcHours(from, to) } : {}) })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><b><Icon.plus /> {p.title}</b><button className="icon-mini" onClick={onClose}><Icon.x /></button></div>
        <div className="req-form">
          <label className="req-f-label">ຫົວຂໍ້</label>
          <div className="req-opts">
            {p.opts.map((o) => (
              <button key={o} className={`req-opt ${title === o ? 'on' : ''}`} onClick={() => setTitle(o)}>{o}</button>
            ))}
          </div>

          <label className="req-f-label">ວັນທີ</label>
          <input className="title-input" value={date} onChange={(e) => setDate(e.target.value)} placeholder="ວວ/ດດ/ປປປປ" />

          <div className="req-f-row">
            <div>
              <label className="req-f-label">ເວລາເລີ່ມ</label>
              <input className="title-input" type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="req-f-label">ເວລາຈົບ</label>
              <input className="title-input" type="time" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          {kind === 'ot' && <p className="req-f-hint"><Icon.clock /> ລວມ {calcHours(from, to)}</p>}

          <label className="req-f-label">{p.noteLabel}</label>
          <textarea className="title-input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={p.notePh} />

          <div className="success-btns" style={{ marginTop: 16, maxWidth: 'none' }}>
            <button className="btn ghost" onClick={onClose}>ຍົກເລີກ</button>
            <button className={`btn primary ${ok ? '' : 'disabled'}`} disabled={!ok} onClick={submit}><Icon.send /> ສົ່ງຄຳຂໍ</button>
          </div>
        </div>
      </div>
    </div>
  )
}
