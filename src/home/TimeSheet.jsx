import { useState, useEffect, useRef } from 'react'
import { Icon } from '../flow/shared.jsx'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')) // 00 → 23 (ບໍ່ມີ AM/PM)
const MINS = ['00', '30'] // ນາທີ ມີແຕ່ 00 ກັບ 30

// ── ເລືອກເວລາ: ເລື່ອນເລືອກ "ຊົ່ວໂມງ" ກ່ອນ → ແລ້ວເລືອກ "ນາທີ" ──
export default function TimeSheet({ value = '08:30', label = 'ເລືອກເວລາ', onConfirm, onClose }) {
  const [h, m] = String(value).split(':')
  const [hour, setHour] = useState(HOURS.includes(h) ? h : '08')
  const [min, setMin] = useState(MINS.includes(m) ? m : '00')
  const hRef = useRef(null)

  // ເປີດມາ → ເລື່ອນຊົ່ວໂມງທີ່ເລືອກຢູ່ ໃຫ້ມາຢູ່ກາງ
  useEffect(() => {
    const el = hRef.current?.querySelector('.ts-opt.on')
    el?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="modal-overlay dim" onClick={onClose}>
      <div className="ts" onClick={(e) => e.stopPropagation()}>
        <span className="drs-grip" />
        <div className="drs-head">
          <b>{label}</b>
          <button className="icon-mini" onClick={onClose}><Icon.x /></button>
        </div>

        {/* ຄ່າທີ່ເລືອກ — ເຫັນຜົນທັນທີ */}
        <div className="ts-val">{hour}:{min}</div>

        <div className="ts-cols">
          <div className="ts-col">
            <p className="ts-col-lb">ຊົ່ວໂມງ</p>
            <div className="ts-list" ref={hRef}>
              {HOURS.map((x) => (
                <button key={x} className={`ts-opt ${hour === x ? 'on' : ''}`} onClick={() => setHour(x)}>{x}</button>
              ))}
            </div>
          </div>
          <div className="ts-col mins">
            <p className="ts-col-lb">ນາທີ</p>
            <div className="ts-list">
              {MINS.map((x) => (
                <button key={x} className={`ts-opt ${min === x ? 'on' : ''}`} onClick={() => setMin(x)}>{x}</button>
              ))}
            </div>
          </div>
        </div>

        <button className="btn primary drs-ok" onClick={() => onConfirm(`${hour}:${min}`)}><Icon.check /> ຢືນຢັນ</button>
      </div>
    </div>
  )
}
