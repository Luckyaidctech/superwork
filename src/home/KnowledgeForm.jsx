import { useState, useRef, useMemo } from 'react'
import { Icon, Header, initials } from '../flow/shared.jsx'
import { approvalChain, KN_CATS, KN_TEAMS, KN_TYPES } from './data.js'
import FilePreviewModal from '../flow/FilePreviewModal.jsx'

const MAX_OVERVIEW = 200
const TODAY = '16/07/2026'

export default function KnowledgeForm({ me, onSubmit, onClose }) {
  const [type, setType] = useState('text')
  const [title, setTitle] = useState('')
  const [overview, setOverview] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [img, setImg] = useState(null)
  const [files, setFiles] = useState([])
  const [cats, setCats] = useState([])
  const [teams, setTeams] = useState(['ທັງໝົດ'])
  const [quiz, setQuiz] = useState(false)
  const [assignment, setAssignment] = useState(false)
  const [reward, setReward] = useState(false)
  const [preview, setPreview] = useState(null)
  const [tried, setTried] = useState(false)
  const imgRef = useRef(null)
  const fileRef = useRef(null)
  const refs = { title: useRef(null), content: useRef(null), cats: useRef(null) }

  const chain = useMemo(() => approvalChain(me, 'knowledge'), [me])

  // ── ກວດຄວາມຄົບຖ້ວນ (ຮ່າງ: ຫົວຂໍ້ພໍ · ເຜີຍແຜ່: ຕ້ອງຄົບ) ──
  const missing = []
  if (!title.trim()) missing.push({ k: 'title', t: 'ຫົວຂໍ້' })
  if (!overview.trim()) missing.push({ k: 'title', t: 'ພາບລວມ' })
  if (type === 'text' && !content.trim()) missing.push({ k: 'content', t: 'ເນື້ອໃນ' })
  if (type === 'youtube' && !url.trim()) missing.push({ k: 'content', t: 'ລິ້ງ YouTube' })
  if (type === 'pdf' && !files.length) missing.push({ k: 'content', t: 'ໄຟລ໌ PDF' })
  if (!cats.length) missing.push({ k: 'cats', t: 'ໝວດ' })
  const okPublish = missing.length === 0
  const okDraft = title.trim().length > 0

  const pickImg = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    setImg(URL.createObjectURL(f)); e.target.value = ''
  }
  const pickFiles = (e) => {
    const fs = [...e.target.files].map((f) => ({ name: f.name, size: f.size, type: f.type, file: f, url: null }))
    setFiles((p) => [...p, ...fs]); e.target.value = ''
  }
  const build = () => ({
    type, title: title.trim(), note: overview.trim(), date: TODAY,
    ...(type === 'text' ? { content: content.trim() } : {}),
    ...(type === 'youtube' ? { url: url.trim() } : {}),
    ...(type === 'pdf' ? { files } : {}),
    ...(img ? { img } : {}),
    cats, teams, quiz, assignment, reward, approvers: chain.map((p) => p.id),
  })
  const submit = (publish) => {
    setTried(true)
    if (publish && !okPublish) { refs[missing[0].k]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    if (!publish && !okDraft) { refs.title.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    onSubmit(build(), publish)
  }

  return (
    <div className="app rf-screen">
      <Header title="ສ້າງໂພສຄວາມຮູ້" onBack={onClose} />
      <div className="scroll rf-scroll">

        {/* ປະເພດ */}
        <section className="rf-card">
          <div className="rf-head"><span className="rf-head-ic"><Icon.bulb /></span><b>ປະເພດ</b></div>
          <div className="rf-seg">
            {KN_TYPES.map((t) => (
              <button key={t.v} className={type === t.v ? 'on' : ''} onClick={() => setType(t.v)}>{t.label}</button>
            ))}
          </div>
        </section>

        {/* ຫົວຂໍ້ + ພາບລວມ */}
        <section className={`rf-card ${tried && (!title.trim() || !overview.trim()) ? 'err' : ''}`} ref={refs.title}>
          <div className="rf-head"><span className="rf-head-ic"><Icon.doc /></span><b>ຫົວຂໍ້</b><i className="rf-req">ຈຳເປັນ</i></div>
          <input className="rf-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ຫົວຂໍ້ໂພສ..." />
          <label className="rf-label">ພາບລວມ <span className="rf-count">{overview.length}/{MAX_OVERVIEW}</span></label>
          <textarea className="rf-input rf-ta" rows={2} maxLength={MAX_OVERVIEW} value={overview}
            onChange={(e) => setOverview(e.target.value)} placeholder="ສະຫຼຸບສັ້ນໆ ວ່າໂພສນີ້ກ່ຽວກັບຫຍັງ..." />
        </section>

        {/* ເນື້ອໃນ ຕາມປະເພດ */}
        <section className={`rf-card ${tried && missing.some((m) => m.k === 'content') ? 'err' : ''}`} ref={refs.content}>
          <div className="rf-head"><span className="rf-head-ic">{Icon[KN_TYPES.find((t) => t.v === type).ic]()}</span><b>ເນື້ອໃນ</b><i className="rf-req">ຈຳເປັນ</i></div>
          {type === 'text' && (
            <textarea className="rf-input rf-ta" rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="ຂຽນເນື້ອໃນທີ່ຢາກແບ່ງປັນ..." />
          )}
          {type === 'youtube' && (
            <input className="rf-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/..." />
          )}
          {type === 'pdf' && (<>
            <button className="rf-drop" onClick={() => fileRef.current?.click()}>
              <Icon.upload /><b>ແຕະເພື່ອເລືອກໄຟລ໌ PDF</b><span>PDF ເທົ່ານັ້ນ · ບໍ່ເກີນ 10 MB</span>
            </button>
            <input ref={fileRef} type="file" hidden accept=".pdf" onChange={pickFiles} />
            {files.length > 0 && (
              <div className="rf-files">
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
        </section>

        {/* ຮູບໜ້າປົກ */}
        <section className="rf-card">
          <div className="rf-head"><span className="rf-head-ic"><Icon.image /></span><b>ຮູບໜ້າປົກ</b><i className="rf-opt">ບໍ່ບັງຄັບ</i></div>
          {img ? (
            <div className="kn-img-wrap">
              <img src={img} alt="" />
              <button className="cmt-preview-x" onClick={() => setImg(null)}><Icon.x /></button>
            </div>
          ) : (
            <button className="rf-drop" onClick={() => imgRef.current?.click()}>
              <Icon.image /><b>ແຕະເພື່ອເລືອກຮູບ</b><span>jpg, png, webp</span>
            </button>
          )}
          <input ref={imgRef} type="file" hidden accept="image/*" onChange={pickImg} />
        </section>

        {/* ໝວດ — ເລືອກໄດ້ຫຼາຍ */}
        <section className={`rf-card ${tried && !cats.length ? 'err' : ''}`} ref={refs.cats}>
          <div className="rf-head"><span className="rf-head-ic"><Icon.layers /></span><b>ໝວດ</b><i className="rf-req">ຈຳເປັນ</i>
            <span className="rf-count">ເລືອກແລ້ວ {cats.length}</span></div>
          <div className="rf-chips">
            {KN_CATS.map((c) => (
              <button key={c} className={`rf-chip sm ${cats.includes(c) ? 'on' : ''}`}
                onClick={() => setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))}>{c}</button>
            ))}
          </div>
        </section>

        {/* ທີມ */}
        <section className="rf-card">
          <div className="rf-head"><span className="rf-head-ic"><Icon.users /></span><b>ທີມ</b></div>
          <div className="rf-chips">
            {KN_TEAMS.map((t) => (
              <button key={t} className={`rf-chip sm ${teams.includes(t) ? 'on' : ''}`}
                onClick={() => setTeams((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}>{t}</button>
            ))}
          </div>
        </section>

        {/* ອົງປະກອບເສີມ */}
        <section className="rf-card">
          <div className="rf-head"><span className="rf-head-ic"><Icon.checkCircle /></span><b>ອົງປະກອບເສີມ</b><i className="rf-opt">ບໍ່ບັງຄັບ</i></div>
          {[
            { v: quiz, set: setQuiz, t: 'Quiz', d: 'ໃຫ້ຜູ້ອ່ານເຮັດແບບທົດສອບ' },
            { v: assignment, set: setAssignment, t: 'Assignment', d: 'ມອບໝາຍວຽກຫຼັງອ່ານ' },
            { v: reward, set: setReward, t: 'Reward', d: 'ໃຫ້ຄະແນນ Workboard' },
          ].map((o) => (
            <button key={o.t} className="kn-toggle" onClick={() => o.set(!o.v)}>
              <div><b>{o.t}</b><span>{o.v ? 'ເປີດ' : `ປິດ · ${o.d}`}</span></div>
              <span className={`kn-sw ${o.v ? 'on' : ''}`}><i /></span>
            </button>
          ))}
        </section>

        {/* ຜູ້ກວດສອບ */}
        <section className="rf-card">
          <div className="rf-head"><span className="rf-head-ic"><Icon.checkCircle /></span><b>ຜູ້ກວດສອບ</b><i className="rf-opt">ອັດຕະໂນມັດ</i></div>
          <div className="rf-chain">
            {chain.map((p, i) => (
              <div className="rf-step" key={p.id}>
                <span className={`rf-step-n ${i === 0 ? 'first' : ''}`}>{i + 1}</span>
                <span className="rf-step-av">{initials(p.name)}</span>
                <div><b>{p.name}</b><span>{p.role}</span></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="rf-foot">
        {tried && !okPublish && <p className="rf-missing"><Icon.warn /> ຍັງຂາດ: {missing.map((m) => m.t).join(' · ')}</p>}
        <div className="success-btns" style={{ maxWidth: 'none' }}>
          <button className={`btn ghost ${okDraft ? '' : 'disabled'}`} onClick={() => submit(false)}><Icon.doc /> ບັນທຶກຮ່າງ</button>
          <button className={`btn primary ${okPublish ? '' : 'soft'}`} onClick={() => submit(true)}><Icon.send /> ສົ່ງກວດສອບ</button>
        </div>
      </div>

      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
