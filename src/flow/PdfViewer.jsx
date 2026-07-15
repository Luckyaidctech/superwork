import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { QRCodeSVG } from 'qrcode.react'
import { Icon, signerColor, initials, LanitStamp } from './shared.jsx'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const RENDER_W = 820 // internal canvas resolution; CSS scales to 100%

// footer ທ້າຍໜ້າ: QR ຈິງ (ສະແກນ → ເປີດ/ໂຫລດ PDF) + ວັນທີເຊັນລ່າສຸດ
function PageFooter({ footer, page }) {
  if (!footer) return null
  const url = footer.url || (typeof window !== 'undefined' ? window.location.origin : '')
  return (
    <div className="pdf-page-foot">
      <div className="pdf-foot-qr">
        <span className="qr-svg"><QRCodeSVG value={url} size={40} level="M" bgColor="#ffffff" fgColor="#1a2a5e" /></span>
        <div><b>ສະແກນເປີດເອກະສານ</b><span>PDF · ໜ້າ {page}</span></div>
      </div>
      <div className="pdf-foot-date"><span>ເຊັນລ່າສຸດ</span><b>{footer.date || '—'}</b></div>
    </div>
  )
}

// ─────────────── ກ່ອງລາຍເຊັນທີ່ລາກໄດ້ / Draggable signature box ───────────────
function SignatureBox({ p, signer, colorIdx, mode, isMe, fill, onSigSetScale, onSigMove, onSigDelete, onSigEdit, onMove, onRemove }) {
  const c = signerColor(colorIdx)
  const boxRef = useRef(null)
  const dragging = useRef(false)
  const scaleDrag = useRef(null)
  const saved = !fill && p.sig // ລາຍເຊັນທີ່ບັນທຶກໄວ້ (end-to-end) → ໂຊตอนเปิดดู
  const scale = fill?.scales?.[p.id] ?? p.sig?.scale ?? 1 // scale ແຍກແຕ່ລະຊ່ອງ
  // ลากมุมกล่อง → ขยาย/ย่อ (ສະเฉพาะช่องนี้)
  const onScaleDown = (e) => { e.stopPropagation(); scaleDrag.current = { x: e.clientX, y: e.clientY, s: scale }; e.currentTarget.setPointerCapture(e.pointerId) }
  const onScaleMove = (e) => {
    if (!scaleDrag.current || !onSigSetScale) return
    e.stopPropagation()
    const d = (e.clientX - scaleDrag.current.x + (e.clientY - scaleDrag.current.y)) / 120
    onSigSetScale(p.id, Math.min(2.5, Math.max(0.5, scaleDrag.current.s + d)))
  }
  const onScaleUp = (e) => { if (scaleDrag.current) { scaleDrag.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {} } }

  const onPointerDown = (e) => {
    if (mode !== 'edit' && !fill) return // ລາກໄດ້: edit ຫຼື fill (ຍ້າຍຕຳແໜ່ງ)
    if (e.target.closest('.sig-x, .sig-fill-btn, .sig-scale-handle')) return // ປ່ອຍປຸ່ມ/handle
    e.stopPropagation()
    dragging.current = true
    try { boxRef.current.setPointerCapture(e.pointerId) } catch {}
  }
  const onPointerMove = (e) => {
    if (!dragging.current) return
    e.stopPropagation()
    const page = boxRef.current.closest('.pdf-page')
    if (!page) return
    const rect = page.getBoundingClientRect()
    let x = ((e.clientX - rect.left) / rect.width) * 100
    let y = ((e.clientY - rect.top) / rect.height) * 100
    x = Math.max(6, Math.min(94, x))
    y = Math.max(3, Math.min(97, y))
    if (fill && onSigMove) onSigMove(p.id, x, y); else onMove(p.id, x, y)
  }
  const onPointerUp = (e) => {
    if (!dragging.current) return
    dragging.current = false
    try { boxRef.current.releasePointerCapture(e.pointerId) } catch {}
  }

  return (
    <div
      ref={boxRef}
      className={`sig-box ${mode} ${isMe && !signer?.hasSig && !fill && !saved ? 'me' : ''} ${fill ? 'filled' : ''} ${saved ? 'saved' : ''} ${(fill?.sigType === 'lanit' || p.sig?.type === 'lanit') ? 'lanit' : ''}`}
      style={{ left: `${p.xPct}%`, top: `${p.yPct}%`, '--c': c.main, '--c-soft': c.soft, ...((fill || saved) ? { transform: `translate(-50%,-50%) scale(${scale})` } : {}) }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      {mode === 'edit' ? (
        <>
          <span className="sig-grip"><Icon.pen /></span>
          <span className="sig-name">{signer?.name || 'ຜູ້ລົງນາມ'}</span>
          <button className="sig-x" onClick={(e) => { e.stopPropagation(); onRemove(p.id) }}><Icon.x /></button>
        </>
      ) : fill ? (
        // ຜู้ที่กำลังเซ็นເຕີມລາຍເຊັນຈິງໃນຊ່ອງນີ້ → box: edit ຊ້າຍເທິງ / ✕ ຂວາເທິງ / handle ມຸມ
        <>
          <div className="sig-fill-media">
            {fill.sigType === 'lanit'
              ? <LanitStamp sigImg={fill.sealImg} name={signer?.name} date={fill.date} compact />
              : <img src={fill.sigImg} alt="signature" draggable={false} />}
          </div>
          {onSigEdit && <button className="sig-fill-btn edit" title="ປ່ຽນ" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onSigEdit() }}><Icon.pen /></button>}
          {onSigDelete && <button className="sig-fill-btn del" title="ລຶບ" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onSigDelete(p.id) }}><Icon.x /></button>}
          {onSigSetScale && (
            <span className="sig-scale-handle" title="ລາກເພື່ອຂະຫຍາຍ/ຫຍໍ້" onPointerDown={onScaleDown} onPointerMove={onScaleMove} onPointerUp={onScaleUp} onPointerCancel={onScaleUp}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            </span>
          )}
        </>
      ) : saved ? (
        // ລາຍເຊັນທີ່ບັນທຶກແລ້ວ → ໂຊของจริง (end-to-end)
        <div className="sig-fill-media">
          {p.sig.type === 'lanit'
            ? <LanitStamp sigImg={p.sig.sealImg} name={signer?.name} date={p.sig.date} compact />
            : <img src={p.sig.img} alt="signature" draggable={false} />}
        </div>
      ) : signer?.hasSig ? (
        // ເຊັນແລ້ວ (ບໍ່ມີ img) → cursive name
        <div className="sig-signed">
          <span className="sig-signed-name">{signer?.name || 'ຜູ້ລົງນາມ'}</span>
          <span className="sig-signed-meta"><Icon.check /> ເຊັນແລ້ວ</span>
        </div>
      ) : isMe ? (
        // ບ່ອນຂອງຜູ້ທີ່ກຳລັງເຊັນ → Sign Field ໄຮໄລທ໌
        <div className="sig-me">
          <span className="sig-me-ic"><Icon.pen /></span>
          <span className="sig-me-name">{signer?.name || 'ຜູ້ລົງນາມ'}</span>
          <span className="sig-me-sub">Sign Field · ບ່ອນຂອງທ່ານ</span>
        </div>
      ) : (
        // ຄົນອື່ນ ຍັງບໍ່ໄດ້ເຊັນ
        <div className="sig-mock">
          <span className="sig-mock-name">{signer?.name || 'ຜູ້ລົງນາມ'}</span>
          <span className="sig-mock-sub">ຍັງບໍ່ໄດ້ເຊັນ</span>
        </div>
      )}
    </div>
  )
}

