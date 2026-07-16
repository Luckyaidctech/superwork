import { useState, useRef, useMemo } from 'react'
import { Icon, Header, initials } from '../flow/shared.jsx'
import { approvalChain, KN_CATS, KN_TEAMS, KN_TYPES } from './data.js'
import PickSheet from './PickSheet.jsx'
import FilePreviewModal from '../flow/FilePreviewModal.jsx'

const MAX_OVERVIEW = 200
const MAX_IMG = 10
const TODAY = '16/07/2026'
const LAYOUTS = [{ v: 'grid', t: 'Grid', ic: 'layers' }, { v: 'carousel', t: 'Carousel', ic: 'image' }, { v: 'stack', t: 'Stack', ic: 'doc' }]

// ── ຊ່ອງກອກ ແບບ inline label (ປ້າຍນ້ອຍຢູ່ໃນກອບ) — ອ່ານງ່າຍ ບໍ່ເປືອງທີ່ ──
function Field({ label, req, err, count, children }) {
  return (
    <label className={`kf-field ${err ? 'err' : ''}`}>
      <span className="kf-label">{label}{req && <i>*</i>}{count && <em>{count}</em>}</span>
      {children}
    </label>
  )
}

export default function KnowledgeForm({ me, onSubmit, onClose }) {
  const [type, setType] = useState('text')
  const [title, setTitle] = useState('')
  const [overview, setOverview] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [imgs, setImgs] = useState([])
  const [layout, setLayout] = useState('grid')
  const [files, setFiles] = useState([])
  const [cats, setCats] = useState([])
  const [teams, setTeams] = useState(['ທັງໝົດ'])
  const [quiz, setQuiz] = useState(false)
  const [assignment, setAssignment] = useState(false)
  const [reward, setReward] = useState(false)
  const [pick, setPick] = useState(null)
  const [preview, setPreview] = useState(null)
  const [tried, setTried] = useState(false)
  const imgRef = useRef(null)
  const fileRef = useRef(null)
  const refs = { title: useRef(null), content: useRef(null), cats: useRef(null) }

  const chain = useMemo(() => approvalChain(me, 'knowledge'), [me])
  const t = KN_TYPES.find((x) => x.v === type)

  const missing = []
  if (!title.trim()) missing.push({ k: 'title', t: 'ຫົວຂໍ້' })
  if (!overview.trim()) missing.push({ k: 'title', t: 'ພາບລວມ' })
  if (type === 'text' && !content.trim()) missing.push({ k: 'content', t: 'ເນື້ອໃນ' })
  if (type === 'youtube' && !url.trim()) missing.push({ k: 'content', t: 'ລິ້ງ YouTube' })
  if (type === 'pdf' && !files.length) missing.push({ k: 'content', t: 'ໄຟລ໌ PDF' })
  if (!cats.length) missing.push({ k: 'cats', t: 'ໝວດ' })
  const okPublish = missing.length === 0
  const okDraft = title.trim().length > 0

  const pickImgs = (e) => {
    const fs = [...e.target.files].slice(0, MAX_IMG - imgs.length).map((f) => URL.createObjectURL(f))
    setImgs((p) => [...p, ...fs]); e.target.value = ''
  }
  const pickFiles = (e) => {
    const fs = [...e.target.files].map((f) => ({ name: f.name, size: f.size, type: f.type, file: f, url: null }))
    setFiles((p) => [...p, ...fs]); e.target.value = ''
  }
  const submit = (publish) => {
    setTried(true)
    if (publish && !okPublish) { refs[missing[0].k]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    if (!publish && !okDraft) { refs.title.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    onSubmit({
      type, title: title.trim(), note: overview.trim(), date: TODAY,
      ...(type === 'text' ? { content: content.trim() } : {}),
      ...(type === 'youtube' ? { url: url.trim() } : {}),
      ...(type === 'pdf' ? { files } : {}),
      ...(imgs.length ? { img: imgs[0], imgs, layout } : {}),
      cats, teams, quiz, assignment, reward, approvers: chain.map((p) => p.id),
    }, publish)
  }

  return (
    <div className="app rf-screen">
      <Header title="ສ້າງໂພສຄວາມຮູ້" onBack={onClose} />
      <div className="scroll kf-scroll">

        {/* ປະເພດ — segmented ມີໄອຄອນ + ຕິກ */}
        <p className="kf-sec">ປະເພດ</p>
        <div className="kf-seg">
          {KN_TYPES.map((x) => (
            <button key={x.v} className={type === x.v ? 'on' : ''} onClick={() => setType(x.v)}>
              {type === x.v ? <Icon.check /> : Icon[x.ic]()}
              {x.label}
            </button>
          ))}
        </div>

        <p className="kf-sec">ລາຍລະອຽດ</p>
        <div className="kf-panel" ref={refs.title}>
          <Field label="ຫົວຂໍ້" req err={tried && !title.trim()}>
            <input className="kf-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ຫົວຂໍ້ໂພສ..." />
          </Field>
          <Field label="ພາບລວມ" req err={tried && !overview.trim()} count={`${overview.length}/${MAX_OVERVIEW}`}>
            <textarea className="kf-input" rows={2} maxLength={MAX_OVERVIEW} value={overview}
              onChange={(e) => setOverview(e.target.value)} placeholder="ສະຫຼຸບສັ້ນໆ ວ່າໂພສນີ້ກ່ຽວກັບຫຍັງ..." />
          </Field>
        </div>

        {/* ເນື້ອໃນ ຕາມປະເພດ */}
        <div ref={refs.content}>
          {type === 'text' && (
            <div className="kf-panel" style={{ marginTop: 10 }}>
              <Field label="ເນື້ອໃນ" req err={tried && !content.trim()}>
                <textarea className="kf-input" rows={7} value={content} onChange={(e) => setContent(e.target.value)} placeholder="ຂຽນເນື້ອໃນທີ່ຢາກແບ່ງປັນ..." />
              </Field>
            </div>
          )}
          {type === 'youtube' && (
            <div className="kf-panel" style={{ marginTop: 10 }}>
              <Field label="ລິ້ງ YouTube" req err={tried && !url.trim()}>
                <input className="kf-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/..." />
              </Field>
            </div>
          )}
          {type === 'pdf' && (<>
            <p className="kf-sec">ໄຟລ໌ PDF <i className="kf-star">*</i></p>
            <button className={`kf-add ${tried && !files.length ? 'err' : ''}`} onClick={() => fileRef.current?.click()}>
              <span className="kf-add-ic"><Icon.pdf /></span>
              <b>ເລືອກໄຟລ໌ PDF</b>
              <Icon.chevron />
            </button>
            <input ref={fileRef} type="file" hidden accept=".pdf" onChange={pickFiles} />
            <p className="kf-hint">ຮັບສະເພາະ PDF · ບໍ່ເກີນ 10 MB</p>
            {files.length > 0 && (
              <div className="rf-files" style={{ marginTop: 8 }}>
                {files.map((f, i) => (
                  <div className="rf-file" key={i}>
                    <button className="rf-file-open" onClick={() => setPreview({ name: f.name, file: f.file })}>
                      <span className="rf-file-ic"><Icon.doc /></span>
                      <div><b>{f.name}</b><span>{(f.size / 1024).toFixed(0)} KB</span></div>
                      <Icon.eye />
                    </button>
                    <button className="icon-mini" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}><Icon.x /></button>
                  </div>
                ))}
              </div>
            )}
          </>)}
        </div>

        {/* ຮູບ — ຫຼາຍຮູບ + ຮູບແບບການສະແດງ */}
        <p className="kf-sec">ຮູບ <em>ບໍ່ບັງຄັບ</em></p>
        {imgs.length > 0 && (<>
          <p className="kf-sub">ຮູບແບບການສະແດງ</p>
          <div className="kf-lay">
            {LAYOUTS.map((l) => (
              <button key={l.v} className={layout === l.v ? 'on' : ''} onClick={() => setLayout(l.v)}>{Icon[l.ic]()}{l.t}</button>
            ))}
          </div>
          <div className={`kf-imgs ${layout}`}>
            {imgs.map((src, i) => (
              <div className="kf-img" key={i}>
                <img src={src} alt="" />
                <button className="kf-img-x" onClick={() => setImgs((p) => p.filter((_, j) => j !== i))}><Icon.x /></button>
              </div>
            ))}
          </div>
        </>)}
        <button className="kf-add" disabled={imgs.length >= MAX_IMG} onClick={() => imgRef.current?.click()}>
          <span className="kf-add-ic"><Icon.image /></span>
          <b>{imgs.length ? `ເພີ່ມຮູບ (${imgs.length}/${MAX_IMG})` : 'ເລືອກຮູບ'}</b>
          <Icon.chevron />
        </button>
        <input ref={imgRef} type="file" hidden multiple accept="image/*" onChange={pickImgs} />

        {/* ໝວດ */}
        <div ref={refs.cats}>
          <p className="kf-sec">ໝວດ <i className="kf-star">*</i><em>ຕ້ອງເລືອກກ່ອນເຜີຍແຜ່</em></p>
          <div className={`kf-chips ${tried && !cats.length ? 'err' : ''}`}>
            {KN_CATS.map((c) => (
              <button key={c} className={cats.includes(c) ? 'on' : ''}
                onClick={() => setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))}>
                {cats.includes(c) && <Icon.check />}{c}
              </button>
            ))}
          </div>
        </div>

        {/* ທີມ */}
        <p className="kf-sec">ທີມ</p>
        <button className="kf-add" onClick={() => setPick('teams')}>
          <span className="kf-add-ic"><Icon.users /></span>
          <b>{teams.length ? teams.join(' · ') : 'ເລືອກທີມ'}</b>
          <Icon.chevron />
        </button>

        {/* ອົງປະກອບເສີມ */}
        <p className="kf-sec">ອົງປະກອບເສີມ</p>
        <div className="kf-panel">
          {[
            { v: quiz, set: setQuiz, t: 'ແບບທົດສອບ (Quiz)', d: 'ໃຫ້ຜູ້ອ່ານເຮັດແບບທົດສອບ' },
            { v: assignment, set: setAssignment, t: 'ມອບໝາຍວຽກ (Assignment)', d: 'ມອບໝາຍວຽກຫຼັງອ່ານຈົບ' },
            { v: reward, set: setReward, t: 'ລາງວັນ (Reward)', d: 'ໃຫ້ຄະແນນ Workboard' },
          ].map((o) => (
            <button key={o.t} className="kn-toggle" onClick={() => o.set(!o.v)}>
              <div><b>{o.t}</b><span>{o.v ? 'ເປີດ' : `ປິດ · ${o.d}`}</span></div>
              <span className={`kn-sw ${o.v ? 'on' : ''}`}><i /></span>
            </button>
          ))}
        </div>

        {/* ຜູ້ກວດສອບ */}
        <p className="kf-sec">ຜູ້ກວດສອບ <em>ອັດຕະໂນມັດ</em></p>
        <div className="kf-chain">
          {chain.map((p, i) => (
            <div className="rf-step" key={p.id}>
              <span className={`rf-step-n ${i === 0 ? 'first' : ''}`}>{i + 1}</span>
              <span className="rf-step-av">{initials(p.name)}</span>
              <div><b>{p.name}</b><span>{p.role}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="rf-foot">
        {tried && !okPublish && <p className="rf-missing"><Icon.warn /> ຍັງຂາດ: {missing.map((m) => m.t).join(' · ')}</p>}
        <div className="success-btns" style={{ maxWidth: 'none' }}>
          <button className={`btn ghost ${okDraft ? '' : 'disabled'}`} onClick={() => submit(false)}><Icon.doc /> ບັນທຶກຮ່າງ</button>
          <button className={`btn primary ${okPublish ? '' : 'soft'}`} onClick={() => submit(true)}><Icon.send /> ສົ່ງກວດສອບ</button>
        </div>
      </div>

      {pick === 'teams' && (
        <PickSheet label="ເລືອກທີມ" options={KN_TEAMS} value={teams[0]}
          onPick={(v) => { setTeams([v]); setPick(null) }} onClose={() => setPick(null)} />
      )}
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
