import { useState } from 'react'
import { Icon, ResultPopup, ReasonModal } from '../flow/shared.jsx'
import { nameOf } from './data.js'
import RequestForm from './RequestForm.jsx'

// ── 3 ໝວດຫຼັກ (ຕາມແອັບ Super Work) ──
export const REQ_KINDS = [
  { key: 'leave', label: 'ລາພັກ', icon: Icon.umbrella, ic: 'leave' },
  { key: 'offsite', label: 'ວຽກນອກສະຖານທີ', icon: Icon.briefcase, ic: 'offsite' },
  { key: 'ot', label: 'ໂອທີ', icon: Icon.clock, ic: 'ot' },
]
const REQ_STATUS = {
  progress: { t: 'ລໍຖ້າອະນຸມັດ', c: 'wait' },
  approved: { t: 'ອະນຸມັດແລ້ວ', c: 'done' },
  rejected: { t: 'ປະຕິເສດ', c: 'rej' },
  cancelled: { t: 'ຍົກເລີກ', c: 'cancel' },
}

// ການ໌ດຄຳຂໍ — ໄອຄອນ + ຫົວຂໍ້ + ວັນທີ/ເວລາ + ໝາຍເຫດ + ສະຖານະ
function ReqCard({ r, kind, showBy, onOpen }) {
  const k = REQ_KINDS.find((x) => x.key === kind)
  const st = REQ_STATUS[r.status] || REQ_STATUS.progress
  return (
    <button className="req-card" onClick={() => onOpen(r)}>
      <span className={`req-card-ic ${k.ic}`}>{k.icon()}</span>
      <div className="req-card-body">
        <div className="req-card-top">
          <b>{r.title}</b>
          <span className={`req-badge ${st.c}`}>{st.t}</span>
        </div>
        <span className="req-card-when">
          <Icon.calendar /> {r.date}
          {r.from && <><Icon.clock /> {r.from} – {r.to}</>}
        </span>
        {kind === 'ot' ? (
          <div className="req-chips">
            {r.hours && <span className="req-chip hl"><Icon.clock /> {r.hours}</span>}
            <span className="req-chip"><Icon.checkCircle /> 1</span>
            <span className="req-chip"><Icon.user /> {nameOf(r.byId)}</span>
          </div>
        ) : (
          <span className="req-card-note">{showBy ? `${nameOf(r.byId)} · ${r.note}` : r.note}</span>
        )}
      </div>
      <Icon.chevron />
    </button>
  )
}

