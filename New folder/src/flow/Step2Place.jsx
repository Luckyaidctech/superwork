import { useState, useEffect, useRef } from 'react'
import { Icon, Header, uid, signerColor, initials } from './shared.jsx'
import PdfViewer from './PdfViewer.jsx'

export default function Step2Place({ store, onBack, onNext }) {
  const { pdfs, signers, placements, setPlacements } = store
  const signatories = signers.filter((s) => s.role === 'signer')

  const [viewMode, setViewMode] = useState('edit')
  const [activeSignerId, setActiveSignerId] = useState(signatories[0]?.id ?? null)
  const [pageInfo, setPageInfo] = useState({ cur: 1, total: 0 })
  const scrollRef = useRef(null)

  // ສະຫຼັບໂໝດ (ແກ້ໄຂ/ຕົວຢ່າງ) → ເລື່ອນກັບໄປໜ້າທຳອິດ (ໜ້າ 1) ສະເໝີ
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [viewMode])

  // ນັບໜ້າ ແລະ ໜ້າປັດຈຸບັນ ຕາມການເລື່ອນ (ໜ້າ x/y)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const pages = el.querySelectorAll('.pdf-page')
      if (!pages.length) { setPageInfo({ cur: 1, total: 0 }); return }
      const mid = el.getBoundingClientRect().top + el.clientHeight * 0.4
      let cur = 1
      pages.forEach((p, i) => { if (p.getBoundingClientRect().top <= mid) cur = i + 1 })
      setPageInfo({ cur, total: pages.length })
    }
    update()
    const iv = setInterval(update, 500)
    const stop = setTimeout(() => clearInterval(iv), 3500) // ພໍໃຫ້ pdf.js render ຄົບ
    el.addEventListener('scroll', update, { passive: true })
    return () => { clearInterval(iv); clearTimeout(stop); el.removeEventListener('scroll', update) }
  }, [pdfs, viewMode])

  const countFor = (sid) => placements.filter((p) => p.signerId === sid).length
  const placedSet = new Set(placements.map((p) => p.signerId))
  const placedSigners = signatories.filter((s) => placedSet.has(s.id)).length
  const canNext = signatories.length > 0 && signatories.every((s) => placedSet.has(s.id))

  const addPlacement = (pageKey, xPct, yPct) => {
    if (!activeSignerId) return
    setPlacements((ps) => [...ps, { id: uid(), signerId: activeSignerId, pageKey, xPct, yPct }])
  }
  const movePlacement = (id, xPct, yPct) => setPlacements((ps) => ps.map((p) => (p.id === id ? { ...p, xPct, yPct } : p)))
  const removePlacement = (id) => setPlacements((ps) => ps.filter((p) => p.id !== id))

  return (
    <div className="app">
      <Header title="ເບິ່ງ & ວາງລາຍເຊັນ" subtitle={viewMode === 'edit' ? 'ແຕະຜູ້ລົງນາມ ແລ້ວແຕະເອກະສານເພື່ອວາງຈຸດ' : 'ຕົວຢ່າງ — ລາຍເຊັນຕົວຈິງຈະສະແດງເມື່ອຜູ້ລົງນາມອະນຸມັດ'} onBack={onBack} help />

      <div className="scroll place-scroll" ref={scrollRef}>
        {pageInfo.total > 1 && (
          <div className="page-indicator">ໜ້າ {pageInfo.cur}/{pageInfo.total}</div>
        )}
        <PdfViewer files={pdfs} mode={viewMode} watermark={viewMode === 'preview'} activeSignerId={activeSignerId}
          placements={placements} signers={signatories}
          onAdd={addPlacement} onMove={movePlacement} onRemove={removePlacement} />
      </div>

      <div className="place-dock">
        <div className="dock-modes">
          <button className={`seg ${viewMode === 'edit' ? 'on' : ''}`} onClick={() => setViewMode('edit')}><Icon.pen /> ແກ້ໄຂ</button>
          <button className={`seg ${viewMode === 'preview' ? 'on' : ''}`} onClick={() => setViewMode('preview')}><Icon.eye /> ຕົວຢ່າງ</button>
        </div>

        {viewMode === 'preview' && (
          <p className="preview-note"><Icon.warn /> <span>ນີ້ແມ່ນລາຍເຊັນ<b>ຕົວຢ່າງ (mock)</b> ເທົ່ານັ້ນ — ລາຍເຊັນຕົວຈິງຈະສະແດງເມື່ອຜູ້ລົງນາມອະນຸມັດ</span></p>
        )}

        {viewMode === 'edit' && (
          <>
            <p className="dock-hint">ເລືອກຜູ້ລົງນາມ:</p>
            <div className="chip-row">
              {signatories.map((s, idx) => {
                const c = signerColor(idx)
                const active = s.id === activeSignerId
                const n = countFor(s.id)
                return (
                  <button key={s.id} className={`signer-chip ${active ? 'active' : ''}`}
                    style={{ '--c': c.main, '--c-soft': c.soft }} onClick={() => setActiveSignerId(s.id)}>
                    <span className="chip-avatar" style={{ background: c.main }}>{initials(s.name)}</span>
                    <span className="chip-name">{s.name.split(' ')[0]}</span>
                    <span className="chip-step">ຂ.{s.step}</span>
                    <span className={`chip-count ${n ? 'has' : ''}`}>{n}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className="place-foot">
          <span className="placed-count">ວາງແລ້ວ <b>{placedSigners}/{signatories.length}</b> ຄົນ</span>
          <button className={`btn primary sm ${!canNext ? 'disabled' : ''}`} onClick={() => canNext && onNext()}>ຕໍ່ໄປ</button>
        </div>
      </div>
    </div>
  )
}
