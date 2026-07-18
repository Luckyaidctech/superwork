import { useState } from 'react'
import { Icon, Header, DIRECTORY, DEPTS, RANK_TITLE, initials } from './shared.jsx'
import { DOC_CATEGORIES, stepLabel, stepKindOf, STEP_KIND_LABEL } from '../home/data.js'

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

// ─────────────── ເລືອກຊະນິດ step ───────────────
function KindPickSheet({ open, onPick, onClose }) {
  if (!open) return null
  return (
    <div className="fsheet-overlay" onClick={onClose}>
      <div className="fsheet" onClick={(e) => e.stopPropagation()}>
        <p className="fsheet-title">ຊະນິດຂອງຂັ້ນຕອນນີ້</p>
        {Object.entries(STEP_KIND_LABEL).map(([k, label]) => (
          <button key={k} className="sort-opt" onClick={() => onPick(k)}>{label}</button>
        ))}
      </div>
    </div>
  )
}

// ─────────────── ເລືອກໝວດ ───────────────
function CategoryPickSheet({ open, onPick, onClose }) {
  if (!open) return null
  return (
    <div className="fsheet-overlay" onClick={onClose}>
      <div className="fsheet" onClick={(e) => e.stopPropagation()}>
        <p className="fsheet-title">ເລືອກໝວດ — ກຳນົດສີ/ໄອຄອນຂອງການ໌ດ</p>
        {Object.entries(DOC_CATEGORIES).map(([k, cat]) => (
          <button key={k} className="sort-opt" onClick={() => onPick(k)}>{cat.label}</button>
        ))}
      </div>
    </div>
  )
}

// ─────────────── ແກ້ໄຂ/ສ້າງ ປະເພດເອກະສານຍ່ອຍ ໜຶ່ງລາຍການ — ຊື່/prefix/ໝວດ/ລັບ + ສາຍອະນຸມັດ ───────────────
function SubtypeEditSheet({ sub, isNew, defaultSub, onUpdate, onAdd, onDelete, onReset, onClose }) {
  const [draft, setDraft] = useState(sub)
  const [catPickOpen, setCatPickOpen] = useState(false)
  const [kindPickIdx, setKindPickIdx] = useState(null)
  const [deptPickIdx, setDeptPickIdx] = useState(null)
  const [personPickIdx, setPersonPickIdx] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false) // ກັນລຶບພາດ — ຕ້ອງຢືນຢັນກ່ອນສະເໝີ
  if (!sub) return null

  const cur = isNew ? draft : sub
  const cat = DOC_CATEGORIES[cur.category] || {}
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
      <CategoryPickSheet open={catPickOpen} onPick={(k) => { commit({ category: k }); setCatPickOpen(false) }} onClose={() => setCatPickOpen(false)} />
      <KindPickSheet open={kindPickIdx !== null} onPick={(k) => pickKind(kindPickIdx, k)} onClose={() => setKindPickIdx(null)} />
      <DeptPickSheet open={deptPickIdx !== null} onPick={pickDept} onClose={() => setDeptPickIdx(null)} />
      <PersonPickSheet open={personPickIdx !== null} onPick={pickPerson} onClose={() => setPersonPickIdx(null)} />
    </div>
  )
}

// ─────────────── Tab 6: Flow Signature Approval Setting ───────────────
export default function FlowSettingsScreen({ subtypes, defaultSubtypes, onUpdate, onAdd, onDelete, onReset, onBack }) {
  const [openKey, setOpenKey] = useState(null)
  const [creating, setCreating] = useState(false)
  const openSub = subtypes.find((s) => s.key === openKey) || null
  const openDefault = openSub ? defaultSubtypes.find((s) => s.key === openSub.key) : null

  return (
    <div className="app">
      <Header title="ຕັ້ງຄ່າສາຍອະນຸມັດ" subtitle="Flow Signature Approval Setting — ເພີ່ມ/ແກ້ໄຂ/ລຶບປະເພດເອກະສານ ແລະ ຜູ້ອະນຸມັດແຕ່ລະຂັ້ນ" onBack={onBack} />
      <div className="scroll">
        <button className="btn primary" style={{ width: '100%', margin: '4px 0 12px' }} onClick={() => setCreating(true)}>
          <Icon.plus /> ເພີ່ມປະເພດເອກະສານໃໝ່
        </button>
        {Object.entries(DOC_CATEGORIES).map(([catKey, cat]) => {
          const subs = subtypes.filter((s) => s.category === catKey)
          if (!subs.length) return null
          return (
            <div className="card" key={catKey}>
              <p className="dd-section" style={{ color: cat.main }}>{Icon[cat.icon] ? Icon[cat.icon]() : <Icon.doc />} {cat.label}</p>
              {subs.map((s) => {
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
      <SubtypeEditSheet sub={openSub} isNew={false} defaultSub={openDefault} onUpdate={onUpdate} onDelete={onDelete} onReset={onReset} onClose={() => setOpenKey(null)} />
      {creating && <SubtypeEditSheet sub={BLANK_SUB} isNew onAdd={onAdd} onClose={() => setCreating(false)} />}
    </div>
  )
}
