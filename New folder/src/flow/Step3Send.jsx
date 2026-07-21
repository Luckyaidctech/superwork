import { useState } from 'react'
import { Icon, Header, Stepper, SectionHead, fmtSize, signerColor, initials, groupSignatories, isOrdered } from './shared.jsx'
import PdfViewer from './PdfViewer.jsx'
import FilePreviewModal from './FilePreviewModal.jsx'

export default function Step3Send({ store, onBack, onSubmit }) {
  const { title, docNoPreview, otherTypeName, docSubtype, pdfs, attachments, signers, placements } = store
  const ordered = signers.filter((s) => isOrdered(s.role)) // ຜູ້ລົງນາມ + ຜູ້ອະນຸມັດ
  const docSigners = signers.filter((s) => s.role === 'signer') // ໂຊລາຍເຊັນ
  const approvers = signers.filter((s) => s.role === 'approver')
  const ccList = signers.filter((s) => s.role === 'cc')
  const groups = groupSignatories(ordered)
  const [sending, setSending] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [orderOpen, setOrderOpen] = useState(false) // ລຳดับ = accordion ປິດໄວ້ default

  const countFor = (sid) => placements.filter((p) => p.signerId === sid).length
  const noop = () => {}
  const viewFile = (f) => setPreviewFile(f)

  const handleSend = () => { setSending(true); setTimeout(() => onSubmit(), 1000) }

  return (
    <div className="app">
      <Header title="ສົ່ງເພື່ອເຊັນ" subtitle="ກວດຄວາມຖືກຕ້ອງ ກ່ອນສົ່ງ" onBack={onBack} />
      <div className="scroll">
        <Stepper current={3} />

        {/* ── ສະຫຼຸບ ── */}
        <div className="card">
          <SectionHead icon={<Icon.doc />} title="ສະຫຼຸບເອກະສານ" />
          <div className="sum-row"><span>ຫົວຂໍ້</span><b>{title}</b></div>
          {/* E10: ປະເພດ "ອື່ນໆ" ໂຊຊື່ທີ່ຜູ້ໃຊ້ພິມເອງ */}
          {otherTypeName && <div className="sum-row"><span>ປະເພດເອກະສານ</span><b>{otherTypeName} (ອື່ນໆ)</b></div>}
          <div className="sum-row"><span>ເລກທີເອກະສານ</span><b>{docNoPreview}</b></div>
          <div className="sum-row"><span>ໄຟລ໌ເຊັນ</span><b>{pdfs.length} ໄຟລ໌ (PDF)</b></div>
          <div className="sum-row"><span>ເອກະສານແນບ</span><b>{attachments.length} ໄຟລ໌</b></div>
          <div className="sum-row"><span>ຜູ້ລົງນາມ</span><b>{docSigners.length} ຄົນ</b></div>
          {approvers.length > 0 && <div className="sum-row"><span>ຜູ້ອະນຸມັດ</span><b>{approvers.length} ຄົນ</b></div>}
          <div className="sum-row"><span>ຮັບສຳເນົາ (CC)</span><b>{ccList.length} ຄົນ</b></div>
        </div>

        {/* ── ໄຟລ໌ເອກະສານ (ໄຟລ໌ເຊັນ + ແນບ) ── */}
        <div className="card">
          <SectionHead icon={<Icon.pdf />} title="ໄຟລ໌ເອກະສານ" sub="ແຕະເພື່ອເບິ່ງໄຟລ໌" />
          <p className="doc-group-label">ໄຟລ໌ເຊັນ (PDF)</p>
          <div className="sum-files">
            {pdfs.map((f) => (
              <button key={f.id} className="sum-file" onClick={() => viewFile(f)}>
                <span className="file-badge sm"><Icon.pdf /></span>
                <span className="sum-file-name">{f.name}</span>
                <span className="sum-file-size">{fmtSize(f.size)}</span>
                <Icon.eye />
              </button>
            ))}
          </div>
          {attachments.length > 0 && (
            <>
              <p className="doc-group-label">ເອກະສານແນບ</p>
              <div className="sum-files">
                {attachments.map((f) => (
                  <button key={f.id} className="sum-file" onClick={() => viewFile(f)}>
                    <span className="file-badge sm attach"><Icon.clip /></span>
                    <span className="sum-file-name">{f.name}</span>
                    <span className="sum-file-size">{fmtSize(f.size)}</span>
                    <Icon.eye />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── ຜູ້ລົງນາມ (accordion — ປິດ default) ── */}
        <div className="card">
          <button className="acc-head" onClick={() => setOrderOpen((o) => !o)}>
            <SectionHead icon={<Icon.layers />} title="ລຳດັບການລົງນາມ"
              sub={`${docSigners.length} ຜູ້ລົງນາມ · ${groups.length} ຂັ້ນຕອນ${approvers.length ? ` · ${approvers.length} ອະນຸມັດ` : ''}`}
              right={<span className={`acc-chevron ${orderOpen ? 'open' : ''}`}><Icon.chevron /></span>} />
          </button>
          {orderOpen && (<>
          <div className="group-list">
            {groups.map((g) => (
              <div className="step-group" key={g.rank}>
                <div className="step-group-head">
                  <span className="step-chip">ຂັ້ນທີ່ {g.rank}</span>
                  {g.members.length > 1 && <span className="step-parallel">ເຊັນພ້ອມກັນ · {g.members.length} ຄົນ</span>}
                </div>
                {g.members.map((s) => {
                  const isApprover = s.role === 'approver'
                  const c = isApprover ? { main: '#7c3aed' } : signerColor(docSigners.findIndex((x) => x.id === s.id))
                  const n = countFor(s.id)
                  return (
                    <div className="signer-item" key={s.id}>
                      <div className="signer-avatar" style={{ background: c.main }}>{initials(s.name)}</div>
                      <div className="signer-info"><b>{s.name} {isApprover && <span className="role-tag approver">ອະນຸມັດ</span>}</b><span className="signer-email">{s.email}</span></div>
                      {isApprover
                        ? <span className="place-pill approve">ບໍ່ໂຊລາຍເຊັນ</span>
                        : <span className={`place-pill ${n ? 'ok' : 'none'}`}>{n ? `${n} ຈຸດ` : 'ຍັງບໍ່ວາງ'}</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {ccList.length > 0 && (
            <div className="cc-block">
              <div className="cc-head"><Icon.mail /> <b>ຮັບສຳເນົາ (CC)</b> <i>· ບໍ່ຕ້ອງເຊັນ</i></div>
              {ccList.map((s) => (
                <div className="signer-item cc-item" key={s.id}>
                  <div className="signer-avatar cc">{initials(s.name)}</div>
                  <div className="signer-info"><b>{s.name}</b><span className="signer-email">{s.email}</span></div>
                  <span className="role-tag cc">CC</span>
                </div>
              ))}
            </div>
          )}
          </>)}
        </div>

        {/* ── ຕົວຢ່າງ ── */}
        <div className="card">
          <SectionHead icon={<Icon.eye />} title="ຕົວຢ່າງກ່ອນສົ່ງ" sub="ລາຍເຊັນ mock — ຕົວຈິງຈະສະແດງເມື່ອອະນຸມັດ" />
          <div className="preview-frame">
            {!previewFile && (
              <PdfViewer files={pdfs} mode="preview" watermark activeSignerId={null}
                placements={placements} signers={docSigners} onAdd={noop} onMove={noop} onRemove={noop} />
            )}
          </div>
        </div>
      </div>

      <div className="footer">
        <button className="btn ghost" onClick={onBack} disabled={sending}>ຍ້ອນກັບ</button>
        <button className="btn primary" onClick={handleSend} disabled={sending}>
          {sending ? <span className="spinner" /> : <><Icon.send /> ສົ່ງເພື່ອເຊັນ</>}
        </button>
      </div>
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  )
}
