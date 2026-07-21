import { useState } from 'react'
import { Icon } from './shared.jsx'
import { nameOf } from '../home/data.js'
import FilePreviewModal from './FilePreviewModal.jsx'

// ─────────── ໜ້າກວດສອບເອກະສານ (E5) — ເປີດຈາກ QR ທ້າຍໜ້າ PDF ───────────
// mockup ບໍ່ມີ backend ຈິງ → ອ່ານຈາກ localStorage ທີ່ App.jsx snapshot ໄວ້
//   ⚠ ໃຊ້ໄດ້ສະເພາະອຸປະກອນດຽວກັນ (browser storage ດຽວກັນ) — ສະແກນຈາກອຸປະກອນອື່ນຈະບໍ່ພົບຂໍ້ມູນ
//   ⚠ ໄຟລ໌ preview ເປັນ mockup (ຄືກັບໜ້າ DocDetail ຕອນບໍ່ມີໄຟລ໌ PDF ຈິງ) — localStorage ເກັບ binary ຈິງບໍ່ໄດ້
const STATUS_LABEL = { progress: 'ກຳລັງດຳເນີນການ · ຍັງເຊັນບໍ່ຄົບ', done: 'ສຳເລັດແລ້ວ', rejected: 'ຖືກປະຕິເສດ', cancelled: 'ຍົກເລີກແລ້ວ' }
const STATUS_CLASS = { progress: '', done: 'done', rejected: 'rej', cancelled: 'cancel' }

