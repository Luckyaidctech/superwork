import { useState, useRef, useMemo } from 'react'
import {
  Icon, MAX_TITLE, sanitizeTitle, uid, DIRECTORY, normalizeSteps,
  isOrdered, ROLE_LABEL, RANK_TITLE, directorySections, Header, Stepper, SectionHead, FileList, LoadingRow, initials, signerColor,
} from './shared.jsx'
import FilePreviewModal from './FilePreviewModal.jsx'
import AiSummary from './AiSummary.jsx'

// ─────────────── Directory picker (ໂຄງສ້າງອົງກອນ + sticky headers) ───────────────
function DirectoryPicker({ open, onClose, signers, onAdd, me }) {
  const [q, setQ] = useState('')
  if (!open) return null
  const added = new Map(signers.map((s) => [s.id, s.role]))
  const sections = directorySections(me, q)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b><Icon.book /> ເລືອກຈາກລາຍຊື່</b>
          <button className="icon-mini" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-search">
          <Icon.search />
          <input placeholder="ຄົ້ນຫາຊື່ ຫຼື ອີເມວ..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="modal-list">
          {sections.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>ບໍ່ພົບຊື່</p>}
          {sections.map((sec) => (
            <div className="dir-sec" key={sec.key}>
              <p className="dir-sec-head">{sec.label}<span>{sec.people.length}</span></p>
              {sec.people.map((p) => {
                const role = added.get(p.id)
                return (
                  <div className="dir-row" key={p.id}>
                    <div className={`dir-avatar rk-${p.rank}`}>{initials(p.name)}</div>
                    <div className="dir-info">
                      <b>{p.name}{p.id === me && <span className="me-tag">ຕົວຂ້ອຍ</span>}</b>
                      <span>{RANK_TITLE[p.rank]} · {p.email}</span>
                    </div>
                    {role ? (
                      <span className={`role-tag ${role}`}>{ROLE_LABEL[role]} <Icon.check /></span>
                    ) : (
                      <div className="dir-actions">
                        <button className="pick-btn signer" onClick={() => onAdd(p, 'signer')}>ລົງນາມ</button>
                        <button className="pick-btn approver" onClick={() => onAdd(p, 'approver')}>ອະນຸມັດ</button>
                        <button className="pick-btn cc" onClick={() => onAdd(p, 'cc')}>CC</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────── inline role segmented control ───────────────
function RoleSeg({ role, onChange }) {
  return (
    <div className="seg">
      <button className={`seg-btn ${role === 'signer' ? 'on signer' : ''}`} onClick={() => onChange('signer')}>ລົງນາມ</button>
      <button className={`seg-btn ${role === 'approver' ? 'on approver' : ''}`} onClick={() => onChange('approver')}>ອະນຸມັດ</button>
      <button className={`seg-btn ${role === 'cc' ? 'on cc' : ''}`} onClick={() => onChange('cc')}>CC</button>
    </div>
  )
}

export default function Step1Input({ store, me = 'A', onNext, onBack }) {
  const {
    title, setTitle, pdfs, setPdfs, attachments, setAttachments, signers, setSigners,
  } = store

  const [titleCleaned, setTitleCleaned] = useState(false)
  const [loading, setLoading] = useState({ pdf: false, attach: false })
  const [showErrors, setShowErrors] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [dragId, setDragId] = useState(null)

  const pdfInput = useRef(null)
  const attachInput = useRef(null)
  const cardRef = useRef({})

  const signatories = signers.filter((s) => isOrdered(s.role))
  const docSigners = signers.filter((s) => s.role === 'signer')
  const ccList = signers.filter((s) => s.role === 'cc')

  const valid = useMemo(() => ({
    title: title.trim().length > 0,
    pdf: pdfs.length > 0,
    signer: signatories.length > 0,
  }), [title, pdfs, signatories.length])
  const canNext = valid.title && valid.pdf && valid.signer

  const onTitleChange = (raw) => {
    const { cleaned, changed } = sanitizeTitle(raw)
    setTitle(cleaned); setTitleCleaned(changed)
  }

  const pickFiles = (fileList, kind) => {
    const arr = Array.from(fileList || [])
    if (!arr.length) return
    const key = kind === 'pdf' ? 'pdf' : 'attach'
    setLoading((l) => ({ ...l, [key]: true }))
    setTimeout(() => {
      const mapped = arr.map((f) => ({ id: uid(), name: f.name, size: f.size, file: f }))
      if (kind === 'pdf') setPdfs((p) => [...p, ...mapped])
      else setAttachments((a) => [...a, ...mapped])
      setLoading((l) => ({ ...l, [key]: false }))
    }, 600)
  }
  const viewFile = (f) => setPreviewFile(f)

  // ── ຈັດ signers ໃຫ້ signatory ຢູ່ໜ້າ (ຮຽງ step) + cc ຢູ່ຫຼັງ ──
  const rebuild = (list) => {
    const norm = normalizeSteps(list)
    const sig = norm.filter((s) => isOrdered(s.role)).sort((a, b) => a.step - b.step)
    const cc = norm.filter((s) => !isOrdered(s.role))
    return [...sig, ...cc]
  }

  const addFromDirectory = (person, role) => {
    setSigners((prev) => {
      if (prev.some((s) => s.id === person.id)) return prev
      const maxStep = prev.filter((s) => isOrdered(s.role)).reduce((m, s) => Math.max(m, s.step), 0)
      const entry = { id: person.id, name: person.name, email: person.email, role, hasSig: !!person.hasSig, step: isOrdered(role) ? maxStep + 1 : null }
      return rebuild([...prev, entry])
    })
    setShowErrors(false)
  }
  const removeSigner = (id) => setSigners((prev) => rebuild(prev.filter((s) => s.id !== id)))
  const changeStep = (id, dir) => setSigners((prev) => rebuild(prev.map((s) =>
    s.id === id ? { ...s, step: Math.max(1, (s.step || 1) + dir) } : s)))

  // ── ປ່ຽນ role ເທິງກາດ (signer ↔ approver ↔ cc) ──
  const changeRole = (id, role) => setSigners((prev) => {
    const maxStep = prev.filter((s) => isOrdered(s.role)).reduce((m, s) => Math.max(m, s.step || 0), 0)
    return rebuild(prev.map((s) => {
      if (s.id !== id) return s
      return isOrdered(role) ? { ...s, role, step: s.step || maxStep + 1 } : { ...s, role, step: null }
    }))
  })

  const applyPreset = (kind) => setSigners((prev) => {
    let i = 0
    return rebuild(prev.map((s) => {
      if (!isOrdered(s.role)) return s
      i += 1
      return { ...s, step: kind === 'parallel' ? 1 : i }
    }))
  })

  // ── drag & drop ຈັດລຳดับ (pointer-based ໃຊ້ໄດ້ເທິງມືຖື) ──
  const beginDrag = (id) => (e) => { e.preventDefault(); setDragId(id) }
  const dragMove = (e) => {
    if (!dragId) return
    const y = e.clientY
    setSigners((prev) => {
      const sig = prev.filter((s) => isOrdered(s.role))
      const cc = prev.filter((s) => !isOrdered(s.role))
      const dragged = sig.find((s) => s.id === dragId)
      if (!dragged) return prev
      const others = sig.filter((s) => s.id !== dragId)
      let idx = others.length
      for (let i = 0; i < others.length; i++) {
        const el = cardRef.current[others[i].id]
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (y < r.top + r.height / 2) { idx = i; break }
      }
      const next = [...others]
      next.splice(idx, 0, dragged)
      if (next.length === sig.length && next.every((s, i) => s.id === sig[i].id)) return prev
      return [...next.map((s, i) => ({ ...s, step: i + 1 })), ...cc]
    })
  }
  const endDrag = () => setDragId(null)

  const handleNext = () => {
    if (!canNext) { setShowErrors(true); return }
    onNext()
  }

  return (
    <div className="app">
      <Header title="ເອກະສານ E-Signature ໃໝ່" subtitle="ສ້າງ ແລະ ສົ່ງເພື່ອຂໍລາຍເຊັນ" onBack={onBack || (() => {})} />
      <div className="scroll">
        <Stepper current={1} />

        {/* ── ຫົວຂໍ້ການເຊັນ ── */}
        <div className="card">
          <SectionHead icon={<Icon.doc />} title="ຫົວຂໍ້ການເຊັນ" sub="ຕັ້ງຫົວຂໍ້ໃຫ້ຊັດເຈນ" />
          <textarea className={`title-input ${showErrors && !valid.title ? 'invalid' : ''}`}
            placeholder="ປ້ອນຫົວຂໍ້ການເຊັນ..." maxLength={MAX_TITLE} value={title} rows={2}
            onChange={(e) => onTitleChange(e.target.value)} />
          {titleCleaned && (<span className="hint-text"><Icon.warn /> ໄດ້ລຶບຕົວອັກສອນພິເສດ ( \ / : * ? " &lt; &gt; | ) ແລະ emoji ອອກໂດຍອັດຕະໂນມັດ</span>)}
          <div className="row-between">
            {showErrors && !valid.title ? <span className="err-text">ກະລຸນາປ້ອນຫົວຂໍ້</span> : <span />}
            <span className="counter">{title.length}/{MAX_TITLE}</span>
          </div>
        </div>

        {/* ── ເລືອກໄຟລ໌ເຊັນ (PDF) ── */}
        <div className={`card ${showErrors && !valid.pdf ? 'card-invalid' : ''}`}>
          <SectionHead icon={<Icon.pdf />} title="ເລືອກໄຟລ໌ເຊັນ" sub="ໄຟລ໌ເຊັນຕ້ອງເປັນ PDF ເທົ່ານັ້ນ" />
          <FileList items={pdfs} onRemove={(id) => setPdfs((p) => p.filter((x) => x.id !== id))} onView={viewFile} empty="ແຕະເພື່ອເລືອກໄຟລ໌ PDF" />
          {loading.pdf && <LoadingRow text="ກຳລັງອັບໂຫລດ..." />}
          <input ref={pdfInput} type="file" accept="application/pdf" multiple hidden
            onChange={(e) => { pickFiles(e.target.files, 'pdf'); e.target.value = '' }} />
          <button className="add-btn" onClick={() => pdfInput.current?.click()} disabled={loading.pdf}><Icon.plus /> ເພີ່ມໄຟລ໌ PDF</button>
          {showErrors && !valid.pdf && <span className="err-text">ຕ້ອງມີໄຟລ໌ PDF ຢ່າງໜ້ອຍ 1 ໄຟລ໌</span>}
        </div>

        {/* ── Summary by AI ── */}
        <AiSummary files={pdfs} />

        {/* ── ເອກະສານແนบ ── */}
        <div className="card">
          <div className="attach-head">
            <span className="attach-title"><Icon.clip /> <b>ເອກະສານແນບ</b> <i>(ບໍ່ບັງຄັບ)</i></span>
            <button className="link-btn" onClick={() => attachInput.current?.click()} disabled={loading.attach}><Icon.plus /> ເພີ່ມ</button>
          </div>
          <p className="muted">ແນບເອກະສານປະກອບ — ເບິ່ງໄດ້ ແຕ່ບໍ່ຕ້ອງເຊັນ</p>
          <input ref={attachInput} type="file" multiple hidden onChange={(e) => { pickFiles(e.target.files, 'attach'); e.target.value = '' }} />
          {loading.attach && <LoadingRow text="ກຳລັງອັບໂຫລດ..." />}
          <FileList items={attachments} onRemove={(id) => setAttachments((a) => a.filter((x) => x.id !== id))} onView={viewFile} />
        </div>

        {/* ── ຜູ້ລົງນາມ + CC ── */}
        <div className={`card ${showErrors && !valid.signer ? 'card-invalid' : ''}`}>
          <SectionHead icon={<Icon.addUser />} title="ຜູ້ລົງນາມ & ຮັບສຳເນົາ" sub="ເລືອກຄົນຈາກລາຍຊື່" />
          <button className="add-btn" onClick={() => setPickerOpen(true)}><Icon.book /> ເພີ່ມຈາກລາຍຊື່</button>

          {signatories.length > 0 && (
            <>
              <div className="order-head">
                <span className="order-title"><Icon.layers /> ລຳດັບການລົງນາມ</span>
                <div className="order-preset">
                  <button className="preset-btn" onClick={() => applyPreset('sequential')}>ຕາມລຳດັບ</button>
                  <button className="preset-btn" onClick={() => applyPreset('parallel')}>ພ້ອມກັນ</button>
                </div>
              </div>
              <p className="order-hint"><Icon.grip /> ລາກເພື່ອຈັດລຳດັບ · ຄົນຂັ້ນດຽວກັນ = ເຊັນພ້ອມກັນ · ປ່ຽນບົດບາດໄດ້ເທິງກາດ</p>

              <div className={`sig-list ${dragId ? 'dragging' : ''}`} onPointerMove={dragMove} onPointerUp={endDrag} onPointerLeave={endDrag} onPointerCancel={endDrag}>
                {signatories.map((s, idx) => {
                  const isApprover = s.role === 'approver'
                  const c = isApprover ? { main: '#7c3aed' } : signerColor(docSigners.findIndex((x) => x.id === s.id))
                  const sameAsPrev = idx > 0 && signatories[idx - 1].step === s.step
                  return (
                    <div key={s.id}
                      ref={(el) => { if (el) cardRef.current[s.id] = el; else delete cardRef.current[s.id] }}
                      className={`sig-card ${dragId === s.id ? 'dragging' : ''} ${sameAsPrev ? 'grouped' : ''}`}>
                      <div className="sig-row1">
                        <span className="sig-grip" title="ລາກເພື່ອຈັດລຳດັບ" onPointerDown={beginDrag(s.id)}><Icon.grip /></span>
                        <div className="signer-avatar" style={{ background: c.main }}>{initials(s.name)}</div>
                        <div className="signer-info">
                          <b>{s.name}</b>
                          <span className="signer-email">{isApprover ? 'ອະນຸມັດ · ບໍ່ໂຊລາຍເຊັນ' : s.email}</span>
                        </div>
                        <span className="sig-step">ຂັ້ນທີ່ {s.step}{sameAsPrev && <em>· ພ້ອມກັນ</em>}</span>
                        <button className="icon-mini danger" onClick={() => removeSigner(s.id)}><Icon.trash /></button>
                      </div>
                      <div className="sig-row2">
                        <RoleSeg role={s.role} onChange={(r) => changeRole(s.id, r)} />
                        <div className="step-ctrl">
                          <button className="icon-mini" onClick={() => changeStep(s.id, -1)} disabled={s.step <= 1}><Icon.minus /></button>
                          <button className="icon-mini" onClick={() => changeStep(s.id, +1)}><Icon.plus /></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── CC ── */}
          {ccList.length > 0 && (
            <div className="cc-block">
              <div className="cc-head"><Icon.mail /> <b>ຮັບສຳເນົາ (CC)</b> <i>· ບໍ່ຕ້ອງເຊັນ</i></div>
              {ccList.map((s) => (
                <div className="sig-card cc" key={s.id}>
                  <div className="sig-row1">
                    <div className="signer-avatar cc">{initials(s.name)}</div>
                    <div className="signer-info">
                      <b>{s.name}</b>
                      <span className="signer-email">{s.email}</span>
                    </div>
                    <button className="icon-mini danger" onClick={() => removeSigner(s.id)}><Icon.trash /></button>
                  </div>
                  <div className="sig-row2"><RoleSeg role={s.role} onChange={(r) => changeRole(s.id, r)} /></div>
                </div>
              ))}
            </div>
          )}

          {showErrors && !valid.signer && <span className="err-text">ຕ້ອງມີຜູ້ລົງນາມຢ່າງໜ້ອຍ 1 ຄົນ</span>}
        </div>
      </div>

      <div className="footer">
        <button className={`btn primary ${!canNext ? 'disabled' : ''}`} onClick={handleNext}>
          {canNext ? 'ຕໍ່ໄປ' : 'ຕື່ມຂໍ້ມູນໃຫ້ຄົບ'}
        </button>
      </div>

      <DirectoryPicker open={pickerOpen} onClose={() => setPickerOpen(false)} signers={signers} onAdd={addFromDirectory} me={me} />
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  )
}
