import { useState } from 'react'
import { Icon, Header } from './shared.jsx'
import SignaturePad from './SignaturePad.jsx'

// ໜ້າ ຕັ້ງຄ່າ: ບັນທຶກລາຍເຊັນ + ເປີດ Face ID
export default function Settings({ mySig, bio, onSaveSig, onDeleteSig, onToggleBio, canManageFlow, onOpenFlowSettings, onBack }) {
  const [drawn, setDrawn] = useState(null)
  const [redraw, setRedraw] = useState(!mySig)

  return (
    <div className="app">
      <Header title="ຕັ້ງຄ່າ" onBack={onBack} />
      <div className="scroll">
        {/* ລາຍເຊັນ */}
        <div className="card">
          <p className="dd-section"><Icon.pen /> ລາຍເຊັນຂອງຂ້ອຍ</p>
          {mySig && !redraw ? (
            <>
              <div className="set-sig-box"><img src={mySig} alt="signature" /></div>
              <div className="success-btns" style={{ maxWidth: 'none' }}>
                <button className="btn ghost" onClick={() => setRedraw(true)}><Icon.pen /> ແກ້ໄຂ</button>
                <button className="btn danger-ghost" onClick={() => { onDeleteSig(); setRedraw(true); setDrawn(null) }}><Icon.trash /> ລຶບ</button>
              </div>
            </>
          ) : (
            <>
              <p className="muted" style={{ fontSize: 12.5, margin: '0 0 8px' }}>ວາດລາຍເຊັນ ແລ້ວກົດບັນທຶກ — ຈະຖືກນຳໃຊ້ຕອນລົງນາມ (ວາງອັດຕະໂນມັດ)</p>
              <SignaturePad onChange={setDrawn} />
              <div className="success-btns" style={{ marginTop: 12, maxWidth: 'none' }}>
                {mySig && <button className="btn ghost" onClick={() => { setRedraw(false); setDrawn(null) }}>ຍົກເລີກ</button>}
                <button className={`btn primary ${!drawn ? 'disabled' : ''}`} onClick={() => { if (drawn) { onSaveSig(drawn); setRedraw(false) } }}><Icon.check /> ບັນທຶກລາຍເຊັນ</button>
              </div>
            </>
          )}
        </div>

        {/* ຄວາມປອດໄພ / biometric — toggle ດຽວ */}
        <div className="card">
          <p className="dd-section"><Icon.shield /> ຄວາມປອດໄພ (ຢືນຢັນຕອນລົງນາມ)</p>
          <div className="set-row">
            <div className="set-row-info"><b><Icon.shield /> Face ID / ລາຍນິ້ວມື</b><span>ໃຊ້ Face ID ຫຼື ລາຍນິ້ວມື ຢືນຢັນຕອນລົງນາມ</span></div>
            <button className={`toggle ${bio ? 'on' : ''}`} onClick={onToggleBio}><span className="toggle-dot" /></button>
          </div>
        </div>

        {/* Tab 6 (E7/E8/E10) — ສາຍອະນຸມັດ, ເຫັນສະເພາະ VP/Super Admin */}
        {canManageFlow && (
          <div className="card">
            <p className="dd-section"><Icon.layers /> ບໍລິຫານລະບົບ</p>
            <button className="set-row set-row-link" onClick={onOpenFlowSettings}>
              <div className="set-row-info"><b><Icon.shield /> ຕັ້ງຄ່າສາຍອະນຸມັດ</b><span>ກຳນົດ/ແກ້ໄຂຜູ້ອະນຸມັດແຕ່ລະຂັ້ນ ຕໍ່ປະເພດເອກະສານຍ່ອຍ</span></div>
              <Icon.chevron />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
