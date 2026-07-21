import { useState, useEffect } from 'react'
import { Icon, Header, ResultPopup, ReasonModal, initials, ScreenPortal } from '../flow/shared.jsx'
import { nameOf, colorOf, avatarOf, approvalChain, approvedCount, currentApprover, reqTime, fmtRange, sortPendingFirst } from './data.js'

// avatar: ຮູບໂປຣໄຟລ໌ (ຖ້າມີ) ຫຼື ສີພື້ນ + ຕົວຫຍໍ້
const avBg = (id) => { const u = avatarOf(id); return u ? { backgroundImage: `url("${u}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: colorOf(id) } }
import ReqForm from './ReqForm.jsx'
import CommentBox from './CommentBox.jsx'
import FilePreviewModal from '../flow/FilePreviewModal.jsx'

// ── ຂໍ້ມູນທຸກໝວດຄຳຂໍ (ໃຊ້ຮ່ວມ 2 ໂມດູນ: ຄຳຂໍ ແລະ ການອະນຸມັດ) ──
export const KIND_META = {
  leave: { label: 'ລາພັກ', icon: Icon.umbrella, ic: 'leave' },
  offsite: { label: 'ວຽກນອກສະຖານທີ', icon: Icon.briefcase, ic: 'offsite' },
  ot: { label: 'ໂອທີ', icon: Icon.clock, ic: 'ot' },
  booking: { label: 'ການຈອງ', icon: Icon.calCheck, ic: 'booking' },
  knowledge: { label: 'ຄວາມຮູ້', icon: Icon.bulb, ic: 'knowledge' },
}
// 3 ໝວດຫຼັກ ໃນ tab ຂອງໂมດູນ "ຄຳຂໍ" (ຕາມແອັບ Super Work)
export const REQ_KINDS = ['leave', 'offsite', 'ot'].map((k) => ({ key: k, ...KIND_META[k] }))
const REQ_STATUS = {
  progress: { t: 'ລໍຖ້າອະນຸມັດ', c: 'wait' },
  approved: { t: 'ອະນຸມັດແລ້ວ', c: 'done' },
  rejected: { t: 'ປະຕິເສດ', c: 'rej' },
  cancelled: { t: 'ຍົກເລີກ', c: 'cancel' },
}

// ── ການ໌ດຄຳຂໍ — ໂຄງດຽວກັນທັງ 3 ໝວດ, ຕ່າງກັນແຕ່ chip ສະເພາະໝວດ ──
// ລາພັກ: ຈຳນວນມື້ + ຊົ່ວໂມງ · ວຽກນອກ: ສະຖານທີ + ຊົ່ວໂມງ · ໂອທີ: ຊົ່ວໂມງ
export function ReqCard({ r, kind, showBy, accent, kindLabel, onOpen }) {
  const k = KIND_META[kind] || KIND_META.leave
  const st = REQ_STATUS[r.status] || REQ_STATUS.progress
  const t = reqTime(r)
  return (
    <button className="req-card" style={accent ? { borderLeft: `4px solid ${accent[0]}`, background: accent[1] } : undefined} onClick={() => onOpen(r)}>
      <span className={`req-card-ic ${k.ic}`}>{k.icon()}</span>
      <div className="req-card-body">
        <div className="req-card-top">
          <b>{r.title}</b>
          <span className={`req-badge ${st.c}`}>{st.t}</span>
        </div>
        <span className="req-card-when">
          <Icon.calendar /> {fmtRange(r.date, t.days > 1 ? r.dateTo : null)}
          {r.from && <><Icon.clock /> {r.from} – {r.to}</>}
        </span>
        <div className="req-chips">
          {kindLabel && <span className="req-chip" style={accent ? { color: accent[0], background: '#fff' } : undefined}>{kindLabel}</span>}
          {kind === 'leave' && t.days > 1 && <span className="req-chip hl"><Icon.calendar /> {t.days} ມື້</span>}
          {kind === 'offsite' && r.note && <span className="req-chip"><Icon.pin /> {r.note}</span>}
          {t.totalText && <span className="req-chip hl"><Icon.clock /> {t.totalText}</span>}
          {r.files?.length > 0 && <span className="req-chip"><Icon.clip /> {r.files.length}</span>}
        </div>
        {showBy && (
          <span className="req-card-by">
            <span className="req-card-av" style={avBg(r.byId)}>{!avatarOf(r.byId) && initials(nameOf(r.byId))}</span>
            <b>{nameOf(r.byId)}</b>
          </span>
        )}
      </div>
      <Icon.chevron />
    </button>
  )
}

// ── ປະຫວັດກິດຈະກຳ (Lucky 19/07): ຍ້າຍໄປປຸ່ມ (i) ເທິງ header ແລ້ວ ──
export function ReqActivityHistory ({ req, chain = [], createLabel = 'ສ້າງຄຳຂໍ', onClose }) {
  const by = req.byId || req.by
  const hist = req.history || []
  const histOf = (type, nth = 0) => hist.filter((h) => h.type === type)[nth]
  const okCount = req.status === 'approved' ? (chain.length || approvedCount(req)) : approvedCount(req)
  const ev = [{ ic: Icon.doc, t: `${createLabel} ໂດຍ ${nameOf(by)}`, tm: req.createdAt || req.date, ok: true }]
  if (req.status === 'draft') {
    ev.push({ ic: Icon.clock, t: 'ຍັງເປັນຮ່າງ — ຍັງບໍ່ໄດ້ສົ່ງກວດສອບ', tm: '' })
  } else {
    const sub = histOf('submitted')
    if (sub) ev.push({ ic: Icon.send, t: `ສົ່ງກວດສອບ ໂດຍ ${nameOf(sub.by)}`, tm: sub.time, ok: true })
    chain.slice(0, okCount).forEach((p, i) => {
      const who = (req.approvedBy || [])[i]
      ev.push({ ic: Icon.checkCircle, t: `${who ? nameOf(who) : p.name} ອະນຸມັດແລ້ວ`, tm: histOf('approved', i)?.time || req.date, ok: true })
    })
    if (req.status === 'rejected') {
      const h = histOf('rejected')
      ev.push({ ic: Icon.warn, t: `${h ? nameOf(h.by) : chain[okCount]?.name || 'ຜູ້ອະນຸມັດ'} ປະຕີເສດ${req.reason ? ` — ${req.reason}` : ''}`, tm: h?.time || req.date, rej: true })
    } else if (req.status === 'cancelled') {
      const h = histOf('cancelled')
      ev.push({ ic: Icon.warn, t: `${nameOf(h?.by || by)} ຍົກເລີກຄຳຂໍ${req.reason ? ` — ${req.reason}` : ''}`, tm: h?.time || req.date, rej: true })
    } else if (req.status === 'progress' && chain[okCount]) {
      ev.push({ ic: Icon.clock, t: `ລໍຖ້າ ${chain[okCount].name} ອະນຸມັດ`, tm: 'ຕອນນີ້', now: true })
    }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><b><Icon.info /> ປະຫວັດກິດຈະກຳ</b><button className="icon-mini" onClick={onClose}><Icon.x /></button></div>
        <div className="dd-audit" style={{ padding: '16px 18px 22px' }}>
          {ev.map((e, i) => (
            <div className={`aud ${e.ok ? 'ok' : e.rej ? 'rej' : e.now ? 'now' : ''}`} key={i}>
              <span className="aud-ic"><e.ic /></span>
              <div className="aud-body"><span className="aud-t">{e.t}</span>{e.tm && <span className="aud-tm">{e.tm}</span>}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RequestDetailBody({ req, kind, me, onPreview, onComment, onEditComment, onDeleteComment }) {
  const k = KIND_META[kind] || KIND_META.leave
  const st = REQ_STATUS[req.status] || REQ_STATUS.progress
  const chain = approvalChain(req.byId, kind)
  const dt = reqTime(req)
  const dateText = dt.days > 1 ? `${req.date} – ${req.dateTo} · ${dt.days} ມື້` : req.date
  return (<>
    <div className="req-hero">
      <span className={`req-hero-ic ${k.ic}`}>{k.icon()}</span>
      <b>{req.title}</b>
      <span className={`req-badge ${st.c}`}>{st.t}</span>
    </div>

    <div className="ptd-info">
      <div className="ptd-info-row">
        <span className="ptd-info-av" style={avBg(req.byId)}>{!avatarOf(req.byId) && initials(nameOf(req.byId))}</span>
        <div className="ptd-info-txt"><span>ຜູ້ຂໍ</span><b>{nameOf(req.byId)}</b></div>
      </div>
      {kind !== 'ot' && (
        <div className="ptd-info-row">
          <span className="ptd-info-ic"><Icon.book /></span>
          <div className="ptd-info-txt"><span>ປະເພດ</span><b>{k.label}</b></div>
        </div>
      )}
      <div className="ptd-info-row">
        <span className="ptd-info-ic"><Icon.calendar /></span>
        <div className="ptd-info-txt"><span>ວັນທີ</span><b>{dateText}</b></div>
      </div>
      {req.from && (
        <div className="ptd-info-row">
          <span className="ptd-info-ic"><Icon.clock /></span>
          <div className="ptd-info-txt"><span>ເວລາ</span><b>{req.from} – {req.to}</b></div>
          {dt.totalText && <span className="req-chip hl"><Icon.clock /> {dt.totalText}</span>}
        </div>
      )}
      {req.dayType && (
        <div className="ptd-info-row">
          <span className="ptd-info-ic"><Icon.calCheck /></span>
          <div className="ptd-info-txt"><span>ປະເພດວັນ</span><b>{req.dayType}</b></div>
        </div>
      )}
      {req.note && (
        <div className="ptd-info-row">
          <span className="ptd-info-ic">{kind === 'offsite' ? <Icon.pin /> : <Icon.info />}</span>
          <div className="ptd-info-txt"><span>{kind === 'offsite' ? 'ສະຖານທີ' : 'ເຫດຜົນ'}</span><b>{req.note}</b></div>
        </div>
      )}
      {req.detail && (
        <div className="ptd-info-row">
          <span className="ptd-info-ic"><Icon.info /></span>
          <div className="ptd-info-txt"><span>ລາຍລະອຽດ</span><b>{req.detail}</b></div>
        </div>
      )}
    </div>

    {(req.activity || req.tasks?.length > 0) && (
      <div className="ptd-tl-card">
        <p className="ptd-card-label"><Icon.layers /> ວຽກ</p>
        <div className="ptd-info" style={{ margin: '0 0 10px', border: 'none' }}>
          <div className="ptd-info-row">
            <span className="ptd-info-ic"><Icon.layers /></span>
            <div className="ptd-info-txt"><span>ໂຄງການ</span><b>{req.title}</b></div>
          </div>
          {req.activity && (
            <div className="ptd-info-row">
              <span className="ptd-info-ic"><Icon.chart /></span>
              <div className="ptd-info-txt"><span>ກິດຈະກຳ</span><b>{req.activity}</b></div>
            </div>
          )}
        </div>
        {req.tasks?.length > 0 && (<>
          <p className="ptd-card-label" style={{ marginBottom: 7 }}>ໜ້າວຽກ ({req.tasks.length})</p>
          <div className="ptd-tasklist">
            {req.tasks.map((t, i) => (
              <div className="ptd-task-row" key={t}>
                <span className="ptd-task-n">{i + 1}</span>
                <b>{t}</b>
                <Icon.check />
              </div>
            ))}
          </div>
        </>)}
      </div>
    )}

    {req.reason && (
      <p className={`dd-note ${req.status === 'approved' ? '' : 'rej'}`}>
        <Icon.warn /> {req.status === 'cancelled' ? 'ຍົກເລີກ' : 'ປະຕິເສດ'} — {req.reason}
      </p>
    )}

    {req.files?.length > 0 && (
      <div className="ptd-tl-card">
        <p className="ptd-card-label">ໄຟລ໌ແນບ ({req.files.length})</p>
        <div className="rf-files">
          {req.files.map((f, i) => (
            <button className="rf-file tap" key={i} onClick={() => onPreview?.({ name: f.name, file: f.file })}>
              {f.url ? <img src={f.url} alt="" /> : <span className="rf-file-ic"><Icon.doc /></span>}
              <div><b>{f.name}</b><span>{(f.size / 1024).toFixed(0)} KB</span></div>
              <Icon.eye />
            </button>
          ))}
        </div>
      </div>
    )}

    <div className="ptd-tl-card">
      <p className="ptd-card-label">ສະຖານະຄຳຂໍ</p>
      <div className="dd-audit">
        <div className="aud ok">
          <span className="aud-ic"><Icon.checkCircle /></span>
          <div className="aud-body"><span className="aud-t">ສ້າງຄຳຂໍ</span><span className="aud-tm">{nameOf(req.byId)} · {req.createdAt || req.date}</span></div>
        </div>
        {chain.map((p, i) => {
          const okCount = req.status === 'approved' ? chain.length : approvedCount(req)
          const cls = i < okCount ? 'ok'
            : req.status === 'rejected' || req.status === 'cancelled' ? (i === okCount ? 'rej' : '')
              : req.status === 'progress' && i === okCount ? 'now' : ''
          const label = i < okCount || req.status === 'approved' ? 'ອະນຸມັດແລ້ວ'
            : req.status === 'rejected' ? (i === okCount ? 'ປະຕິເສດ' : 'ບໍ່ໄດ້ດຳເນີນການ')
              : req.status === 'cancelled' ? (i === okCount ? 'ຍົກເລີກແລ້ວ' : 'ບໍ່ໄດ້ດຳເນີນການ')
                : i === okCount ? 'ລໍຖ້າອະນຸມັດ' : 'ລໍຖ້າຄິວກ່ອນໜ້າ'
          return (
            <div className={`aud ${cls}`} key={p.id}>
              <span className="aud-ic">{cls === 'ok' ? <Icon.checkCircle /> : cls === 'rej' ? <Icon.warn /> : <Icon.clock />}</span>
              <div className="aud-body">
                <span className="aud-t">{i + 1}. {p.role} — {label}</span>
                <span className="aud-tm">{p.name}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>

    {onComment && (
      <CommentBox
        comments={req.comments || []} me={me}
        useFullDirectory
        locked={req.status !== 'progress'}
        lockedMsg={req.status === 'approved' ? 'ຄຳຂໍນີ້ອະນຸມັດແລ້ວ' : req.status === 'rejected' ? 'ຄຳຂໍນີ້ຖືກປະຕິເສດ' : 'ຄຳຂໍນີ້ຖືກຍົກເລີກ'}
        onAdd={(t, parentId, mentions) => onComment(kind, req.id, t, parentId, mentions)}
        onEdit={(cid, t) => onEditComment(kind, req.id, cid, t)}
        onDelete={(cid) => onDeleteComment(kind, req.id, cid)}
      />
    )}
  </>)
}

export default function RequestScreen({ me, director, reqs, onReqAction, onCreateReq, onCancelReq, onReqComment, onReqEditComment, onReqDeleteComment, openReq, onConsumeOpenReq }) {
  const [kind, setKind] = useState('leave')
  const [sf, setSf] = useState('all')
  const [detail, setDetail] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState(false)
  const [rejMode, setRejMode] = useState(false)
  const [cancelMode, setCancelMode] = useState(false)
  const [popup, setPopup] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  const list = (reqs[kind] || []).filter((r) => r.byId === me)
  const shown = sortPendingFirst(list.filter((r) => sf === 'all' || r.status === sf))
  const SF = [
    { k: 'all', t: 'ທັງໝົດ' }, { k: 'progress', t: 'ລໍຖ້າ' }, { k: 'approved', t: 'ອະນຸมັດແລ້ວ' },
    { k: 'rejected', t: 'ປະຕິເສດ' }, { k: 'cancelled', t: 'ຍົກເລີກ' },
  ]

  useEffect(() => {
    if (!openReq || openReq.kind === 'knowledge' || openReq.kind === 'points') return
    const r = (reqs[openReq.kind] || []).find((x) => x.id === openReq.id)
    if (r) { setKind(openReq.kind); setSf('all'); setDetail(r) }
    onConsumeOpenReq?.()
  }, [openReq])

  const closeDetail = () => { setDetail(null); setRejMode(false); setCancelMode(false); setShowHistory(false) }
  const doApprove = () => { onReqAction(kind, detail.id, 'approved'); setPopup({ msg: 'ອະນຸມັດຄຳຂໍສຳເລັດ!' }) }
  const doReject = (rsn) => { onReqAction(kind, detail.id, 'rejected', rsn); setRejMode(false); setPopup({ msg: 'ໄດ້ປະຕິເສດຄຳຂໍແລ້ວ', danger: true }) }
  const doCancel = (rsn) => { onCancelReq(kind, detail.id, rsn); setCancelMode(false); setPopup({ msg: 'ໄດ້ຍົກເລີກຄຳຂໍແລ้ວ', danger: true }) }
  const submitForm = (data) => { onCreateReq(kind, data); setForm(false); setSf('all'); setPopup({ msg: 'ສົ່ງຄຳຂໍສຳເລັດ!' }) }

  if (detail) {
    const live = (reqs[kind] || []).find((r) => r.id === detail.id) || detail
    const mine = live.byId === me
    const chain = approvalChain(live.byId, kind)
    const turn = currentApprover(live, kind)
    const canAct = !mine && live.status === 'progress' && turn?.id === me
    const canCancel = mine && live.status === 'progress'
    return (
      <ScreenPortal>
      <div className="ac-detail-screen">
        <Header 
          title="ລາຍລະອຽດຄຳຂໍ" 
          onBack={closeDetail} 
          rightElement={
            <button className="icon-mini" onClick={() => setShowHistory(true)}>
              <Icon.info />
            </button>
          }
        />
        <div className="scroll">
          <div className="ac-detail">
            <RequestDetailBody req={live} kind={kind} me={me} onPreview={setPreview}
              onComment={onReqComment} onEditComment={onReqEditComment} onDeleteComment={onReqDeleteComment} />
          </div>
        </div>

        <div className="rf-foot">
          {canAct ? (
            <div className="success-btns" style={{ maxWidth: 'none' }}>
              <button className="btn danger" onClick={() => setRejMode(true)}><Icon.x /> ປະຕິເສດ</button>
              <button className="btn primary" onClick={doApprove}><Icon.check /> ອະນຸມັດ</button>
            </div>
          ) : canCancel ? (
            <button className="btn danger" style={{ width: '100%' }} onClick={() => setCancelMode(true)}><Icon.x /> ຍົກເລີກຄຳຂໍ</button>
          ) : (<>
            {!mine && live.status === 'progress' && turn && (
              <p className="rf-turnnote"><Icon.clock /> ຮອດຮອບຂອງ {turn.name} ({turn.role})</p>
            )}
            <button className="btn ghost" style={{ width: '100%' }} onClick={closeDetail}>ປິດ</button>
          </>)}
        </div>

        {showHistory && (
          <ReqActivityHistory req={live} chain={chain} onClose={() => setShowHistory(false)} />
        )}
        {rejMode && (
          <ReasonModal title="ປະຕິເສດຄຳຂໍ" hint="ກະລຸນາລະບຸເຫດຜົນ (ຜູ້ຂໍຈະໄດ້ຮັບການແຈ້ງເຕືອນ)"
            placeholder="ເຫดຜົນທີ່ປະຕິເສດ..." confirmLabel="ຢືນຢັນປະຕิເສດ" onConfirm={doReject} onClose={() => setRejMode(false)} />
        )}
        {cancelMode && (
          <ReasonModal title="ຍົກເລີກຄຳຂໍ" hint="ກະລຸນາລະບຸເຫດຜົນທີ່ຍົກເລີກ" placeholder="ເຫດຜົນ..."
            confirmLabel="ຢືນຢັນຍົກເລີກ" cancelLabel="ບໍ່ຍົກເລີກ" onConfirm={doCancel} onClose={() => setCancelMode(false)} />
        )}
        {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
        {popup && (
          <ResultPopup danger={!!popup.danger} title={popup.msg} desc="ລະບົບໄດ້ບັນທຶກ ແລະ ແຈ້ງເຕືອນຜູ້ກ່ຽວຂ້ອງແລ້ວ"
            onOk={() => { setPopup(null); closeDetail() }} />
        )}
      </div>
      </ScreenPortal>
    )
  }

  return (<>
    <div className="req-tabs">
      {REQ_KINDS.map((k) => (
        <button key={k.key} className={`req-tab ${kind === k.key ? 'on' : ''}`} onClick={() => { setKind(k.key); setSf('all') }}>
          {k.icon()} <span>{k.label}</span>
        </button>
      ))}
    </div>
    <div className="req-sf">
      {SF.map((s) => (
        <button key={s.k} className={`req-sf-chip ${sf === s.k ? 'on' : ''}`} onClick={() => setSf(s.k)}>{s.t}</button>
      ))}
    </div>
    <div className="req-list">
      {shown.length === 0
        ? <p className="empty-list">ຍັງບໍ່ມີຄຳຂໍ</p>
        : shown.map((r) => <ReqCard key={r.id} r={r} kind={kind} onOpen={setDetail} />)}
    </div>

    <ScreenPortal><button className="fab fab-float" onClick={() => setForm(true)}><Icon.plus /></button></ScreenPortal>
    {form && <ReqForm kind={kind} me={me} onSubmit={submitForm} onClose={() => setForm(false)} />}
    {popup && !detail && (
      <ScreenPortal>
        <ResultPopup danger={!!popup.danger} title={popup.msg} desc="ລະບົບໄດ້ສົ່ງຄຳຂໍໄປລໍຖ້າອະນຸມັດແລ້ວ" onOk={() => setPopup(null)} />
      </ScreenPortal>
    )}
  </>)
}