export default function VerifyScreen({ docId }) {
  const [preview, setPreview] = useState(null)
  const [flash, setFlash] = useState('')
  let rec = null
  try { rec = JSON.parse(localStorage.getItem('superwork_verify') || '{}')[docId] || null } catch {}
  // ກັນ localStorage ຮູບແບບເກົ່າ (ຍັງບໍ່ໄດ້ໂຫລດ App.jsx ຮອບໃໝ່) ພັງໜ້າຈໍ
  if (rec) rec = { files: [], attachments: [], signers: [], createdDate: rec.date, ...rec }
  const doneCount = rec ? rec.signers.filter((s) => s.status === 'signed').length : 0
  const act = (m) => { setFlash(m); setTimeout(() => setFlash(''), 2200) }
  // ບໍ່ມີໄຟລ໌ຈິງ (mockup) → preview ດ້ວຍ DocPageBody ດຽວກັບ DocDetail ຕອນບໍ່ມີໄຟລ໌ຈິງ
  const openFile = (name) => {
    if (!rec.creatorId) return // ຂໍ້ມູນເກົ່າ ຍັງບໍ່ມີ id ພຽງພໍສ້າງ mockDoc
    setPreview({ name, mockup: true, mockDoc: { docNo: rec.docNo, title: rec.title, date: rec.createdDate, status: rec.status, signers: rec.signers }, mockFile: { name } })
  }

  const FileRow = ({ name, alt }) => (
    <div className="sum-file as-row dd-fileclick" onClick={() => openFile(name)}>
      <span className={`file-badge sm ${alt ? 'alt' : ''}`}>{alt ? <Icon.layers /> : <Icon.pdf />}</span>
      <div className="dd-file-meta"><b title={name}>{name}</b><span>{alt ? 'ໄຟລ໌ປະກອບ' : 'ໄຟລ໌ເຊັນ'}</span></div>
      <button className="icon-mini" title="ດາວໂຫລດ" onClick={(e) => { e.stopPropagation(); act(`ດາວໂຫລດ ${name}`) }}><Icon.download /></button>
      <button className="icon-mini" title="ແບ່ງປັນ" onClick={(e) => { e.stopPropagation(); act(`ສ້າງລິ້ງແບ່ງປັນ ${name}`) }}><Icon.share /></button>
    </div>
  )

  return (
    <div className="verify-page">
      <div className="verify-head"><Icon.shield /><b>ລະບົບກວດສອບເອກະສານ AIDC TECH</b></div>
      <div className="verify-body">
        {!rec ? (
          <div className="verify-card notfound">
            <Icon.warn />
            <b>ບໍ່ພົບຂໍ້ມູນເອກະສານນີ້</b>
            <p>ອາດເປັນເພາະນີ້ແມ່ນ mockup ຕົວຢ່າງ — ຂໍ້ມູນຈະພົບໄດ້ສະເພາະອຸປະກອນທີ່ເປີດ/ສ້າງເອກະສານນີ້ໄວ້ເທົ່ານັ້ນ (ບໍ່ມີ server ຈິງ)</p>
          </div>
        ) : (<>
          {/* ⚠ badge ຕ້ອງກົງກັບສະຖານະຈິງ — ຫ້າມຂຶ້ນ "verified" ຖ້າຍັງເຊັນບໍ່ຄົບ */}
          <div className={`verify-card ${rec.status === 'done' ? 'ok' : rec.status === 'rejected' || rec.status === 'cancelled' ? 'bad' : 'pending'}`}>
            {rec.status === 'done' ? (
              <span className="verify-badge ok"><Icon.checkCircle /> LANIT verified · ເອກະສານສົມບູນ</span>
            ) : rec.status === 'rejected' || rec.status === 'cancelled' ? (
              <span className="verify-badge bad"><Icon.warn /> {STATUS_LABEL[rec.status]}</span>
            ) : (
              <span className="verify-badge pending"><Icon.clock /> ຍັງເຊັນບໍ່ຄົບ · {doneCount}/{rec.signers.length} ຄົນ</span>
            )}
            <b className="verify-docno">{rec.docNo}</b>
            <p className="verify-title">{rec.title}</p>
            <span className={`doc-status ${STATUS_CLASS[rec.status] || ''}`}>{STATUS_LABEL[rec.status] || rec.status}</span>
          </div>

          <div className="card verify-info">
            <div className="dd-meta-row"><span><Icon.layers /> ປະເພດ</span><b>{rec.docType}</b></div>
            <div className="dd-meta-row"><span><Icon.user /> ຜູ້ສ້າງ</span><b>{rec.creatorId ? nameOf(rec.creatorId) : '—'}</b></div>
            <div className="dd-meta-row"><span><Icon.calendar /> ວັນທີສ້າງ</span><b>{rec.createdDate}</b></div>
            {rec.completedDate
              ? <div className="dd-meta-row"><span><Icon.checkCircle /> ວັນທີເຊັນຄົບ</span><b>{rec.completedDate}</b></div>
              : <div className="dd-meta-row"><span><Icon.clock /> ວັນທີເຊັນຄົບ</span><b className="muted">ຍັງບໍ່ສຳເລັດ</b></div>}
          </div>

          {/* ໄຟລ໌ — ແຕະເພື່ອເປີດເບິ່ງ (mockup) · ດາວໂຫລດ/ແບ່ງປັນ ຄืกับ DocDetail (ป้ายชื่อ+โครงเดียวกันเป๊ะ — ໄຟລ໌ເຊັນ vs ໄຟລ໌ແນບ) */}
          <div className="card">
            <p className="dd-section">ໄຟລ໌ເຊັນ ({rec.files.length})</p>
            {rec.files.map((name, i) => <FileRow key={i} name={name} />)}
            {rec.attachments.length > 0 && (<>
              <p className="dd-section sub">ໄຟລ໌ແນບ ({rec.attachments.length})</p>
              {rec.attachments.map((name, i) => <FileRow key={i} name={name} alt />)}
            </>)}
          </div>

          <div className="card">
            <p className="dd-section">ຜູ້ລົງນາມ / ຜູ້ອະນຸມັດ ({rec.signers.filter((s) => s.id).length})</p>
            {rec.signers.filter((s) => s.id).map((s, i) => (
              <div className="signer-item" key={i}>
                <div className="signer-info">
                  <b>{nameOf(s.id)}</b>
                  {/* E2/E13: ລະບຸວິທີເຊັນຕົ້ນສະບັບ ໃຫ້ຜູ້ກວດສອບຮູ້ */}
                  <span className="signer-email">{s.role === 'approver' ? 'ຜູ້ອະນຸມັດ' : 'ຜູ້ລົງນາມ'}{s.sigType === 'original' ? ' · ເຊັນຕົ້ນສະບັບ' : ''}{s.time ? ` · ${s.time}` : ''}</span>
                </div>
                <span className={`role-tag ${s.status === 'signed' ? 'signer' : s.status === 'rejected' ? 'cc' : ''}`}>
                  {s.status === 'signed' ? 'ແລ້ວ' : s.status === 'rejected' ? 'ປະຕິເສດ' : 'ລໍຖ້າ'}
                </span>
              </div>
            ))}
          </div>
        </>)}
      </div>
      {flash && <div className="dd-note ok verify-flash"><Icon.checkCircle /> {flash}</div>}
      <FilePreviewModal file={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