// ─────────────── ໜ້າວາງໄດ້ (canvas ຫຼື fallback) / Placeable page ───────────────
function PlaceablePage({ pageKey, children, mode, watermark, activeSignerId, placements, signers, myFill, pageFooter, onSigScale, onSigSetScale, onSigMove, onSigDelete, onSigEdit, onAdd, onMove, onRemove }) {
  const pageNum = parseInt(String(pageKey).split('-').pop(), 10) || 1
  const ref = useRef(null)
  const down = useRef(null)
  // ແຍກ "ແຕະ" ອອກจาก "ເລື່ອນ" — ວາງລາຍເຊັນເມื่อແຕະຢູ່ກັບທີ່ເທົ່ານັ້ນ (ເລື່ອນຫຼາຍໜ້າได้ปกติ)
  const onPointerDown = (e) => {
    if (mode !== 'edit' || !activeSignerId) return
    if (e.target.closest('.sig-box')) return
    down.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e) => {
    const d = down.current
    down.current = null
    if (!d) return
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) return // ຖືว่าເປັນการเลื่อน
    if (e.target.closest('.sig-box')) return
    const rect = ref.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onAdd(pageKey, x, y)
  }
  const mine = placements.filter((p) => p.pageKey === pageKey)
  return (
    <div className={`pdf-page ${mode === 'edit' && activeSignerId ? 'placing' : ''}`} ref={ref}
      onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { down.current = null }}>
      {children}
      {watermark && (
        <div className="pdf-watermark" aria-hidden="true">
          <div className="wm-brand">AIDC<span>DOCUMENT</span></div>
        </div>
      )}
      {mine.map((p) => {
        const idx = signers.findIndex((s) => s.id === p.signerId)
        const fill = myFill && myFill.signerId === p.signerId && (myFill.filled || []).includes(p.id) ? myFill : null
        return (
          <SignatureBox key={p.id} p={p} signer={signers[idx]} colorIdx={idx < 0 ? 0 : idx}
            mode={mode} isMe={mode !== 'edit' && p.signerId === activeSignerId} fill={fill}
            onSigSetScale={onSigSetScale} onSigMove={onSigMove} onSigDelete={onSigDelete} onSigEdit={onSigEdit} onMove={onMove} onRemove={onRemove} />
        )
      })}
      <PageFooter footer={pageFooter} page={pageNum} />
    </div>
  )
}

