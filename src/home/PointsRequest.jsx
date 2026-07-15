import { useState } from 'react'
import { Icon, Header } from '../flow/shared.jsx'

// mock ໂຄງສ້າງ Workboard: Project → Activity → Task (ພ້ອມคะแนนปัจจุบัน)
const PROJECTS = [
  { id: 'p1', name: 'RUN FOR OUR FOREST', budget: 500, activities: [
    { id: 'a1', name: 'Scan QR & Onsite Registration', points: 120, tasks: [
      { id: 't1', name: 'ຕິດຕັ້ງລະບົບ Scan QR', points: 40 },
      { id: 't2', name: 'ຝຶກອົບຮົມທີມງານ', points: 30 },
      { id: 't3', name: 'ທົດສອບລະບົບ End-to-end', points: 20 },
    ] },
    { id: 'a2', name: 'BIB Pickup Flow', points: 80, tasks: [
      { id: 't4', name: 'ອອກແບບ Flow A + B', points: 50 },
      { id: 't5', name: 'ກຽມ Fallback (offline)', points: 30 },
    ] },
  ] },
  { id: 'p2', name: 'FDI / BOL System', budget: 400, activities: [
    { id: 'a3', name: 'Master Test Cases', points: 200, tasks: [
      { id: 't6', name: 'ແປ TC ພາສາລາວ', points: 60 },
      { id: 't7', name: 'Bug Log → Auto TC', points: 40 },
    ] },
  ] },
  { id: 'p3', name: 'e-Signature App', budget: 300, activities: [
    { id: 'a4', name: 'UI Prototype', points: 150, tasks: [
      { id: 't8', name: 'ໜ້າ Sign flow', points: 70 },
      { id: 't9', name: 'ໜ້າ Approval', points: 50 },
    ] },
  ] },
]

// dropdown ທີ່ພິມຄົ້ນຫາໄດ້
function SearchSelect({ label, value, options, onChange, placeholder, disabled }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const sel = options.find((o) => o.id === value)
  const filtered = options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className={`pr-field ${disabled ? 'disabled' : ''}`}>
      <label>{label}</label>
      <button className={`pr-select ${sel ? '' : 'ph'}`} onClick={() => !disabled && setOpen((o) => !o)}>
        <span>{sel ? sel.name : placeholder}</span><Icon.chevron />
      </button>
      {open && !disabled && (<>
        <div className="sort-backdrop" onClick={() => { setOpen(false); setQ('') }} />
        <div className="pr-dropdown">
          <div className="pr-search"><Icon.search /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ຄົ້ນຫາ..." /></div>
          <div className="pr-opts">
            {filtered.length === 0 ? <p className="empty-list sm">ບໍ່ພົບ</p> : filtered.map((o) => (
              <button key={o.id} className={`pr-opt ${o.id === value ? 'on' : ''}`} onClick={() => { onChange(o.id); setOpen(false); setQ('') }}>
                <span>{o.name}</span>{typeof o.points === 'number' && <em>{o.points} ຄະແນນ</em>}
              </button>
            ))}
          </div>
        </div>
      </>)}
    </div>
  )
}