export default function RequestScreen({ me, director, reqs, onReqAction, onCreateReq, onCancelReq }) {
  const [kind, setKind] = useState('leave')
  const [sub, setSub] = useState('mine') // mine | pending  (ot: recent | history)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(false)
  const [rejMode, setRejMode] = useState(false)
  const [cancelMode, setCancelMode] = useState(false)
  const [popup, setPopup] = useState(null)

  const list = reqs[kind] || []
  const isOt = kind === 'ot'
  // ໂອທີ: ລ່າສຸດ (ຍັງບໍ່ຈົບ) / ປະຫວັດ · ອື່ນໆ: ຂອງຂ້ອຍ / ລໍຖ້າຂ້ອຍອະນຸມັດ
  const shown = isOt
    ? list.filter((r) => (sub === 'mine' ? r.status === 'progress' : r.status !== 'progress'))
    : list.filter((r) => (sub === 'mine' ? r.byId === me : r.byId !== me && r.status === 'progress'))
  const pendingCount = list.filter((r) => r.byId !== me && r.status === 'progress').length
  const SUBS = isOt
    ? [{ k: 'mine', t: 'ລ່າສຸດ' }, { k: 'pending', t: 'ປະຫວັດ' }]
    : [{ k: 'mine', t: 'ຄຳຂໍຂອງຂ້ອຍ' }, { k: 'pending', t: `ລໍຖ້າອະນຸມັດ${pendingCount ? ` (${pendingCount})` : ''}` }]

  const closeDetail = () => { setDetail(null); setRejMode(false); setCancelMode(false) }
  const doApprove = () => { onReqAction(kind, detail.id, 'approved'); setPopup({ msg: 'ອະນຸມັດຄຳຂໍສຳເລັດ!' }) }
  const doReject = (rsn) => { onReqAction(kind, detail.id, 'rejected', rsn); setRejMode(false); setPopup({ msg: 'ໄດ້ປະຕິເສດຄຳຂໍແລ້ວ', danger: true }) }
  const doCancel = (rsn) => { onCancelReq(kind, detail.id, rsn); setCancelMode(false); setPopup({ msg: 'ໄດ້ຍົກເລີກຄຳຂໍແລ້ວ', danger: true }) }

  // ── ໜ້າລາຍລະອຽດ ──
  if (detail) {
    const k = REQ_KINDS.find((x) => x.key === kind)
    const st = REQ_STATUS[detail.status] || REQ_STATUS.progress
    const mine = detail.byId === me
    const canAct = !mine && detail.status === 'progress'
    const canCancel = mine && detail.status === 'progress'
    return (
      <div className="ac-detail-screen">
        <div className="header"><button className="header-back" onClick={closeDetail}><Icon.back /></button><b>ລາຍລະອຽດຄຳຂໍ</b><span /></div>
        <div className="scroll">
          <div className="ac-detail">
            <div className="req-hero">
              <span className={`req-hero-ic ${k.ic}`}>{k.icon()}</span>
              <b>{detail.title}</b>
              <span className={`req-badge ${st.c}`}>{st.t}</span>
            </div>

            <div className="ptd-info">
              <div className="ptd-info-row"><span className="ptd-info-ic"><Icon.user /></span><div><em>ຜູ້ຂໍ</em><b>{nameOf(detail.byId)}</b></div></div>
              <div className="ptd-info-row"><span className="ptd-info-ic"><Icon.book /></span><div><em>ປະເພດ</em><b>{k.label}</b></div></div>
              <div className="ptd-info-row"><span className="ptd-info-ic"><Icon.calendar /></span><div><em>ວັນທີ</em><b>{detail.date}</b></div></div>
              {detail.from && <div className="ptd-info-row"><span className="ptd-info-ic"><Icon.clock /></span><div><em>ເວລາ</em><b>{detail.from} – {detail.to}{detail.hours ? ` · ${detail.hours}` : ''}</b></div></div>}
              <div className="ptd-info-row"><span className="ptd-info-ic"><Icon.info /></span><div><em>ໝາຍເຫດ</em><b>{detail.note}</b></div></div>
            </div>

            {detail.reason && (
              <p className={`dd-note ${detail.status === 'approved' ? '' : 'rej'}`}>
                <Icon.warn /> {detail.status === 'cancelled' ? 'ຍົກເລີກ' : 'ປະຕິເສດ'} — {detail.reason}
              </p>
            )}

            <div className="ptd-tl-card">
              <p className="ptd-card-label">ສະຖານະຄຳຂໍ</p>
              <div className="dd-audit">
                <div className="aud ok"><span className="aud-ic"><Icon.checkCircle /></span><div className="aud-body"><span className="aud-t">ສ້າງຄຳຂໍ</span><span className="aud-tm">{nameOf(detail.byId)} · {detail.date}</span></div></div>
                <div className={`aud ${detail.status === 'progress' ? 'now' : detail.status === 'approved' ? 'ok' : 'rej'}`}>
                  <span className="aud-ic">{detail.status === 'progress' ? <Icon.clock /> : detail.status === 'approved' ? <Icon.checkCircle /> : <Icon.warn />}</span>
                  <div className="aud-body"><span className="aud-t">{st.t}</span><span className="aud-tm">{nameOf(director)}</span></div>
                </div>
              </div>
            </div>

            {canAct ? (
              <div className="success-btns" style={{ marginTop: 16, maxWidth: 'none' }}>
                <button className="btn danger" onClick={() => setRejMode(true)}><Icon.x /> ປະຕິເສດ</button>
                <button className="btn primary" onClick={doApprove}><Icon.check /> ອະນຸມັດ</button>
              </div>
            ) : canCancel ? (
              <button className="btn danger" style={{ marginTop: 16, width: '100%' }} onClick={() => setCancelMode(true)}><Icon.x /> ຍົກເລີກຄຳຂໍ</button>
            ) : (
              <button className="btn ghost" style={{ marginTop: 14, width: '100%' }} onClick={closeDetail}>ປິດ</button>
            )}
          </div>
        </div>

        {rejMode && (
          <ReasonModal title="ປະຕິເສດຄຳຂໍ" hint="ກະລຸນາລະບຸເຫດຜົນ (ຜູ້ຂໍຈະໄດ້ຮັບການແຈ້ງເຕືອນ)"
            placeholder="ເຫດຜົນທີ່ປະຕິເສດ..." confirmLabel="ຢືນຢັນປະຕິເສດ" onConfirm={doReject} onClose={() => setRejMode(false)} />
        )}
        {cancelMode && (
          <ReasonModal title="ຍົກເລີກຄຳຂໍ" hint="ກະລຸນາລະບຸເຫດຜົນທີ່ຍົກເລີກ" placeholder="ເຫດຜົນ..."
            confirmLabel="ຢືນຢັນຍົກເລີກ" cancelLabel="ບໍ່ຍົກເລີກ" onConfirm={doCancel} onClose={() => setCancelMode(false)} />
        )}
        {popup && (
          <ResultPopup danger={!!popup.danger} title={popup.msg} desc="ລະບົບໄດ້ບັນທຶກ ແລະ ແຈ້ງເຕືອນຜູ້ກ່ຽວຂ້ອງແລ້ວ"
            onOk={() => { setPopup(null); closeDetail() }} />
        )}
      </div>
    )
  }

  // ── ໜ້າລາຍການ ──
  return (<>
    <div className="req-tabs">
      {REQ_KINDS.map((k) => (
        <button key={k.key} className={`req-tab ${kind === k.key ? 'on' : ''}`} onClick={() => { setKind(k.key); setSub('mine') }}>
          {k.icon()} <span>{k.label}</span>
        </button>
      ))}
    </div>
    <div className="req-subs">
      {SUBS.map((s) => (
        <button key={s.k} className={`req-sub ${sub === s.k ? 'on' : ''}`} onClick={() => setSub(s.k)}>{s.t}</button>
      ))}
    </div>
    <div className="req-list">
      {shown.length === 0
        ? <p className="empty-list">ຍັງບໍ່ມີຄຳຂໍ</p>
        : shown.map((r) => <ReqCard key={r.id} r={r} kind={kind} showBy={sub === 'pending' && !isOt} onOpen={setDetail} />)}
    </div>

    <button className="fab fab-float" onClick={() => setForm(true)}><Icon.plus /></button>
    {form && (
      <RequestForm kind={kind} onSubmit={(data) => { onCreateReq(kind, data); setForm(false); setSub('mine'); setPopup({ msg: 'ສົ່ງຄຳຂໍສຳເລັດ!' }) }} onClose={() => setForm(false)} />
    )}
    {popup && !detail && (
      <ResultPopup danger={!!popup.danger} title={popup.msg} desc="ລະບົບໄດ້ສົ່ງຄຳຂໍໄປລໍຖ້າອະນຸມັດແລ້ວ" onOk={() => setPopup(null)} />
    )}
  </>)
}
