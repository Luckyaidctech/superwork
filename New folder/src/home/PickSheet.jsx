import { Icon } from '../flow/shared.jsx'

// ── ແຜ່ນເລືອກ (ແທນ <select> ຂອງ browser ທີ່ຄຸມຂະໜາດ/ຮູບແບບບໍ່ໄດ້) ──
export default function PickSheet({ label, options = [], value, onPick, onClose }) {
  return (
    <div className="modal-overlay dim" onClick={onClose}>
      <div className="ts" onClick={(e) => e.stopPropagation()}>
        <span className="drs-grip" />
        <div className="drs-head">
          <b>{label}</b>
          <button className="icon-mini" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="pk-list">
          {/* ຮັບໄດ້ທັງ string ແລະ { v, dot } (ຈຸດສີ ເຊັ່ນ ປະເພດວັນ) */}
          {options.map((raw) => {
            const o = typeof raw === 'string' ? { v: raw } : raw
            return (
              <button key={o.v} className={`pk-opt ${value === o.v ? 'on' : ''}`} onClick={() => onPick(o.v)}>
                {o.dot && <span className="pk-dot" style={{ '--d': o.dot }} />}
                <span className="pk-lb">{o.v}</span>
                {value === o.v && <Icon.check />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
