import { useState, useRef, useEffect } from 'react'
import { Icon, Header, LanitStamp, ResultPopup } from './shared.jsx'
import SignaturePad from './SignaturePad.jsx'
import PdfViewer from './PdfViewer.jsx'
import { DocPageBody } from './DocSignatures.jsx'
import { nameOf, actingId } from '../home/data.js'

const noop = () => {}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)


export default function SignScreen({ doc, mySig, bio = false, signerName = 'ຜູ້ລົງນາມ', meId, placementOwnerId, onSaveSig, onDone, onOriginalSign, onBack }) {
  // E3/E12: placements ຖືກສ້າງໄວ້ຕາມ id ຂອງ "ที่นั่ง" ເດີມ — ຖ້າ me ຮັບມอบหมายมา placementOwnerId ຈะไม่เท่ากับ meId
  const pOwner = placementOwnerId || meId
  const [stage, setStage] = useState('doc') // doc | choose | draw | original | connecting | otp | place | bio | success
  const [sig, setSig] = useState(null)
  const [sigType, setSigType] = useState('img') // 'img' | 'lanit' | 'original'
  const [drawn, setDrawn] = useState(null)
  const [placed, setPlaced] = useState(null) // { x, y, scale } — fraction ຂອງ doc
  const [zoom, setZoom] = useState(1)
  const [gesturing, setGesturing] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpFor, setOtpFor] = useState('lanit') // 'lanit' | 'original' — OTP ໃຊ້ຮ່ວມ 2 flow, ສຳເລັດແລ້ວໄປคนละทาง (E2/E13)
  const [resendIn, setResendIn] = useState(60) // ນັບຖອຍຫຼັງ resend OTP
  const [toast, setToast] = useState('')
  const [sigFilled, setSigFilled] = useState([]) // placement ids ທີ່ເຕີມລາຍເຊັນແລ້ວ (per-box)
  const [mySigScales, setMySigScales] = useState({}) // scale ແຍກແຕ່ລະຊ່ອງ { [placementId]: scale }
  const [mySigPos, setMySigPos] = useState({}) // ตำแหน่ง override per-box (ลากย้าย) { [placementId]: {x,y} }
  const [savePrompt, setSavePrompt] = useState(null) // ລາຍເຊັນທີ່ຫາกยิ่งวาด → ຖາມบันทึกไหม
  const [originalFiles, setOriginalFiles] = useState({}) // E2/E13: { [fileIndex]: File } — ໄຟລ໌ PDF ທີ່ສະແກນ/ອັບໂຫລດກັບ ຄົບທຸກໄຟລ໌ (ລາຍເຊັນຕົ້ນສະບັບ)
  const [originalPreviewIdx, setOriginalPreviewIdx] = useState(null) // ກຳລັງ preview ໄຟລ໌ index ໃດ
  const docRef = useRef(null)
  const gesture = useRef(null)
  const pointers = useRef(new Map())
  const pinch = useRef(null)
  const otpRefs = useRef([])
  const originalInputRefs = useRef([])
  const originalCamRefs = useRef([])
  // E2/E13 redesign (Lucky ເຄາະ 19/07): ຖ້າມີ "ສະບັບເຊັນມື" ແລ້ວ → ຄົນຕໍ່ໄປ ເຮັດວຽກເທິງສະບັບຫຼ້າສຸດ (ບໍ່ແມ່ນຕົ້ນສະບັບ)
  const lastSignedVer = doc.signedVersions?.length ? doc.signedVersions[doc.signedVersions.length - 1] : null
  const files = lastSignedVer ? lastSignedVer.files : (doc.files || [])
  const dateStr = `${doc.date} 09:41`
  // ດາວໂຫລດຕ້ອງໄດ້ໄຟລ໌ຈິງສະເໝີ (ບໍ່ມີລາຍນ້ຳ) — mock file ທີ່ບໍ່ມີ File ຈິງ → ໃຊ້ PDF ຕົວຢ່າງໃນ public ແທນ
  const KNOWN_PDFS = ['sample.pdf', 'super-work-agreement.pdf', 'super-work-invitation.pdf']
  const publicPdfUrl = (name) => `${import.meta.env.BASE_URL}${KNOWN_PDFS.includes(name) ? name : 'sample.pdf'}`

  const startPlace = (s, type = 'img') => {
    setSig(s); setSigType(type)
    if (files.some((f) => f.file) && doc.placements?.length > 0) {
      setSigFilled((doc.placements || []).filter((p) => p.signerId === pOwner).map((p) => p.id)) // ເຕີມທຸກຊ່ອງຂອງຕົນ
      setStage('place'); return
    }
    setPlaced((p) => p || { x: 0.5, y: 0.72, scale: type === 'lanit' ? 0.9 : 1 }); setStage('place')
  }
  const useSuperwork = () => (mySig ? startPlace(mySig, 'img') : setStage('draw'))
  const useLanit = () => { setOtpFor('lanit'); setStage('connecting'); setTimeout(() => { setResendIn(60); setStage('otp') }, 1400) }
  const resendOtp = () => { if (resendIn <= 0) { setResendIn(60); setOtp(['', '', '', '', '', '']); otpRefs.current[0]?.focus() } }
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 1800) }
  const otpFull = otp.every((d) => d !== '')
  const submitOtp = () => { if (otpFull) (otpFor === 'original' ? finishOriginal() : startPlace(null, 'lanit')) }
  // ── E2/E13 (redesign ຕາມ Lucky 19/07): ດາວໂຫລດຕົ້ນສະບັບ ບໍ່ມີລາຍນ້ຳ → ເຊັນມື → ອັບໂຫລດກັບ (ສະແກນ/ຖ່າຍຮູບ ຫຼື ເລືອກໄຟລ໌)
  //    → preview ອັດຕະໂນມັດກ່ອນຢືນຢັນ → OTP → ເກັບເປັນ "ສະບັບເຊັນມື" ແຍກກ່ອງ (ບໍ່ທັບຕົ້ນສະບັບ) ──
  const downloadOriginal = (i) => {
    const f = files[i]
    const a = document.createElement('a')
    if (f?.file) { const url = URL.createObjectURL(f.file); a.href = url; a.download = f.name; a.click(); URL.revokeObjectURL(url) }
    else { a.href = publicPdfUrl(f.name); a.download = f.name; a.click() }
    flash(`ດາວໂຫລດ "${f.name}" ແລ້ວ (ບໍ່ມີລາຍນ້ຳ)`)
  }
  // ອັບໂຫລດແລ້ວ preview ເປີດໃຫ້ເອງທັນທີ — ຜູ້ໃຊ້ຕ້ອງເຫັນໄຟລ໌ກ່ອນຢືນຢັນ (Lucky: preview ກ່ອນສົ່ງສະເໝີ)
  const pickOriginalFile = (i, e) => {
    const f = e.target.files?.[0]
    if (f) { setOriginalFiles((m) => ({ ...m, [i]: f })); setOriginalPreviewIdx(i) }
  }
  const allOriginalUploaded = files.length > 0 && files.every((f, i) => originalFiles[i])
  const startOriginalOtp = () => { setOtpFor('original'); setResendIn(60); setOtp(['', '', '', '', '', '']); setStage('otp') }
  const finishOriginal = () => { setSigType('original'); setStage('success') }
  const [signPopup, setSignPopup] = useState(false) // popup ຢືนยัน ลงนามสำเร็จ
  const [signing, setSigning] = useState(false) // ກຳລັງບັนทึก (loading) — กันกดซ้ำ
  const doSign = () => {
    if (signing) return
    if (sigType !== 'lanit' && bio) { setStage('bio'); return }
    setSigning(true) // disable + spinner (simulate API)
    setTimeout(() => { setSigning(false); setSignPopup(true) }, 900)
  }
  const delSig = () => { setPlaced(null); setSig(null); setSigType('img') }
  const successMsg = sigType === 'lanit' ? 'ລົງນາມອະນຸມັດສຳເລັດ!' : 'ລົງນາມສຳເລັດ!'

  // ນັບຖອຍຫຼັງ resend OTP (disable ຖ້າຍັງບໍ່ຄົບ 60 ວິນາທີ)
  useEffect(() => {
    if (stage !== 'otp') return
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [stage])

  const setOtpDigit = (i, v) => {
    const nv = v.replace(/\D/g, '').slice(-1)
    setOtp((o) => { const c = [...o]; c[i] = nv; return c })
    if (nv && i < 5) otpRefs.current[i + 1]?.focus()
  }

  // ── gestures on doc ──
  const rel = (e) => { const r = docRef.current.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height } }
  const onDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) { const p = [...pointers.current.values()]; pinch.current = { startDist: dist(p[0], p[1]), startZoom: zoom }; gesture.current = null; setGesturing(true) }
  }
  const onMove = (e) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinch.current) { const p = [...pointers.current.values()]; setZoom(clamp(+(pinch.current.startZoom * (dist(p[0], p[1]) / pinch.current.startDist)).toFixed(2), 0.6, 3)); return }
    const g = gesture.current
    if (!g) return
    if (g.type === 'move') { const p = rel(e); setPlaced((prev) => ({ ...prev, x: clamp(p.x, 0, 1), y: clamp(p.y, 0, 1) })) }
    else if (g.type === 'resize') { const d = Math.hypot(e.clientX - g.cx, e.clientY - g.cy); setPlaced((prev) => ({ ...prev, scale: clamp(+(g.startScale * (d / g.startDist)).toFixed(2), 0.4, 3) })) }
  }
  const onUp = (e) => { pointers.current.delete(e.pointerId); if (pointers.current.size < 2) pinch.current = null; if (pointers.current.size === 0) { gesture.current = null; setGesturing(false) } }
  const onWheel = (e) => { if (e.ctrlKey) setZoom((z) => clamp(+(z + (e.deltaY < 0 ? 0.12 : -0.12)).toFixed(2), 0.6, 3)) }
  const placeAt = (e) => { if (placed || gesture.current) return; const p = rel(e); setPlaced({ x: p.x, y: p.y, scale: sigType === 'lanit' ? 0.9 : 1 }) }
  const onStampDown = (e) => { e.stopPropagation(); gesture.current = { type: 'move' }; pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); setGesturing(true) }
  const onHandleDown = (e) => {
    e.stopPropagation()
    const r = e.currentTarget.closest('.sign-stamp').getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    gesture.current = { type: 'resize', cx, cy, startDist: Math.hypot(e.clientX - cx, e.clientY - cy) || 1, startScale: placed.scale }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); setGesturing(true)
  }


  // watermark ສະແດງຕອນ request ຍັງບໍ່ສຳເລັດ — ຫາຍໄປເມື່ອຄົນສຸດທ້າຍລົງນາມຄົບ
  const willBeDone = doc.signers.every((s) => actingId(s) === meId || s.status === 'signed')
  const hasRealFiles = files.some((f) => f.file) // ໄຟລ໌ຈິງທີ່ອັບໂຫລດ → ສະແດງ PDF ຈິງ + watermark
  const hasPlacements = hasRealFiles && (doc.placements?.length > 0) // ມີ sign field ຮາຍ signer
  // signers ສຳລັບ PdfViewer: ຄົນອื่น hasSig=ເຊັນแล้ว / ຕົນເອງ hasSig=false (ໃຊ້ fill/isMe ຕາມ per-box)
  const signersForPdf = doc.signers.map((s) => ({ id: s.id, name: nameOf(s.id), hasSig: s.id !== pOwner && s.status === 'signed' }))
  // ຜู้เซ็น เห็นเฉพาะช่องของตัวเอง + ช่องคนอื่นที่ເຊັນแล้ว (ບໍ່ເຫັນ pending ຄົນອື່ນ)
  const signedIds = new Set(doc.signers.filter((s) => s.status === 'signed').map((s) => s.id))
  const myPlacementIds = (doc.placements || []).filter((p) => p.signerId === pOwner).map((p) => p.id)
  const allFilled = myPlacementIds.length > 0 && myPlacementIds.every((id) => sigFilled.includes(id)) // ເຊັນຄົບທຸກຊ່ອງ
  // ຂໍ້ມູນລາຍເຊັນ (img + type + scale + ตำแหน่ง) ຂອງແຕ່ລະຊ່ອງ → ບັນທຶກ end-to-end
  const buildSigData = () => (hasPlacements
    ? sigFilled.map((pid) => ({ id: pid, img: sigType === 'img' ? sig : null, type: sigType, sealImg: mySig, date: dateStr, scale: mySigScales[pid] || 1, pos: mySigPos[pid] }))
    : [])
  const visiblePlacements = (doc.placements || []).filter((p) => p.signerId === pOwner || signedIds.has(p.signerId))
    .map((p) => mySigPos[p.id] ? { ...p, xPct: mySigPos[p.id].x, yPct: mySigPos[p.id].y } : p) // ຕຳແໜ່ງ override (ลากย้าย)
  const Pages = ({ withSig, final }) => (
    <div className={`sign-doc ${gesturing ? 'gesturing' : ''}`} ref={docRef}
      style={{ transform: `scale(${final ? 1 : zoom})`, transformOrigin: 'top center', touchAction: final ? 'auto' : 'none' }}
      onPointerDown={final ? undefined : onDown} onPointerMove={final ? undefined : onMove}
      onPointerUp={final ? undefined : onUp} onPointerCancel={final ? undefined : onUp}
      onWheel={final ? undefined : onWheel} onClick={final ? undefined : placeAt}>
      {hasRealFiles ? (
        <PdfViewer files={files} mode="preview" watermark={!(final && willBeDone)}
          activeSignerId={hasPlacements ? pOwner : null}
          placements={hasPlacements ? visiblePlacements : []} signers={hasPlacements ? signersForPdf : []}
          pageFooter={{ date: (() => { const s = doc.signers.filter((x) => x.status === 'signed' && x.time); return s.length ? s[s.length - 1].time : doc.date })(), docId: doc.id }}
          myFill={hasPlacements && sigFilled.length ? { signerId: pOwner, sigImg: sigType === 'img' ? sig : null, sigType, sealImg: mySig, date: dateStr, scales: mySigScales, filled: sigFilled } : null}
          onSigSetScale={final ? undefined : (pid, s) => setMySigScales((m) => ({ ...m, [pid]: clamp(+s.toFixed(2), 0.5, 2.5) }))}
          onSigMove={final ? undefined : (pid, x, y) => setMySigPos((m) => ({ ...m, [pid]: { x, y } }))}
          onSigDelete={final ? undefined : (pid) => setSigFilled((f) => f.filter((id) => id !== pid))}
          onSigEdit={final ? undefined : () => setStage('choose')}
          onAdd={noop} onMove={noop} onRemove={noop} />
      ) : files.map((f, i) => (
        <div className="sign-page" key={i}>
          <DocPageBody doc={doc} file={f} wm={!(final && willBeDone)} meId={pOwner} />
        </div>
      ))}
      {withSig && placed && !hasPlacements && (
        <div className={`sign-stamp ${sigType === 'lanit' ? 'lanit' : ''} ${final ? 'final' : ''}`} style={{ left: `${placed.x * 100}%`, top: `${placed.y * 100}%`, transform: `translate(-50%,-50%) scale(${placed.scale})` }}
          onPointerDown={final ? undefined : onStampDown}>
          {sigType === 'lanit' ? <LanitStamp sigImg={mySig} name={signerName} date={dateStr} /> : <img src={sig} alt="signature" draggable={false} />}
          {!final && (<>
            <button className="stamp-btn del" title="ລຶບ" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); delSig() }}><Icon.x /></button>
            <button className="stamp-btn edit" title="ປ່ຽນ" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setStage('choose') }}><Icon.pen /></button>
            <span className="stamp-handle" title="ຈັບເພື່ອຊູມ" onPointerDown={onHandleDown} />
          </>)}
        </div>
      )}
    </div>
  )

  // ── SUCCESS ──
  if (stage === 'success') {
    return (
      <div className="app">
        <Header title="ລົງນາມສຳເລັດ" onBack={onBack} right={
          <div className="hdr-actions">
            <button className="hdr-act" title="ແບ່ງປັນ" onClick={() => flash('ກຳລັງແບ່ງປັນເອກະສານ...')}><Icon.share /></button>
            <button className="hdr-act" title="ດາວໂຫລດ" onClick={() => flash('ກຳລັງດາວໂຫລດ PDF...')}><Icon.download /></button>
            <button className="hdr-act" title="ພິມ" onClick={() => flash('ກຳລັງສົ່ງໄປພິມ...')}><Icon.printer /></button>
          </div>
        } />
        <div className="scroll sign-scroll">
          <div className="sign-ok"><span className="sign-ok-ic"><Icon.check /></span><div className="sign-ok-txt"><b>{successMsg}</b><p>{sigType === 'original' ? 'ໄຟລ໌ທີ່ເຊັນດ້ວຍມືຖືກເກັບເປັນ "ສະບັບເຊັນມື" ແລ້ວ — ຕົ້ນສະບັບຍັງຢູ່ຄົບ ເບິ່ງທຽບກັນໄດ້' : 'ລາຍເຊັນຂອງທ່ານໄດ້ຖືກບັນທຶກໃສ່ເອກະສານແລ້ວ'}</p></div></div>
          {sigType === 'original'
            ? files.map((f, i) => originalFiles[i]?.type?.startsWith('image/')
              ? <div className="preview-frame" key={i}><img src={URL.createObjectURL(originalFiles[i])} alt={originalFiles[i].name} style={{ width: '100%', display: 'block' }} /></div>
              : <div className="preview-frame" key={i}><PdfViewer files={[{ name: originalFiles[i]?.name || f.name, file: originalFiles[i] }]} mode="preview" watermark={false} activeSignerId={null} placements={[]} signers={[]} onAdd={noop} onMove={noop} onRemove={noop} /></div>)
            : Pages({ withSig: true, final: true })}
        </div>
        <div className="footer"><button className="btn primary" onClick={() => (sigType === 'original' ? onOriginalSign(originalFiles) : onDone(doc.id, buildSigData()))}><Icon.check /> ກັບໜ້າຫຼັກ</button></div>
        {toast && <div className="sign-toast"><Icon.check /> {toast}</div>}
      </div>
    )
  }

  return (
    <div className="app">
      <Header title={stage === 'place' ? 'ວາງລາຍເຊັນ' : 'ລົງນາມເອກະສານ'} subtitle={doc.title} onBack={onBack} />

      <div className="scroll sign-scroll">
        {files.length > 1 && <p className="sign-count"><Icon.layers /> ເອກະສານ {files.length} ໄຟລ໌</p>}
        {Pages({ withSig: stage === 'place' })}
      </div>

      {/* floating zoom pill (ເອກະສານ) */}
      {stage === 'place' && (
        <div className="doc-zoom">
          <button title="ຂະຫຍາຍ" onClick={() => setZoom((z) => clamp(+(z + 0.2).toFixed(2), 0.6, 3))}><Icon.plus /></button>
          <em>{Math.round(zoom * 100)}%</em>
          <button title="ຫຍໍ້" onClick={() => setZoom((z) => clamp(+(z - 0.2).toFixed(2), 0.6, 3))}><Icon.minus /></button>
        </div>
      )}

      {/* footer per stage */}
      {stage === 'doc' && (
        <div className="footer"><button className="btn primary" onClick={() => setStage('choose')}><Icon.pen /> ລົງນາມ</button></div>
      )}
      {stage === 'place' && (
        <div className="sign-dock">
          {hasPlacements ? (<>
            <p className={`sign-hint ${allFilled ? '' : 'warn'}`}>
              {allFilled ? <Icon.checkCircle /> : <Icon.info />} ເຊັນແລ້ວ {sigFilled.length}/{myPlacementIds.length} ຊ່ອງ · {allFilled ? 'ພ້ອມຢືນຢັນ' : 'ຍັງເຊັນບໍ່ຄົບ'}
            </p>
            {allFilled
              ? <button className={`btn primary ${signing ? 'disabled' : ''}`} disabled={signing} onClick={doSign}>{signing ? <><span className="spinner" /> ກຳລັງບັນທຶກ...</> : <><Icon.check /> ຢືນຢັນລົງນາມ</>}</button>
              : <button className="btn primary" onClick={() => setStage('choose')}><Icon.pen /> ລົງນາມ (ເຊັນຊ່ອງທີ່ເຫຼືອ)</button>}
          </>) : placed ? (<>
            <p className="sign-hint"><Icon.info /> ລາກລາຍເຊັນເພື່ອຍ້າຍ · ຈັບມຸມ ◲ ເພື່ອຊູມ · 2 ນິ້ວ ຫຍໍ້/ຂະຫຍາຍເອກະສານ</p>
            <button className={`btn primary ${signing ? 'disabled' : ''}`} disabled={signing} onClick={doSign}>{signing ? <><span className="spinner" /> ກຳລັງບັນທຶກ...</> : <><Icon.check /> ຢືນຢັນລົງນາມ</>}</button>
          </>) : (<>
            <p className="sign-hint"><Icon.warn /> ຍັງບໍ່ມີລາຍເຊັນຢູ່ໃນເອກະສານ</p>
            <button className="btn primary" onClick={() => setStage('choose')}><Icon.pen /> ເລືອກລາຍເຊັນ</button>
          </>)}
        </div>
      )}

      {/* choose signature type */}
      {stage === 'choose' && (
        <div className="modal-overlay" onClick={() => setStage(placed ? 'place' : 'doc')}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b><Icon.pen /> ເລືອກປະເພດລາຍເຊັນ</b><button className="icon-mini" onClick={() => setStage(placed ? 'place' : 'doc')}><Icon.x /></button></div>
            <div style={{ padding: '10px 14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="sign-type" onClick={useSuperwork}>
                <span className="sign-type-ic sw"><Icon.pen /></span>
                <div><b>ລາຍເຊັນ Superwork</b><span>{mySig ? 'ໃຊ້ລາຍເຊັນທີ່ບັນທຶກໄວ້ (ວາງອັດຕະໂນມັດ)' : 'ວາດລາຍເຊັນໃໝ່'}</span></div>
                <Icon.chevron />
              </button>
              <button className="sign-type" onClick={useLanit}>
                <span className="sign-type-ic lanit"><Icon.checkCircle /></span>
                <div><b>ລາຍເຊັນ ຜ່ານ Lanit</b><span>ລາຍເຊັນ digital ຮັບຮອງ (certified)</span></div>
                <Icon.chevron />
              </button>
              <button className="sign-type" onClick={() => setStage('original')}>
                <span className="sign-type-ic original"><Icon.printer /></span>
                <div><b>ລາຍເຊັນຕົ້ນສະບັບ</b><span>ພິມ → ເຊັນດ້ວຍມື → ສະແກນ → ອັບໂຫລດກັບ</span></div>
                <Icon.chevron />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ລາຍເຊັນຕົ້ນສະບັບ (E2/E13) — ພິມ/ດາວໂຫລດ ທຸກໄຟລ໌ → ອັບໂຫລດ PDF ທີ່ເຊັນມືແລ້ວ ຄົບທຸກໄຟລ໌ (preview ໄດ້) → OTP */}
      {stage === 'original' && (
        <div className="modal-overlay" onClick={() => setStage('choose')}>
          {/* fit-content (ບໍ່ໃຊ້ .tall — ພື້ນຂາວຫວ່າງ = ເບິ່ງຄືພັງ, Lucky 19/07) */}
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b><Icon.printer /> ລາຍເຊັນຕົ້ນສະບັບ</b><button className="icon-mini" onClick={() => setStage('choose')}><Icon.x /></button></div>
            <div style={{ padding: '8px 14px 18px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>1. ດາວໂຫລດ/ພິມ (ບໍ່ມີລາຍນ້ຳ) → 2. ເຊັນດ້ວຍມື → 3. ອັບໂຫລດກັບ ຄົບທຸກໄຟລ໌ (ສະແກນ/ຖ່າຍຮູບ ຫຼື ເລືອກໄຟລ໌) → 4. ກວດ preview → 5. ຢືນຢັນ OTP</p>
              {files.map((f, i) => (
                <div className="orig-file-card" key={i}>
                  <p className="orig-file-name"><Icon.pdf /> {f.name}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="sign-type" onClick={() => downloadOriginal(i)}>
                      <span className="sign-type-ic sw"><Icon.download /></span>
                      <div><b>ດາວໂຫລດ / ພິມ</b><span>ໄຟລ໌ຕົ້ນສະບັບ ບໍ່ມີລາຍນ້ຳ — ນຳໄປເຊັນດ້ວຍມື</span></div>
                    </button>
                    {/* ອັບໂຫລດກັບ 2 ທາງ: ສະແກນ/ຖ່າຍຮູບ (ກ້ອງ) ຫຼື ເລືອກໄຟລ໌ຈາກມືຖື/ຄອມ (Lucky 19/07) */}
                    <input type="file" ref={(el) => (originalCamRefs.current[i] = el)} hidden accept="image/*" capture="environment" onChange={(e) => pickOriginalFile(i, e)} />
                    <input type="file" ref={(el) => (originalInputRefs.current[i] = el)} hidden accept="application/pdf,image/*" onChange={(e) => pickOriginalFile(i, e)} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="sign-type" style={{ flex: 1 }} onClick={() => originalCamRefs.current[i]?.click()}>
                        <span className="sign-type-ic original"><Icon.eye /></span>
                        <div><b>ສະແກນ / ຖ່າຍຮູບ</b><span>ໃຊ້ກ້ອງຖ່າຍເອກະສານ</span></div>
                      </button>
                      <button className="sign-type" style={{ flex: 1 }} onClick={() => originalInputRefs.current[i]?.click()}>
                        <span className="sign-type-ic lanit"><Icon.upload /></span>
                        <div><b>ເລືອກໄຟລ໌</b><span>PDF/ຮູບ ຈາກມືຖື ຫຼື ຄອມ</span></div>
                      </button>
                    </div>
                    {originalFiles[i] && (
                      <p className="orig-uploaded-note"><Icon.checkCircle /> ອັບໂຫລດແລ້ວ: {originalFiles[i].name}
                        <button className="dd-cmt-reply" style={{ marginTop: 0 }} onClick={() => setOriginalPreviewIdx(originalPreviewIdx === i ? null : i)}>
                          <Icon.eye /> {originalPreviewIdx === i ? 'ເຊື່ອງ' : 'ເບິ່ງ'}
                        </button>
                      </p>
                    )}
                    {/* preview ເປີດເອງທັນທີຫຼັງອັບໂຫລດ — ຕ້ອງກວດກ່ອນຢືນຢັນ */}
                    {originalPreviewIdx === i && originalFiles[i] && (
                      <div className="preview-frame" style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {originalFiles[i].type.startsWith('image/')
                          ? <img src={URL.createObjectURL(originalFiles[i])} alt={originalFiles[i].name} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
                          : <PdfViewer files={[{ name: originalFiles[i].name, file: originalFiles[i] }]} mode="preview" watermark={false} activeSignerId={null} placements={[]} signers={[]} onAdd={noop} onMove={noop} onRemove={noop} />}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button className={`btn primary ${allOriginalUploaded ? '' : 'disabled'}`} disabled={!allOriginalUploaded} onClick={startOriginalOtp}><Icon.shield /> ຢືນຢັນ OTP ແລະ ເຊັນ</button>
            </div>
          </div>
        </div>
      )}

      {/* draw popup (inline — ບໍ່ປ່ຽນໜ້າ) */}
      {stage === 'draw' && (
        <div className="modal-overlay" onClick={() => setStage('choose')}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b><Icon.pen /> ວາດລາຍເຊັນຂອງທ່ານ</b><button className="icon-mini" onClick={() => setStage('choose')}><Icon.x /></button></div>
            <div style={{ padding: '8px 14px 16px' }}>
              <SignaturePad onChange={setDrawn} />
              <div className="success-btns" style={{ marginTop: 12, maxWidth: 'none' }}>
                <button className="btn ghost" onClick={() => setStage('choose')}>ກັບຄືນ</button>
                <button className={`btn primary ${!drawn ? 'disabled' : ''}`} onClick={() => drawn && setSavePrompt(drawn)}>ຖັດໄປ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ຜົນລັບ: ລົງນາມສຳເລັດ — popup ດຽວກັນທຸກທີ່ */}
      {signPopup && (
        <ResultPopup title={successMsg} desc="ລາຍເຊັນຂອງທ່ານໄດ້ຖືກບັນທຶກໃສ່ເອກະສານແລ້ວ"
          onOk={() => { setSignPopup(false); onDone(doc.id, buildSigData()) }} />
      )}

      {/* ຖາມ: ບັນທຶກລາຍເຊັນນີ້ໄວ້ໃຊ້ຄັ້ງຕໍ່ໄປບໍ (bottom sheet) */}
      {savePrompt && (
        <div className="modal-overlay" onClick={() => { const s = savePrompt; setSavePrompt(null); startPlace(s, 'img') }}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b><Icon.pen /> ບັນທຶກລາຍເຊັນນີ້?</b><button className="icon-mini" onClick={() => { const s = savePrompt; setSavePrompt(null); startPlace(s, 'img') }}><Icon.x /></button></div>
            <div style={{ padding: '6px 16px 18px' }}>
              <p className="muted" style={{ margin: '0 0 10px', fontSize: 13 }}>ບັນທຶກໄວ້ໃນ ຕັ້ງຄ່າ ເພື່ອໃຊ້ອັດຕະໂນມັດ ຄັ້ງຕໍ່ໄປ (ບໍ່ຕ້ອງວາດໃໝ່)</p>
              <div className="set-sig-box" style={{ margin: '0 0 14px' }}><img src={savePrompt} alt="signature" /></div>
              <div className="success-btns" style={{ maxWidth: 'none' }}>
                <button className="btn ghost" onClick={() => { const s = savePrompt; setSavePrompt(null); startPlace(s, 'img') }}>ບໍ່ບັນທຶກ</button>
                <button className="btn primary" onClick={() => { const s = savePrompt; onSaveSig && onSaveSig(s); setSavePrompt(null); startPlace(s, 'img') }}><Icon.check /> ບັນທຶກ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LANIT — ກຳລັງເຊື່ອມຕໍ່ */}
      {stage === 'connecting' && (
        <div className="modal-overlay"><div className="sign-connecting"><span className="spinner" /> ກຳລັງເຊື່ອມຕໍ່ກັບ LANIT...</div></div>
      )}

      {/* LANIT — OTP / PIN verification */}
      {stage === 'otp' && (
        <div className="modal-overlay">
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            {/* X ຈາກ OTP ຂອງ flow ຕົ້ນສະບັບ → ກັບໜ້າອັບໂຫລດ (ບໍ່ແມ່ນໜ້າເລືອກວິທີ — ຂອງທີ່ອັບໂຫລດຍັງຢູ່ຄົບ) */}
            <div className="modal-head"><b><Icon.shield /> ຢືນຢັນຕົວຕົນ{otpFor === 'original' ? '' : ' LANIT'}</b><button className="icon-mini" onClick={() => setStage(otpFor === 'original' ? 'original' : 'choose')}><Icon.x /></button></div>
            <div style={{ padding: '6px 18px 20px', textAlign: 'center' }}>
              <span className="otp-ic"><Icon.shield /></span>
              <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
                {otpFor === 'original'
                  ? 'ປ້ອນລະຫັດ OTP 6 ຫຼັກ ທີ່ສົ່ງໄປຫາເບີໂທ/ອີເມວທີ່ລົງທະບຽນໄວ້ ເພື່ອຢືນຢັນຕົວຕົນ ກ່ອນອັບໂຫລດເອກະສານທີ່ເຊັນດ້ວຍມື'
                  : 'ປ້ອນລະຫັດ OTP 6 ຫຼັກ ທີ່ສົ່ງໄປຫາເບີໂທ/ອີເມວທີ່ລົງທະບຽນກັບ LANIT CA'}
              </p>
              <div className="otp-row">
                {otp.map((d, i) => (
                  <input key={i} ref={(el) => (otpRefs.current[i] = el)} className="otp-box" inputMode="numeric" maxLength={1} value={d}
                    autoComplete="off" data-lpignore="true"
                    onChange={(e) => setOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus() }} />
                ))}
              </div>
              <button className={`btn primary ${otpFull ? '' : 'disabled'}`} style={{ width: '100%' }} onClick={submitOtp}><Icon.shield /> ຢືນຢັນ & ລົງນາມ</button>
              <button className={`otp-resend ${resendIn > 0 ? 'off' : ''}`} disabled={resendIn > 0} onClick={resendOtp}>
                {resendIn > 0 ? `ສົ່ງ OTP ອີກຄັ້ງ (${resendIn}s)` : 'ສົ່ງ OTP ອີກຄັ້ງ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* biometric — Face ID / ລາຍນິ້ວມື */}
      {stage === 'bio' && (
        <div className="modal-overlay">
          <div className="sign-face" onClick={(e) => e.stopPropagation()}>
            <span className="sign-face-ic"><Icon.shield /></span>
            <b>ຢືນຢັນຕົວຕົນ</b>
            <p>ສະແກນ Face ID ຫຼື ລາຍນິ້ວມື ເພື່ອລົງນາມເອກະສານ</p>
            <div className="bio-icons"><span><Icon.user /></span><span><Icon.finger /></span></div>
            <div className="success-btns" style={{ maxWidth: 'none' }}>
              <button className="btn ghost" onClick={() => setStage('place')}>ຍົກເລີກ</button>
              <button className="btn primary" onClick={() => setSignPopup(true)}><Icon.shield /> ສະແກນ (demo)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
