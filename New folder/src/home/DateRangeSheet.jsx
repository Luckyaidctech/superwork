import { useState } from 'react'
import { Icon } from '../flow/shared.jsx'

const MONTHS = ['ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ', 'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ']
const MONTHS_SHORT = ['ມ.ກ.', 'ກ.ພ.', 'ມີ.ນ.', 'ເມ.ສ.', 'ພ.ພ.', 'ມິ.ຖ.', 'ກ.ລ.', 'ສ.ຫ.', 'ກ.ຍ.', 'ຕ.ລ.', 'ພ.ຈ.', 'ທ.ວ.']
const DOW = ['ອາ', 'ຈ', 'ອ', 'ພ', 'ພຫ', 'ສຸ', 'ສ'] // ອາທິດ → ເສົາ

// dd/mm/yyyy ↔ Date
const toDate = (s) => { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d) }
const toStr = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
const fmt = (s) => { const d = toDate(s); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}` }
const sameDay = (a, b) => a.getTime() === b.getTime()
const dayCount = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5) + 1

export default function DateRangeSheet({ from, to, single = false, onConfirm, onClose }) {
  const [start, setStart] = useState(from)
  const [end, setEnd] = useState(single ? from : to)
  const [picking, setPicking] = useState('start') // start | end
  const [view, setView] = useState(() => { const d = toDate(from); return { y: d.getFullYear(), m: d.getMonth() } })

  // ── ຕາຕະລາງມື້ຂອງເດືອນທີ່ເບິ່ງຢູ່ (ຊ່ອງຫວ່າງນຳໜ້າ ຕາມວັນໃນອາທິດ) ──
  const first = new Date(view.y, view.m, 1)
  const total = new Date(view.y, view.m + 1, 0).getDate()
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: total }, (_, i) => new Date(view.y, view.m, i + 1))]

  const sD = toDate(start), eD = toDate(end)
  const pick = (d) => {
    const s = toStr(d)
    if (single) { setStart(s); setEnd(s); return }
    if (picking === 'start') {
      setStart(s)
      if (toDate(s) > eD) setEnd(s) // ຍ້າຍວັນສຸດທ້າຍຕາມ ຖ້າຕິດລົບ
      setPicking('end')
    } else {
      if (d < sD) { setStart(s); setEnd(start) } // ເລືອກຍ້ອນຫຼັງ → ສະຫຼັບໃຫ້
      else setEnd(s)
      setPicking('start')
    }
  }
  const shift = (n) => setView((v) => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })

  return (
    <div className="modal-overlay dim" onClick={onClose}>
      <div className="drs" onClick={(e) => e.stopPropagation()}>
        <span className="drs-grip" />
        <div className="drs-head">
          <b>{single ? 'ເລືອກວັນທີ' : 'ເລືອກຊ່ວງວັນທີ'}</b>
          <button className="icon-mini" onClick={onClose}><Icon.x /></button>
        </div>

        {/* ຊ່ອງ ເລີ່ມ → ສຸດທ້າຍ (ແຕະເພື່ອສະຫຼັບວ່າກຳລັງເລືອກອັນໃດ) */}
        <div className="drs-fields">
          <button className={`drs-field ${picking === 'start' ? 'on' : ''}`} onClick={() => setPicking('start')}>
            <em>{single ? 'ວັນທີ' : 'ວັນທີເລີ່ມ'}</em><b>{fmt(start)}</b>
          </button>
          {!single && (<>
            <span className="drs-arrow"><Icon.chevron /></span>
            <button className={`drs-field ${picking === 'end' ? 'on' : ''}`} onClick={() => setPicking('end')}>
              <em>ວັນທີສຸດທ້າຍ</em><b>{fmt(end)}</b>
            </button>
          </>)}
        </div>
        {!single && <p className="drs-days">{dayCount(start, end)} ມື້</p>}

        {/* ເດືອນ */}
        <div className="drs-nav">
          <button className="icon-mini" onClick={() => shift(-1)}><Icon.back /></button>
          <b>{MONTHS[view.m]} {view.y}</b>
          <button className="icon-mini flip" onClick={() => shift(1)}><Icon.back /></button>
        </div>

        <div className="drs-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="drs-grid">
          {cells.map((d, i) => {
            if (!d) return <span key={i} className="drs-cell empty" />
            const isS = sameDay(d, sD), isE = sameDay(d, eD)
            const inRange = !single && d > sD && d < eD
            return (
              <button key={i} className={`drs-cell ${isS ? 's' : ''} ${isE ? 'e' : ''} ${inRange ? 'in' : ''}`} onClick={() => pick(d)}>
                <span>{d.getDate()}</span>
              </button>
            )
          })}
        </div>

        <button className="btn primary drs-ok" onClick={() => onConfirm(start, end)}><Icon.check /> ຢືນຢັນ</button>
      </div>
    </div>
  )
}
