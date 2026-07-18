import { useState } from 'react'
import { Icon, Header, DIRECTORY, DEPTS, RANK_TITLE, initials } from './shared.jsx'
import { DOC_CATEGORIES, stepLabel, stepKindOf, STEP_KIND_LABEL, STEP_KIND_DESC } from '../home/data.js'

const slugify = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8) || 'new'
const BLANK_SUB = { key: '', name: '', prefix: '', category: Object.keys(DOC_CATEGORIES)[0], chain: [], cc: [], lockAll: false }

// ─────────────── ເລືອກຄົນສະເພາະ ແທນຂັ້ນຕອນໜຶ່ງ ───────────────
function PersonPickSheet({ open, onPick, onClose }) {
  const [q, setQ] = useState('')
  if (!open) return null
  const list = DIRECTORY.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.email.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b><Icon.users /> ເລືອກຄົນອະນຸມັດ</b>
          <button className="icon-mini" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-search">
          <Icon.search />
          <input placeholder="ຄົ້ນຫາຊື່ ຫຼື ອີເມວ..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="modal-list">
          {list.map((p) => (
            <div className="dir-row" key={p.id}>
              <div className={`dir-avatar rk-${p.rank}`}>{initials(p.name)}</div>
              <div className="dir-info">
                <b>{p.name}</b>
                <span>{RANK_TITLE[p.rank]} · {p.email}</span>
              </div>
              <button className="pick-btn approver" onClick={() => onPick(p.id)}>ເລືອກ</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────── ເລືອກພະແນກ ແທນຂັ້ນຕອນໜຶ່ງ ───────────────
function DeptPickSheet({ open, onPick, onClose }) {
  if (!open) return null
  return (
    <div className="fsheet-overlay" onClick={onClose}>
      <div className="fsheet" onClick={(e) => e.stopPropagation()}>
        <p className="fsheet-title">ເລືອກພະແນກ — ຈະໃຊ້ຫົວໜ້າພະແນກນັ້ນ</p>
        {Object.entries(DEPTS).map(([k, label]) => (
          <button key={k} className="sort-opt" onClick={() => onPick(k)}>{label}</button>
        ))}
      </div>
    </div>
  )
}

// ─────────────── ເລືອກຊະນິດ step — ຕ້ອງມີຄຳອະທິບາຍ ບໍ່ໃຫ້ຜູ້ໃຊ້ເດົາເອງ (Lucky 18/07) ───────────────
function KindPickSheet({ open, onPick, onClose }) {
  if (!open) return null
  return (
    <div className="fsheet-overlay" onClick={onClose}>
      <div className="fsheet" onClick={(e) => e.stopPropagation()}>
        <p className="fsheet-title">ຊະນິດຂອງຂັ້ນນີ້ — ກຳນົດວ່າ "ໃຜ" ເປັນຜູ້ກວດ/ເຊັນຂັ້ນນີ້</p>
        {Object.entries(STEP_KIND_LABEL).map(([k, label]) => (
          <button key={k} className="dtype-opt" onClick={() => onPick(k)}>
            <div className="dtype-info">
              <b>{label}</b>
              <span style={{ whiteSpace: 'normal' }}>{STEP_KIND_DESC[k]}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────── ເລືອກໝວດ — ໂຊສີ+ໄອຄອນຈິງ ບໍ່ແມ່ນ text ລ້ວນ (Lucky ຕິ 19/07) ───────────────
function CategoryPickSheet({ open, categories, value, onPick, onClose }) {
  if (!open) return null
  return (
    <div className="fsheet-overlay" onClick={onClose}>
      <div className="fsheet" onClick={(e) => e.stopPropagation()}>
        <p className="fsheet-title">ເລືອກໝວດ — ກຳນົດສີ/ໄອຄອນຂອງການ໌ດ</p>
        {Object.entries(categories).map(([k, cat]) => (
          <button key={k} className={`dtype-opt ${value === k ? 'on' : ''}`} onClick={() => onPick(k)}>
            <span className="cat-pick-ic" style={{ background: cat.soft, color: cat.main }}>{Icon[cat.icon] ? Icon[cat.icon]() : <Icon.doc />}</span>
            <div className="dtype-info"><b style={{ color: cat.main }}>{cat.label}</b></div>
            {value === k && <Icon.check />}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────── ແກ້ໄຂ/ເພີ່ມ ໝວດ (ຊື່ · ສີ · ໄອຄອນ) — Lucky ຖາມ 19/07 ວ່າແກ້ຢູ່ໃສ → ຕ້ອງມີໜ້ານີ້ ───────────────
// pool ໃຫຍ່ພໍ ເພື່ອວ່າ ຫຼັງກອງສີ/ໄອຄອນທີ່ໝວດອື່ນໃຊ້ແລ້ວອອກ ຍັງເຫຼືອ ~10 ຕົວເລືອກສະເໝີ (Lucky 19/07: ຫ້າມໂຊຊ້ຳກັບທີ່ໃຊ້ຢູ່)
const CAT_COLOR_PRESETS = [
  { main: '#64748b', soft: '#f1f5f9' }, { main: '#16a34a', soft: '#e7f6ec' }, { main: '#0d9488', soft: '#d9f2ef' },
  { main: '#d97706', soft: '#fdf0dd' }, { main: '#7c3aed', soft: '#efe9fe' }, { main: '#0369a1', soft: '#e0f0fa' },
  { main: '#2563eb', soft: '#e7edfb' }, { main: '#ea580c', soft: '#ffedd5' }, { main: '#0891b2', soft: '#e0f5fa' },
  { main: '#db2777', soft: '#fce7f2' }, { main: '#a21caf', soft: '#fae8ff' }, { main: '#e23b4e', soft: '#fdeaec' },
  { main: '#4f46e5', soft: '#e9e8fd' }, { main: '#059669', soft: '#def7ee' }, { main: '#b45309', soft: '#fdf1e0' },
  { main: '#9333ea', soft: '#f3e9fd' }, { main: '#e11d48', soft: '#fde8ed' }, { main: '#0e7490', soft: '#e0f4f8' },
  { main: '#65a30d', soft: '#f0f9df' }, { main: '#c2410c', soft: '#fdebe1' }, { main: '#475569', soft: '#eef1f6' },
  { main: '#be185d', soft: '#fbe6ef' }, { main: '#1d4ed8', soft: '#e5ecfc' }, { main: '#0f766e', soft: '#def3f1' },
]
const CAT_ICON_CHOICES = ['doc', 'money', 'cart', 'building', 'chart', 'users', 'shield', 'checkCircle', 'send', 'image', 'layers', 'mail', 'book', 'lock', 'pen', 'clock', 'calendar', 'download', 'share', 'swap', 'printer', 'eye', 'user']
function CategoryEditSheet({ cat, isNew, usedColors, usedIcons, onSave, onClose }) {
  const [draft, setDraft] = useState(cat)
  const canSave = draft.label.trim().length > 0
  // ໂຊສະເພາະ ສີ/ໄອຄອນ ທີ່ຍັງບໍ່ມີໝວດໃດໃຊ້ (ຄ່າປັດຈຸບັນຂອງໝວດນີ້ເອງ ຍັງເລືອກໄດ້)
  const colorChoices = CAT_COLOR_PRESETS.filter((c) => !usedColors?.has(c.main) || c.main === cat.main).slice(0, 10)
  const iconChoices = CAT_ICON_CHOICES.filter((k) => (!usedIcons?.has(k) || k === cat.icon) && Icon[k]).slice(0, 10)
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b><Icon.layers /> {isNew ? 'ເພີ່ມໝວດໃໝ່' : `ແກ້ໄຂໝວດ: ${cat.label}`}</b>
          <button className="icon-mini" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-list">
          <div className="sub-edit-field">
            <label>ຊື່ໝວດ (ພະແນກ)</label>
            <input className="text-input" value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="ຊື່ໝວດ" maxLength={40} />
          </div>
          <div className="sub-edit-field">
            <label>ສີປະຈຳໝວດ (ສະເພາະສີທີ່ຍັງບໍ່ຖືກໃຊ້)</label>
            <div className="cat-swatches">
              {colorChoices.map((c) => (
                <button key={c.main} className={`cat-swatch ${draft.main === c.main ? 'on' : ''}`} style={{ background: c.main }}
                  onClick={() => setDraft((d) => ({ ...d, main: c.main, soft: c.soft }))} />
              ))}
            </div>
          </div>
          <div className="sub-edit-field">
            <label>ໄອຄອນປະຈຳໝວດ (ສະເພາະທີ່ຍັງບໍ່ຖືກໃຊ້)</label>
            <div className="cat-icons">
              {iconChoices.map((k) => (
                <button key={k} className={`cat-icon-opt ${draft.icon === k ? 'on' : ''}`}
                  style={draft.icon === k ? { background: draft.main, color: '#fff', borderColor: draft.main } : undefined}
                  onClick={() => setDraft((d) => ({ ...d, icon: k }))}>{Icon[k]()}</button>
              ))}
            </div>
          </div>
          {/* ຕົວຢ່າງຜົນ — ເຫັນກ່ອນບັນທຶກ */}
          <div className="docno-box" style={{ background: draft.soft }}>
            <span className="docno-box-ic" style={{ background: draft.main, color: '#fff' }}>{Icon[draft.icon] ? Icon[draft.icon]() : <Icon.doc />}</span>
            <div className="docno-box-txt"><span>ຕົວຢ່າງ</span><b style={{ color: draft.main }}>{draft.label || 'ຊື່ໝວດ'}</b></div>
          </div>
        </div>
        <button className={`btn primary ${!canSave ? 'disabled' : ''}`} disabled={!canSave} style={{ width: '100%', marginTop: 8 }}
          onClick={() => { onSave({ ...draft, label: draft.label.trim() }); onClose() }}>
          <Icon.check /> ບັນທຶກ
        </button>
      </div>
    </div>
  )
}

// ─────────────── ແກ້ໄຂ/ສ້າງ ປະເພດເອກະສານຍ່ອຍ ໜຶ່ງລາຍການ — ຊື່/prefix/ໝວດ/ລັບ + ສາຍອະນຸມັດ ───────────────
function SubtypeEditSheet({ sub, isNew, defaultSub, categories = DOC_CATEGORIES, onUpdate, onAdd, onDelete, onReset, onClose }) {
  const [draft, setDraft] = useState(sub)
  const [catPickOpen, setCatPickOpen] = useState(false)
  const [kindPickIdx, setKindPickIdx] = useState(null)
  const [deptPickIdx, setDeptPickIdx] = useState(null)
  const [personPickIdx, setPersonPickIdx] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false) // ກັນລຶບພາດ — ຕ້ອງຢືນຢັນກ່ອນສະເໝີ
  // CC ອັດຕະໂນມັດ (Lucky 18/07: ຕ້ອງຕັ້ງ CC ໄດ້ຢູ່ Tab 6) — ໃຊ້ step format ດຽວກັບ chain
  const [ccKindIdx, setCcKindIdx] = useState(null)
  const [ccDeptIdx, setCcDeptIdx] = useState(null)
  const [ccPersonIdx, setCcPersonIdx] = useState(null)
  if (!sub) return null

  const cur = isNew ? draft : sub
  const cat = categories[cur.category] || {}
  const chain = cur.chain || []

  const commit = (patch) => {
    if (isNew) setDraft((d) => ({ ...d, ...patch }))
    else onUpdate(sub.key, patch)
  }
  const setChain = (next) => commit({ chain: next })

  const pickKind = (idx, kind) => {
    setKindPickIdx(null)
    if (kind === 'dept') { setDeptPickIdx(idx); return }
    if (kind === 'person') { setPersonPickIdx(idx); return }
    const next = [...chain]; next[idx] = kind === 'president' ? 'president' : 'creatorHead'
    setChain(next)
  }
  const pickDept = (deptKey) => { const next = [...chain]; next[deptPickIdx] = { dept: deptKey }; setChain(next); setDeptPickIdx(null) }
  const pickPerson = (personId) => { const next = [...chain]; next[personPickIdx] = { person: personId }; setChain(next); setPersonPickIdx(null) }
  const moveStep = (idx, dir) => {
    const j = idx + dir
    if (j < 0 || j >= chain.length) return
    const next = [...chain]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setChain(next)
  }
  const removeStep = (idx) => setChain(chain.filter((_, i) => i !== idx))
  const addStep = () => setChain([...chain, 'creatorHead'])

  // ── CC ອັດຕະໂນມັດ — add/remove/ປ່ຽນຊະນິດ ຄືກັບ chain ──
  const ccSteps = cur.cc || []
  const setCc = (next) => commit({ cc: next })
  const pickCcKind = (idx, kind) => {
    setCcKindIdx(null)
    if (kind === 'dept') { setCcDeptIdx(idx); return }
    if (kind === 'person') { setCcPersonIdx(idx); return }
    const next = [...ccSteps]; next[idx] = kind === 'president' ? 'president' : 'creatorHead'
    setCc(next)
  }
  const pickCcDept = (k) => { const next = [...ccSteps]; next[ccDeptIdx] = { dept: k }; setCc(next); setCcDeptIdx(null) }
  const pickCcPerson = (id) => { const next = [...ccSteps]; next[ccPersonIdx] = { person: id }; setCc(next); setCcPersonIdx(null) }
  const removeCc = (idx) => setCc(ccSteps.filter((_, i) => i !== idx))
  const addCc = () => { setCc([...ccSteps, 'creatorHead']); setCcKindIdx(ccSteps.length) }

  const canCreate = isNew && cur.name.trim().length > 0 && cur.prefix.trim().length > 0
  const create = () => { if (canCreate) { onAdd({ ...cur, key: slugify(cur.prefix || cur.name) }); onClose() } }
  const edited = !isNew && defaultSub && JSON.stringify(defaultSub) !== JSON.stringify(sub)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b><Icon.layers /> {isNew ? 'ເພີ່ມປະເພດເອກະສານໃໝ່' : cur.name || '(ບໍ່ມີຊື່)'}</b>
          <button className="icon-mini" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-list">
          <div className="sub-edit-field">
            <label>ຊື່ປະເພດເອກະສານ</label>
            <input className="text-input" value={cur.name} onChange={(e) => commit({ name: e.target.value })} placeholder="ຊື່ປະເພດເອກະສານ" maxLength={60} />
          </div>
          <div className="sub-edit-field">
            <label>Prefix (ໃຊ້ໃນເລກທີເອກະສານ)</label>
            <input className="text-input" value={cur.prefix} onChange={(e) => commit({ prefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) })} placeholder="EXP" maxLength={6} />
          </div>
          <button className="set-row set-row-link sub-edit-field" onClick={() => setCatPickOpen(true)}>
            <div className="set-row-info"><label>ໝວດ (ກຳນົດສີ/ໄອຄອນ)</label><b style={{ color: cat.main }}>{cat.label || '—'}</b></div>
            <Icon.chevron />
          </button>
          <div className="set-row sub-edit-field">
            <div className="set-row-info"><b>ເອກະສານລັບ</b><span>ຫ້າມເພີ່ມຄົນອື່ນ/CC — ສົ່ງກົງຫາຜູ້ອຳນວຍການເທົ່ານັ້ນ</span></div>
            <button className={`toggle ${cur.lockAll ? 'on' : ''}`} onClick={() => commit({ lockAll: !cur.lockAll })}><span className="toggle-dot" /></button>
          </div>

          <p className="dd-section" style={{ marginTop: 8 }}><Icon.layers /> ສາຍອະນຸມັດ</p>
          {chain.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: '12px' }}>ບໍ່ມີເສັ້ນທາງບັງຄັບ — ຜູ້ສ້າງເລືອກຜູ້ລົງນາມເອງໄດ້ໝົດ</p>}
          {chain.map((step, idx) => {
            const info = stepLabel(step)
            const isLast = idx === chain.length - 1
            return (
              <div className="dir-row chain-row" key={idx}>
                <div className="dir-avatar rk-head">{idx + 1}</div>
                <div className="dir-info">
                  <b>{info.label}{isLast && <em className="dtype-auto"> · ຜູ້ເຊັນສຸດທ້າຍ</em>}</b>
                  <span>{info.person ? info.person.name : 'ຂຶ້ນກັບຜູ້ສ້າງເອກະສານ (dynamic)'}</span>
                </div>
                <div className="dir-actions chain-actions">
                  <div className="chain-move">
                    <button className="icon-mini flip" disabled={idx === 0} onClick={() => moveStep(idx, -1)}><Icon.chevron /></button>
                    <button className="icon-mini" disabled={isLast} onClick={() => moveStep(idx, 1)}><Icon.chevron /></button>
                  </div>
                  <button className="pick-btn approver" onClick={() => setKindPickIdx(idx)}>ຊະນິດ</button>
                  <button className="pick-btn cc" onClick={() => removeStep(idx)}><Icon.trash /></button>
                </div>
              </div>
            )
          })}

          {/* ── CC ອັດຕະໂນມັດ (Lucky 18/07) — ຄົນທີ່ໄດ້ຮັບສຳເນົາທຸກໃບຂອງປະເພດນີ້ ໂດຍບໍ່ຕ້ອງເຊັນ ── */}
          <p className="dd-section" style={{ marginTop: 12 }}><Icon.mail /> CC ອັດຕະໂນມັດ (ຮັບສຳເນົາ — ບໍ່ຕ້ອງເຊັນ)</p>
          {ccSteps.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: '10px' }}>ບໍ່ມີ CC ອັດຕະໂນມັດ — ເພີ່ມໄດ້ດ້ວຍປຸ່ມຂ້າງລຸ່ມ</p>}
          {ccSteps.map((step, idx) => {
            const info = stepLabel(step)
            return (
              <div className="dir-row chain-row" key={idx}>
                <div className="dir-avatar rk-staff">CC</div>
                <div className="dir-info">
                  <b>{info.label}</b>
                  <span>{info.person ? info.person.name : 'ຂຶ້ນກັບຜູ້ສ້າງເອກະສານ (dynamic)'}</span>
                </div>
                <div className="dir-actions chain-actions">
                  <button className="pick-btn approver" onClick={() => setCcKindIdx(idx)}>ຊະນິດ</button>
                  <button className="pick-btn cc" onClick={() => removeCc(idx)}><Icon.trash /></button>
                </div>
              </div>
            )
          })}
          <button className="btn ghost" style={{ width: '100%', marginTop: 4 }} onClick={addCc}><Icon.plus /> ເພີ່ມ CC</button>
        </div>
        <button className="btn ghost" style={{ width: '100%', marginTop: 8 }} onClick={addStep}><Icon.plus /> ເພີ່ມຂັ້ນຕອນ</button>

        {isNew ? (
          <button className={`btn primary ${!canCreate ? 'disabled' : ''}`} style={{ width: '100%', marginTop: 8 }} onClick={create}>
            <Icon.check /> ສ້າງປະເພດເອກະສານ
          </button>
        ) : (
          <>
            {edited && <button className="btn ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => onReset(sub.key)}><Icon.trash /> ຄືນຄ່າເລີ່ມຕົ້ນທັງໝົດ</button>}
            <button className="btn danger-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => setConfirmDelete(true)}>
              <Icon.trash /> ລຶບປະເພດເອກະສານນີ້
            </button>
          </>
        )}
      </div>
      {/* ຢືນຢັນກ່ອນລຶບ — ລຶບແລ້ວປະເພດຈະຫາຍຈາກໜ້າສ້າງເອກະສານທັນທີ */}
      {confirmDelete && (
        <div className="modal-overlay confirm-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <span className="confirm-ic"><Icon.warn /></span>
            <b>ລຶບ "{cur.name}" ?</b>
            <p>ປະເພດນີ້ຈະຫາຍຈາກລາຍການ ແລະ ໜ້າສ້າງເອກະສານທັນທີ — ເອກະສານເກົ່າທີ່ສ້າງໄປແລ້ວບໍ່ຖືກກະທົບ</p>
            <div className="confirm-btns">
              <button className="btn ghost" onClick={() => setConfirmDelete(false)}>ຍົກເລີກ</button>
              <button className="btn danger" onClick={() => { setConfirmDelete(false); onDelete(sub.key); onClose() }}><Icon.trash /> ລຶບ</button>
            </div>
          </div>
        </div>
      )}
      <CategoryPickSheet open={catPickOpen} categories={categories} value={cur.category} onPick={(k) => { commit({ category: k }); setCatPickOpen(false) }} onClose={() => setCatPickOpen(false)} />
      <KindPickSheet open={kindPickIdx !== null} onPick={(k) => pickKind(kindPickIdx, k)} onClose={() => setKindPickIdx(null)} />
      <DeptPickSheet open={deptPickIdx !== null} onPick={pickDept} onClose={() => setDeptPickIdx(null)} />
      <PersonPickSheet open={personPickIdx !== null} onPick={pickPerson} onClose={() => setPersonPickIdx(null)} />
      {/* pick sheets ຊຸດ CC — ແຍກ index ຈາກ chain */}
      <KindPickSheet open={ccKindIdx !== null} onPick={(k) => pickCcKind(ccKindIdx, k)} onClose={() => setCcKindIdx(null)} />
      <DeptPickSheet open={ccDeptIdx !== null} onPick={pickCcDept} onClose={() => setCcDeptIdx(null)} />
      <PersonPickSheet open={ccPersonIdx !== null} onPick={pickCcPerson} onClose={() => setCcPersonIdx(null)} />
    </div>
  )
}

// ─────────────── Tab 6: Flow Signature Approval Setting ───────────────
export default function FlowSettingsScreen({ subtypes, defaultSubtypes, categories, onUpdate, onAdd, onDelete, onReset, onUpdateCategory, onAddCategory, onBack }) {
  const [openKey, setOpenKey] = useState(null)
  const [creating, setCreating] = useState(false)
  const [editCatKey, setEditCatKey] = useState(null) // ໝວດທີ່ກຳລັງແກ້ (ຊື່/ສີ/ໄອຄອນ)
  const [creatingCat, setCreatingCat] = useState(false)
  const [addMenu, setAddMenu] = useState(false) // ປຸ່ມ + ດຽວ → ເລືອກວ່າຈະເພີ່ມຫຍັງ (Lucky 19/07)
  const [openCats, setOpenCats] = useState({}) // ໝວດທີ່ກາງຢູ່ — default ປິດໝົດ (Lucky 19/07)
  const toggleCat = (k) => setOpenCats((o) => ({ ...o, [k]: !o[k] }))
  const cats = categories || DOC_CATEGORIES
  const openSub = subtypes.find((s) => s.key === openKey) || null
  const openDefault = openSub ? defaultSubtypes.find((s) => s.key === openSub.key) : null
  // ສີ/ໄອຄອນ ທີ່ຖືກໃຊ້ຢູ່ແລ້ວ — ສົ່ງໃຫ້ CategoryEditSheet ກອງອອກ
  const usedColors = new Set(Object.values(cats).map((c) => c.main))
  const usedIcons = new Set(Object.values(cats).map((c) => c.icon))
  // ຄ່າເລີ່ມຕົ້ນຂອງໝວດໃໝ່ = ສີ/ໄອຄອນທຳອິດທີ່ຍັງວ່າງ
  const freshColor = CAT_COLOR_PRESETS.find((c) => !usedColors.has(c.main)) || CAT_COLOR_PRESETS[0]
  const freshIcon = CAT_ICON_CHOICES.find((k) => !usedIcons.has(k)) || 'doc'

  return (
    <div className="app">
      <Header title="ຕັ້ງຄ່າສາຍອະນຸມັດ" subtitle="Flow Signature Approval Setting — ເພີ່ມ/ແກ້ໄຂ/ລຶບປະເພດເອກະສານ ແລະ ຜູ້ອະນຸມັດແຕ່ລະຂັ້ນ" onBack={onBack} />
      <div className="scroll">
        {Object.entries(cats).map(([catKey, cat]) => {
          const subs = subtypes.filter((s) => s.category === catKey)
          const opened = !!openCats[catKey]
          return (
            <div className="card" key={catKey}>
              {/* ຫົວໝວດ = accordion: ແຕະເພື່ອກາງ/ພັບ (default ພັບ) · ປາກກາ = ແກ້ ຊື່/ສີ/ໄອຄອນ */}
              <div className="cat-head-row acc" onClick={() => toggleCat(catKey)}>
                <p className="dd-section" style={{ color: cat.main, margin: 0 }}>{Icon[cat.icon] ? Icon[cat.icon]() : <Icon.doc />} {cat.label}</p>
                <span className="cat-count" style={{ color: cat.main, background: cat.soft }}>{subs.length}</span>
                <button className="icon-mini" title="ແກ້ໄຂໝວດ" onClick={(e) => { e.stopPropagation(); setEditCatKey(catKey) }}><Icon.pen /></button>
                <span className={`cat-acc-chevron ${opened ? 'open' : ''}`}><Icon.chevron /></span>
              </div>
              {opened && subs.length === 0 && <p className="muted" style={{ padding: '8px 0', margin: 0 }}>ຍັງບໍ່ມີເອກະສານຍ່ອຍໃນໝວດນີ້ — ເພີ່ມໄດ້ດ້ວຍປຸ່ມ +</p>}
              {opened && subs.map((s) => {
                const def = defaultSubtypes.find((d) => d.key === s.key)
                const edited = def ? JSON.stringify(def) !== JSON.stringify(s) : true
                return (
                  <button key={s.key} className="set-row set-row-link" style={{ padding: '10px 0' }} onClick={() => setOpenKey(s.key)}>
                    <div className="set-row-info">
                      <b>{s.name}{edited && <em className="dtype-auto"><Icon.pen /> {def ? 'ແກ້ໄຂແລ້ວ' : 'ໃໝ່'}</em>}</b>
                      <span>{s.prefix} · {s.chain.length > 0 ? `ຂັ້ນບັງຄັບ ${s.chain.length} ຂັ້ນ` : 'ບໍ່ມີເສັ້ນທາງບັງຄັບ'}</span>
                    </div>
                    <Icon.chevron />
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
      {/* ປຸ່ມ + ດຽວ (ຮູບແບບດຽວກັບ FAB ໜ້າຫຼັກ) → ເມນູເລືອກ ເພີ່ມປະເພດ ຫຼື ເພີ່ມໝວດ */}
      <button className="fab fs-fab" onClick={() => setAddMenu(true)}><Icon.plus /></button>
      {addMenu && (
        <div className="fsheet-overlay" onClick={() => setAddMenu(false)}>
          <div className="fsheet" onClick={(e) => e.stopPropagation()}>
            <p className="fsheet-title">ຕ້ອງການເພີ່ມຫຍັງ?</p>
            <button className="dtype-opt" onClick={() => { setAddMenu(false); setCreating(true) }}>
              <span className="cat-pick-ic" style={{ background: '#e7edfb', color: '#2563eb' }}><Icon.doc /></span>
              <div className="dtype-info"><b>ເພີ່ມປະເພດເອກະສານໃໝ່</b><span>ເອກະສານຍ່ອຍ + ເສັ້ນທາງອະນຸມັດ ຂອງມັນ</span></div>
            </button>
            <button className="dtype-opt" onClick={() => { setAddMenu(false); setCreatingCat(true) }}>
              <span className="cat-pick-ic" style={{ background: '#efe9fe', color: '#7c3aed' }}><Icon.layers /></span>
              <div className="dtype-info"><b>ເພີ່ມໝວດ (ພະແນກ) ໃໝ່</b><span>ກຳນົດ ຊື່ · ສີ · ໄອຄອນ ຂອງໝວດ</span></div>
            </button>
          </div>
        </div>
      )}
      <SubtypeEditSheet sub={openSub} isNew={false} defaultSub={openDefault} categories={cats} onUpdate={onUpdate} onDelete={onDelete} onReset={onReset} onClose={() => setOpenKey(null)} />
      {creating && <SubtypeEditSheet sub={{ ...BLANK_SUB, category: Object.keys(cats)[0] }} isNew categories={cats} onAdd={onAdd} onClose={() => setCreating(false)} />}
      {editCatKey && <CategoryEditSheet cat={cats[editCatKey]} isNew={false} usedColors={usedColors} usedIcons={usedIcons} onSave={(patch) => onUpdateCategory(editCatKey, patch)} onClose={() => setEditCatKey(null)} />}
      {creatingCat && <CategoryEditSheet cat={{ label: '', main: freshColor.main, soft: freshColor.soft, icon: freshIcon }} isNew usedColors={usedColors} usedIcons={usedIcons} onSave={(c) => onAddCategory(c)} onClose={() => setCreatingCat(false)} />}
    </div>
  )
}