function PdfCanvasPage({ doc, pageNum, ...rest }) {
  const canvasRef = useRef(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    let task, cancelled = false
    doc.getPage(pageNum).then((page) => {
      if (cancelled) return
      const vp0 = page.getViewport({ scale: 1 })
      const vp = page.getViewport({ scale: RENDER_W / vp0.width })
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = vp.width
      canvas.height = vp.height
      task = page.render({ canvasContext: canvas.getContext('2d'), viewport: vp })
      task.promise.then(() => { if (!cancelled) setRendered(true) }).catch(() => {})
    })
    return () => { cancelled = true; if (task) task.cancel() }
  }, [doc, pageNum])

  return (
    <PlaceablePage {...rest}>
      <canvas ref={canvasRef} className={`pdf-canvas ${rendered ? '' : 'ph'}`} />
      {!rendered && <div className="pdf-page-loading"><span className="spinner dark" /></div>}
    </PlaceablePage>
  )
}

// fallback ເມື່ອບໍ່ແມ່ນ PDF ຈິງ (ສຳລັບ demo) — ໜ້າ A4 ວ່າງທີ່ວາງລາຍເຊັນໄດ້
function FallbackPage({ ...rest }) {
  return (
    <PlaceablePage {...rest}>
      <div className="pdf-fallback">
        <div className="fb-badge"><Icon.pdf /></div>
        <p className="fb-title">ຕົວຢ່າງເອກະສານ</p>
        <p className="fb-note">(ໜ້ານີ້ຈຳລອງໄວ້ສຳລັບທົດລອງວາງລາຍເຊັນ — ອັບໂຫລດ PDF ຈິງເພື່ອເບິ່ງເນື້ອຫາ)</p>
        <div className="fb-lines">{Array.from({ length: 8 }).map((_, i) => <span key={i} style={{ width: `${90 - i * 6}%` }} />)}</div>
      </div>
    </PlaceablePage>
  )
}

function PdfDoc({ file, fileId, overlay }) {
  const [doc, setDoc] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [err, setErr] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDoc(null); setErr(false); setNumPages(0)
    if (!file || typeof file.arrayBuffer !== 'function') { setErr(true); return }
    file.arrayBuffer()
      .then((buf) => pdfjsLib.getDocument({ data: buf }).promise)
      .then((pdf) => { if (!cancelled) { setDoc(pdf); setNumPages(pdf.numPages) } })
      .catch(() => { if (!cancelled) setErr(true) })
    return () => { cancelled = true }
  }, [file])

  if (err) return <FallbackPage pageKey={`${fileId}-1`} {...overlay} />
  if (!doc) return <div className="pdf-loading"><span className="spinner dark" /> ກຳລັງໂຫລດເອກະສານ...</div>

  return Array.from({ length: numPages }).map((_, i) => (
    <PdfCanvasPage key={i} doc={doc} pageNum={i + 1} pageKey={`${fileId}-${i + 1}`} {...overlay} />
  ))
}

// ─────────────── Public viewer ───────────────
export default function PdfViewer({ files, mode, watermark, activeSignerId, placements, signers, myFill, pageFooter, onSigScale, onSigSetScale, onSigMove, onSigDelete, onSigEdit, onAdd, onMove, onRemove }) {
  const overlay = { mode, watermark, activeSignerId, placements, signers, myFill, pageFooter, onSigScale, onSigSetScale, onSigMove, onSigDelete, onSigEdit, onAdd, onMove, onRemove }
  const multi = files.length > 1 // ຫຼາຍໄຟລ໌ → ໃສ່ປ້າຍชื่อแยกแต่ละไฟล์
  return (
    <div className="pdf-viewer">
      {files.map((f, i) => (
        <div className="pdf-file-group" key={f.id || f.name || i}>
          {multi && (
            <div className="pdf-file-label">
              <span className="pdf-file-badge">{i + 1}</span>
              <span className="pdf-file-lname">{f.name}</span>
              <span className="pdf-file-count">{i + 1}/{files.length}</span>
            </div>
          )}
          <PdfDoc file={f.file} fileId={f.id} overlay={pageFooter
            ? { ...overlay, pageFooter: { ...pageFooter, url: f.srcUrl ? `${window.location.origin}${f.srcUrl}` : pageFooter.url } }
            : overlay} />
        </div>
      ))}
    </div>
  )
}