export default function PointsRequest({ me, onSubmit, onViewDetail, onClose }) {
  const [target, setTarget] = useState('activity') // 'activity' | 'task'
  const [projectId, setProjectId] = useState('')
  const [activityId, setActivityId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [pts, setPts] = useState('')
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  const [created, setCreated] = useState(null)

  const project = PROJECTS.find((p) => p.id === projectId)
  const activity = project?.activities.find((a) => a.id === activityId)
  const task = activity?.tasks.find((t) => t.id === taskId)
  const current = target === 'task' ? task?.points : activity?.points
  const add = parseInt(pts, 10) || 0
  const ready = projectId && activityId && (target === 'activity' || taskId) && add > 0
  const projUsed = project ? project.activities.reduce((s, a) => s + a.points, 0) : 0
  const projBudget = project?.budget || 0

  if (done) {
    return (
      <div className="app pr-screen">
        <Header title="ຂໍຄະແນນ Workboard" onBack={onClose} />
        <div className="scroll" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8 }}>
          <span className="sign-ok-ic"><Icon.check /></span>
          <b style={{ fontSize: 18 }}>ສົ່ງຄຳຂໍຄະແນນສຳເລັດ!</b>
          <p className="muted" style={{ fontSize: 13 }}>ຂໍ +{add} ຄະແນນ ໃຫ້ {target === 'task' ? task?.name : activity?.name} · ລໍຖ້າຫົວໜ້າອະນຸມັດ</p>
        </div>
        <div className="footer"><button className="btn primary" onClick={() => (created && onViewDetail ? onViewDetail(created) : onClose())}><Icon.check /> ເບິ່ງລາຍລະອຽດຄຳຂໍ</button></div>
      </div>
    )
  }

  return (
    <div className="app pr-screen">
      <Header title="ຂໍຄະແນນ Workboard" onBack={onClose} />
      <div className="scroll">
        <div className="pr-seg">
          <button className={target === 'activity' ? 'on' : ''} onClick={() => setTarget('activity')}>ຂໍໃຫ້ Activity</button>
          <button className={target === 'task' ? 'on' : ''} onClick={() => setTarget('task')}>ຂໍໃຫ້ Task</button>
        </div>

        <SearchSelect label="ໂຄງການ (Project)" value={projectId} placeholder="ເລືອກໂຄງການ"
          options={PROJECTS} onChange={(id) => { setProjectId(id); setActivityId(''); setTaskId('') }} />

        {project && (
          <div className="card pr-proj">
            <div className="pr-proj-head"><Icon.chart /> ຄະແນນ Project · {project.name}</div>
            <div className="pr-proj-bar"><span style={{ width: `${Math.min(100, (projUsed / projBudget) * 100)}%` }} /></div>
            <div className="pr-proj-stats">
              <span>ໃຊ້ແລ້ວ <b>{projUsed + add}</b></span>
              <span>ທັງໝົດ <b>{projBudget}</b></span>
              <span>ຄົງເຫຼືອ <b>{Math.max(0, projBudget - projUsed - add)}</b></span>
            </div>
          </div>
        )}

        <SearchSelect label="ກິດຈະກຳ (Activity)" value={activityId} placeholder="ເລືອກກິດຈະກຳ" disabled={!project}
          options={project?.activities || []} onChange={(id) => { setActivityId(id); setTaskId('') }} />

        {target === 'task' && (
          <SearchSelect label="ໜ້າວຽກ (Task)" value={taskId} placeholder="ເລືອກໜ້າວຽກ" disabled={!activity}
            options={activity?.tasks || []} onChange={setTaskId} />
        )}

        <div className="pr-field">
          <label>ຈຳນວນຄະແນນ ທີ່ຂໍ</label>
          <input className="pr-input" type="number" min="1" value={pts} onChange={(e) => setPts(e.target.value)} placeholder="ປ້ອນຈຳນວນຄະແນນ" />
        </div>

        <div className="pr-field">
          <label>ເຫດຜົນ (ບໍ່ບັງຄັບ)</label>
          <textarea className="pr-input" rows={2} style={{ resize: 'none', fontWeight: 500, fontSize: 14 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ອະທິບາຍເຫດຜົນ ທີ່ຂໍຄະແນນ..." />
        </div>

        {(activity || task) && (
          <div className="ptd-hero">
            <div className="ptd-hero-top"><span className="ptd-hero-label"><Icon.chart /> {target === 'task' ? task?.name : activity?.name}</span></div>
            <div className="ptd-hero-num">+{add} <em>ຄະແນນ</em></div>
            <div className="ptd-hero-bar"><span className="cur" style={{ width: `${((current ?? 0) / (((current ?? 0) + add) || 1)) * 100}%` }} /><span className="add" style={{ width: `${(add / (((current ?? 0) + add) || 1)) * 100}%` }} /></div>
            <div className="ptd-hero-stats"><span>ປັດຈຸບັນ <b>{current ?? 0}</b></span>{add > 0 && <span className="up">▲ {current ? Math.round((add / current) * 100) : 100}%</span>}<span>ໃໝ່ <b>{(current ?? 0) + add}</b></span></div>
          </div>
        )}
      </div>
      <div className="footer">
        <button className={`btn primary ${ready ? '' : 'disabled'}`} onClick={() => {
          if (!ready) return
          const r = onSubmit && onSubmit({ points: add, current: current ?? 0, targetName: target === 'task' ? task?.name : activity?.name, projectName: project?.name, target, justify: reason.trim() })
          setCreated(r); setDone(true)
        }}><Icon.send /> ສົ່ງຄຳຂໍຄະແນນ</button>
      </div>
    </div>
  )
}
