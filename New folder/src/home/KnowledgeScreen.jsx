import { useState, useEffect } from 'react'
import { Icon, Header, ResultPopup, ReasonModal, initials, ScreenPortal } from '../flow/shared.jsx'
import { nameOf, colorOf, avatarOf, approvalChain, approvedCount, sortPendingFirst, KN_CATS, KN_TYPES, KN_STATUS } from './data.js'
import KnowledgeForm from './KnowledgeForm.jsx'
import CommentBox from './CommentBox.jsx'
import { ReqActivityHistory } from './RequestScreen.jsx'
import FilePreviewModal from '../flow/FilePreviewModal.jsx'

const avBg = (id) => { const u = avatarOf(id); return u ? { backgroundImage: `url("${u}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: colorOf(id) } }
const typeOf = (t) => KN_TYPES.find((x) => x.v === t) || KN_TYPES[0]

// ── ການ໌ດໂພສ — ໃຊ້ທັງ Feed ແລະ "ຂອງຂ້ອຍ" (ຕ່າງກັນແຕ່ badge ສະຖານະ) ──
function KnCard({ p, me, showStatus, onOpen }) {
  const st = KN_STATUS[p.status] || KN_STATUS.progress
  const t = typeOf(p.type)
  return (
    <button className="kn-card" onClick={() => onOpen(p)}>
      <div className={`kn-cover ${p.type}`}>
        {p.img ? <img src={p.img} alt="" /> : <span className="kn-cover-ic">{Icon[t.ic]()}</span>}
        {showStatus && <span className={`req-badge ${st.c} kn-cover-badge`}>{st.t}</span>}
      </div>
      <div className="kn-body">
        <div className="kn-cats">
          {(p.cats || []).map((c) => <span className="kn-cat" key={c}>{c}</span>)}
        </div>
        <b className="kn-title">{p.title}</b>
        <span className="kn-meta">
          <span className="kn-av" style={avBg(p.byId)}>{!avatarOf(p.byId) && initials(nameOf(p.byId))}</span>
          {nameOf(p.byId)}
          <em><Icon.clock /> {p.date}</em>
          {p.status === 'approved' && <em><Icon.eye /> {p.views || 0}</em>}
        </span>
        {p.status === 'approved' && (
          <div className="kn-stats">
            <span className={(p.likes || []).includes(me) ? 'on' : ''}><Icon.check /> {(p.likes || []).length} ຖືກໃຈ</span>
            <span><Icon.reply /> {(p.comments || []).length} ຄຳເຫັນ</span>
          </div>
        )}
      </div>
    </button>
  )
}

// ── ເນື້ອໃນໜ້າລາຍລະອຽດໂພສ — ໃຊ້ຮ່ວມ: ໂມດູນຄວາມຮູ້ ແລະ ໂມດູນອະນຸມັດ ──
export function KnowledgeDetailBody({ post, me, onPreview }) {
  const st = KN_STATUS[post.status] || KN_STATUS.progress
  const t = typeOf(post.type)
  const chain = approvalChain(post.byId, 'knowledge')
  return (<>
    {/* ຫຼາຍຮູບ → ສະແດງຕາມ layout ທີ່ຜູ້ຂຽນເລືອກ (grid/carousel/stack) · ຮູບດຽວ/ບໍ່ມີ → hero */}
    {post.imgs?.length > 1 ? (
      <div className={`kf-imgs ${post.layout || 'grid'}`} style={{ marginBottom: 12 }}>
        {post.imgs.map((src, i) => <div className="kf-img" key={i}><img src={src} alt="" /></div>)}
      </div>
    ) : (
      <div className={`kn-hero ${post.type}`}>
        {post.img ? <img src={post.img} alt="" /> : <span className="kn-cover-ic">{Icon[t.ic]()}</span>}
      </div>
    )}

    <div className="ptd-tl-card">
      <div className="kn-cats" style={{ marginBottom: 8 }}>
        {(post.cats || []).map((c) => <span className="kn-cat" key={c}>{c}</span>)}
        <span className={`req-badge ${st.c}`} style={{ marginLeft: 'auto' }}>{st.t}</span>
      </div>
      <b className="kn-d-title">{post.title}</b>
      <p className="kn-d-overview">{post.note}</p>
      <div className="kn-d-meta">
        <span className="kn-av" style={avBg(post.byId)}>{!avatarOf(post.byId) && initials(nameOf(post.byId))}</span>
        <div><b>{nameOf(post.byId)}</b><span>{post.date}</span></div>
        {post.status === 'approved' && <span className="req-chip"><Icon.eye /> {post.views || 0}</span>}
      </div>
    </div>

    {post.reason && (
      <p className="dd-note rej"><Icon.warn /> ຖືກປະຕິເສດ — {post.reason}</p>
    )}

    {/* ເນື້ອໃນ ຕາມປະເພດ: ຂໍ້ຄວາມ / YouTube / PDF */}
    <div className="ptd-tl-card">
      <p className="ptd-card-label">{Icon[t.ic]()} ເນື້ອໃນ · {t.label}</p>
      {post.type === 'text' && <p className="kn-content">{post.content}</p>}
      {post.type === 'youtube' && (
        <a className="kn-yt" href={post.url} target="_blank" rel="noreferrer">
          <span className="kn-yt-ic"><Icon.video /></span>
          <div><b>ເປີດເບິ່ງ ໃນ YouTube</b><span>{post.url}</span></div>
          <Icon.chevron />
        </a>
      )}
      {post.type === 'pdf' && (post.files?.length > 0
        ? (
          <div className="rf-files">
            {post.files.map((f, i) => (
              <button className="rf-file tap" key={i} onClick={() => onPreview?.({ name: f.name, file: f.file })}>
                <span className="rf-file-ic"><Icon.doc /></span>
                <div><b>{f.name}</b><span>{(f.size / 1024).toFixed(0)} KB</span></div>
                <Icon.eye />
              </button>
            ))}
          </div>
        ) : <p className="empty-list sm">ບໍ່ມີໄຟລ໌ແນບ</p>)}
    </div>

    {/* ທີມ + ອົງປະກອບເສີມ */}
    <div className="ptd-info">
      <div className="ptd-info-row">
        <span className="ptd-info-ic"><Icon.users /></span>
        <div className="ptd-info-txt"><span>ທີມ</span><b>{(post.teams || ['ທັງໝົດ']).join(' · ')}</b></div>
      </div>
      {(post.quiz || post.assignment || post.reward) && (
        <div className="ptd-info-row">
          <span className="ptd-info-ic"><Icon.checkCircle /></span>
          <div className="ptd-info-txt col">
            <span>ອົງປະກອບເສີມ</span>
            <div className="ptd-tasks">
              {post.quiz && <span className="ptd-task"><Icon.check /> Quiz</span>}
              {post.assignment && <span className="ptd-task"><Icon.check /> Assignment</span>}
              {post.reward && <span className="ptd-task"><Icon.check /> Reward</span>}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ສະຖານະ — ສາຍດຽວກັບຄຳຂໍອື່ນ */}
    {post.status !== 'draft' && (
      <div className="ptd-tl-card">
        <p className="ptd-card-label">ສະຖານະໂພສ</p>
        <div className="dd-audit">
          <div className="aud ok">
            <span className="aud-ic"><Icon.checkCircle /></span>
            <div className="aud-body"><span className="aud-t">ສ້າງໂພສ</span><span className="aud-tm">{nameOf(post.byId)} · {post.date}</span></div>
          </div>
          {chain.map((p, i) => {
            // ຫຼາຍຂັ້ນ: ນັບຈາກ approvedBy ຄືກັບຄຳຂໍທົ່ວໄປ (helper ດຽວກັນ)
            const okCount = post.status === 'approved' ? chain.length : approvedCount(post)
            const cls = i < okCount ? 'ok' : post.status === 'rejected' ? (i === okCount ? 'rej' : '') : post.status === 'progress' && i === okCount ? 'now' : ''
            const label = i < okCount || post.status === 'approved' ? (post.status === 'approved' && i === chain.length - 1 ? 'ອະນຸມັດ & ເຜີຍແຜ່ແລ້ວ' : 'ອະນຸມັດແລ້ວ')
              : post.status === 'rejected' ? (i === okCount ? 'ປະຕິເສດ' : 'ບໍ່ໄດ້ດຳເນີນການ')
                : i === okCount ? 'ລໍຖ້າກວດສອບ' : 'ລໍຖ້າຄິວກ່ອນໜ້າ'
            return (
              <div className={`aud ${cls}`} key={p.id}>
                <span className="aud-ic">{cls === 'ok' ? <Icon.checkCircle /> : cls === 'rej' ? <Icon.warn /> : <Icon.clock />}</span>
                <div className="aud-body"><span className="aud-t">{i + 1}. {p.role} — {label}</span><span className="aud-tm">{p.name}</span></div>
              </div>
            )
          })}
        </div>
      </div>
    )}

    {/* ປະຫວັດກິດຈະກຳ — ໃຜເຮັດຫຍັງ ເມື່ອໃດ (Lucky 19/07 — ທຸກຄຳຂໍ/ໂພສ) */}
    <ReqActivityHistory req={post} chain={chain} createLabel="ສ້າງໂພສ" />
  </>)
}

const SF = [
  { k: 'all', t: 'ທັງໝົດ' }, { k: 'draft', t: 'ຮ່າງ' }, { k: 'progress', t: 'ລໍຖ້າ' },
  { k: 'rejected', t: 'ຖືກປະຕິເສດ' }, { k: 'approved', t: 'ເຜີຍແຜ່ແລ້ວ' },
]

export default function KnowledgeScreen({ me, posts = [], onCreateKn, onSubmitKn, onKnLike, onKnView, onReqComment, onReqEditComment, onReqDeleteComment, openReq, onConsumeOpenReq }) {
  const [tab, setTab] = useState('feed') // feed | mine | rank
  const [sf, setSf] = useState('all')
  const [cat, setCat] = useState('all')
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(false)
  const [preview, setPreview] = useState(null)
  const [popup, setPopup] = useState(null)
  const viewed = useState(() => new Set())[0]

  // ມາຈາກແຈ້ງເຕືອນ → ເປີດໂພສນັ້ນເລີຍ
  useEffect(() => {
    if (!openReq || openReq.kind !== 'knowledge') return
    const p = posts.find((x) => x.id === openReq.id)
    if (p) { setTab(p.byId === me ? 'mine' : 'feed'); setDetail(p) }
    onConsumeOpenReq?.()
  }, [openReq])

  const live = detail ? posts.find((p) => p.id === detail.id) || detail : null
  // ນັບຍອດເບິ່ງ ຄັ້ງດຽວຕໍ່ໂພສ (ບໍ່ນັບຊ້ຳຕອນ re-render)
  useEffect(() => {
    if (!live || live.status !== 'approved' || live.byId === me || viewed.has(live.id)) return
    viewed.add(live.id); onKnView?.(live.id)
  }, [live?.id])

  // Feed: ໂພສໃໝ່ສຸດກ່ອນ · ຂອງຂ້ອຍ: ທີ່ຍັງລໍຖ້າ/ຮ່າງ ຂຶ້ນກ່ອນ (helper ດຽວກັບໂມດູນອື່ນ)
  const feed = sortPendingFirst(posts.filter((p) => p.status === 'approved' && (cat === 'all' || (p.cats || []).includes(cat))))
  const mine = sortPendingFirst(posts.filter((p) => p.byId === me).filter((p) => sf === 'all' || p.status === sf))
  // ອັນດັບ: ນັບໂພສທີ່ເຜີຍແຜ່ + ຍອດເບິ່ງ + ຖືກໃຈ
  const rank = Object.values(posts.filter((p) => p.status === 'approved').reduce((acc, p) => {
    const r = acc[p.byId] || { id: p.byId, posts: 0, views: 0, likes: 0 }
    r.posts += 1; r.views += p.views || 0; r.likes += (p.likes || []).length
    acc[p.byId] = r; return acc
  }, {})).map((r) => ({ ...r, score: r.posts * 10 + r.views + r.likes * 5 })).sort((a, b) => b.score - a.score)

  // ── ໜ້າລາຍລະອຽດໂພສ ──
  if (live) {
    const isMine = live.byId === me
    return (
      <ScreenPortal>
      <div className="ac-detail-screen">
        <Header title="ລາຍລະອຽດໂພສ" onBack={() => setDetail(null)} />
        <div className="scroll">
          <div className="ac-detail">
            <KnowledgeDetailBody post={live} me={me} onPreview={setPreview} />
            {live.status === 'approved' && (
              <CommentBox
                comments={live.comments || []} me={me}
                useFullDirectory
                onAdd={(t, parentId, mentions) => onReqComment('knowledge', live.id, t, parentId, mentions)}
                onEdit={(cid, t) => onReqEditComment('knowledge', live.id, cid, t)}
                onDelete={(cid) => onReqDeleteComment('knowledge', live.id, cid)}
              />
            )}
          </div>
        </div>
        <div className="rf-foot">
          {live.status === 'approved' ? (
            <button className={`btn ${(live.likes || []).includes(me) ? 'primary' : 'ghost'}`} style={{ width: '100%' }} onClick={() => onKnLike(live.id)}>
              <Icon.check /> {(live.likes || []).includes(me) ? 'ຖືກໃຈແລ້ວ' : 'ຖືກໃຈ'} ({(live.likes || []).length})
            </button>
          ) : isMine && live.status === 'draft' ? (
            <button className="btn primary" style={{ width: '100%' }} onClick={() => { onSubmitKn(live.id); setPopup({ msg: 'ສົ່ງກວດສອບແລ້ວ!' }) }}>
              <Icon.send /> ສົ່ງກວດສອບ
            </button>
          ) : (
            <button className="btn ghost" style={{ width: '100%' }} onClick={() => setDetail(null)}>ປິດ</button>
          )}
        </div>
        {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
        {popup && <ResultPopup title={popup.msg} desc="ລະບົບໄດ້ແຈ້ງເຕືອນຜູ້ກວດສອບແລ້ວ" onOk={() => { setPopup(null); setDetail(null) }} />}
      </div>
      </ScreenPortal>
    )
  }

  return (<>
    <div className="req-tabs">
      {[{ k: 'feed', t: 'ຂ່າວສານ', ic: Icon.bulb }, { k: 'mine', t: 'ຂອງຂ້ອຍ', ic: Icon.reqDoc }, { k: 'rank', t: 'ອັນດັບ', ic: Icon.chart }].map((x) => (
        <button key={x.k} className={`req-tab ${tab === x.k ? 'on' : ''}`} onClick={() => setTab(x.k)}>{x.ic()}<span>{x.t}</span></button>
      ))}
    </div>

    {tab === 'feed' && (<>
      <div className="req-sf">
        <button className={`req-sf-chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>ທັງໝົດ</button>
        {KN_CATS.map((c) => (
          <button key={c} className={`req-sf-chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="kn-list">
        {feed.length === 0 ? <p className="empty-list">ຍັງບໍ່ມີໂພສ</p> : feed.map((p) => <KnCard key={p.id} p={p} me={me} onOpen={setDetail} />)}
      </div>
    </>)}

    {tab === 'mine' && (<>
      <div className="req-sf">
        {SF.map((s) => (
          <button key={s.k} className={`req-sf-chip ${sf === s.k ? 'on' : ''}`} onClick={() => setSf(s.k)}>{s.t}</button>
        ))}
      </div>
      <div className="kn-list">
        {mine.length === 0 ? <p className="empty-list">ຍັງບໍ່ມີໂພສ</p> : mine.map((p) => <KnCard key={p.id} p={p} me={me} showStatus onOpen={setDetail} />)}
      </div>
    </>)}

    {tab === 'rank' && (
      <div className="kn-list">
        {rank.length === 0 ? <p className="empty-list">ຍັງບໍ່ມີຂໍ້ມູນ</p> : rank.map((r, i) => (
          <div className={`kn-rank ${r.id === me ? 'me' : ''}`} key={r.id}>
            <span className={`kn-rank-n top${i < 3 ? i + 1 : ''}`}>{i + 1}</span>
            <span className="kn-rank-av" style={avBg(r.id)}>{!avatarOf(r.id) && initials(nameOf(r.id))}</span>
            <div className="kn-rank-info">
              <b>{nameOf(r.id)}</b>
              <span>{r.posts} ໂພສ · {r.views} ເບິ່ງ · {r.likes} ຖືກໃຈ</span>
            </div>
            <span className="kn-rank-score">{r.score}</span>
          </div>
        ))}
      </div>
    )}

    {/* FAB + popup ຕ້ອງ portal ອອກນອກ .scroll (iOS: absolute ໃນ scroll ຈະເລື່ອນຕາມເນື້ອຫາ) */}
    <ScreenPortal><button className="fab fab-float" onClick={() => setForm(true)}><Icon.plus /></button></ScreenPortal>
    {form && (
      <KnowledgeForm me={me}
        onSubmit={(data, publish) => { onCreateKn(data, publish); setForm(false); setTab('mine'); setSf('all'); setPopup({ msg: publish ? 'ສົ່ງກວດສອບແລ້ວ!' : 'ບັນທຶກຮ່າງແລ້ວ!' }) }}
        onClose={() => setForm(false)} />
    )}
    {popup && !detail && (
      <ScreenPortal>
        <ResultPopup title={popup.msg} desc={popup.msg.includes('ຮ່າງ') ? 'ຢູ່ໃນ "ຂອງຂ້ອຍ" → ຮ່າງ · ສົ່ງກວດສອບພາຍຫຼັງໄດ້' : 'ລະບົບໄດ້ແຈ້ງເຕືອນຜູ້ກວດສອບແລ້ວ'} onOk={() => setPopup(null)} />
      </ScreenPortal>
    )}
  </>)
}
