import { useState } from 'react'
import { Icon, groupSignatories, isOrdered, normalizeSteps, uid } from './shared.jsx'
import { nowDate, nextDocNo } from '../home/data.js'
import Step1Input from './Step1Input.jsx'
import Step2Place from './Step2Place.jsx'
import Step3Send from './Step3Send.jsx'

export default function SignatureFlow({ onExit, onCreate, me = 'A', docSubtypes, docCategories, docs = [] }) {
  const [screen, setScreen] = useState(1)
  const [done, setDone] = useState(false)

  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('ເອກະສານທົ່ວໄປ') // Q5: ປະເພດກຳນົດເສັ້ນທາງ (legacy — ໃຊ້ຮ່ວມ E11/E15/filter)
  const [docSubtype, setDocSubtype] = useState('gen') // E7/E8/E10: ເອກະສານຍ່ອຍ (2-layer catalog)
  const [otherTypeName, setOtherTypeName] = useState('') // E10 "ອື່ນໆ": ຊື່ປະເພດທີ່ຜູ້ໃຊ້ພິມເອງ
  const [pdfs, setPdfs] = useState([])
  const [attachments, setAttachments] = useState([])
  const [signers, setSigners] = useState([])   // {id,name,email,role:'signer'|'cc',step,locked?}
  const [placements, setPlacements] = useState([])

  // prefix ເລກທີເອກະສານ ຈາກ subtypes ສົດ (Tab 6 ອາດແກ້/ເພີ່ມ) — ຫ້າມອ່ານ DEFAULT ຕອນສ້າງຈິງ ບໍ່ດັ່ງນັ້ນ preview ກັບເລກຈິງບໍ່ກົງກັນ
  const docPrefix = docSubtype === 'other' ? 'OTH' : ((docSubtypes || []).find((s) => s.key === docSubtype)?.prefix || 'GEN')
  // ເລກທີເຕັມ ຄິດຈາກ docs ຈິງ (Lucky 18/07: ໂຊເລກເຕັມເລີຍ ບໍ່ແມ່ນ xxx) — ເລກດຽວກັນນີ້ຈະຖືກໃຊ້ຕອນສົ່ງຈິງ
  const docNoPreview = nextDocNo(docs, { docPrefix }, nowDate())

  const store = {
    title, setTitle, docType, setDocType, docSubtype, setDocSubtype, otherTypeName, setOtherTypeName, docPrefix, docNoPreview,
    pdfs, setPdfs, attachments, setAttachments, signers, setSigners, placements, setPlacements,
  }

  const goTo = (n) => setScreen(n)
  const submit = () => {
    // ສ້າງ doc ຈິງຈາກຂໍ້ມູນ → save ເຂົ້າ tab 1 (ລໍຖ້າຜູ້ອື່ນ)
    const signatories = normalizeSteps(signers.filter((s) => isOrdered(s.role)))
    onCreate && onCreate({
      id: uid(),
      title: title.trim() || 'ເອກະສານໃໝ່',
      docType, // ປະເພດເອກະສານ (Q5, legacy) → ໂຊເທິງການ໌ດ/detail + filter ໄດ້
      docSubtype, // ເອກະສານຍ່ອຍ (E7/E8/E10) → docNo prefix ລະອຽດ + Flow Setting
      docPrefix, // prefix ຈິງ ຈາກ subtypes ສົດ (ຮອງຮັບ subtype ທີ່ແກ້/ສ້າງໃໝ່ໃນ Tab 6 + "ອື່ນໆ")
      otherTypeName: docSubtype === 'other' ? (otherTypeName.trim() || 'ອື່ນໆ') : undefined, // E10: ຊື່ປະເພດທີ່ພິມເອງ → ໂຊແທນຊື່ປະເພດໃນ detail
      creatorId: me,
      // realtime: ວັນທີສ້າງ = ມື້ນີ້ຈິງ (Lucky ສັ່ງ 17/07) · ts = ວັນຂອງເດືອນ ໃຊ້ filter ໄລຍະເວລາ
      date: nowDate(),
      ts: new Date().getDate(),
      files: pdfs.map((p) => ({ id: p.id, name: p.name, pages: p.pages || 1, file: p.file })),
      attachments: attachments.map((a) => ({ name: a.name, file: a.file })),
      signers: signatories.map((s) => ({ id: s.id, step: s.step, status: 'pending', role: s.role || 'signer' })),
      placements: placements.map((p) => ({ ...p })), // ตำแหน่ง sign field ราย signer (ຈາກ Step2)
      comments: [],
      status: 'progress',
    })
    setDone(true)
  }
  const resetAll = () => {
    setScreen(1); setDone(false); setTitle(''); setDocType('ເອກະສານທົ່ວໄປ'); setDocSubtype('gen'); setOtherTypeName(''); setPdfs([]); setAttachments([])
    setSigners([]); setPlacements([])
  }

  if (done) {
    const docSigners = signers.filter((s) => s.role === 'signer')
    const approvers = signers.filter((s) => s.role === 'approver')
    const cc = signers.filter((s) => s.role === 'cc')
    const steps = groupSignatories(signers.filter((s) => isOrdered(s.role))).length
    return (
      <div className="app">
        <div className="header"><div className="header-text center"><h1>ສົ່ງເພື່ອເຊັນ</h1></div></div>
        <div className="success">
          <div className="success-check"><Icon.check /></div>
          <h2>ສົ່ງເອກະສານສຳເລັດ!</h2>
          <p>“{title}” ຖືກສົ່ງໄປຫາ<br />
            ຜູ້ລົງນາມ {docSigners.length} ຄົນ ({steps} ຂັ້ນຕອນ){approvers.length > 0 ? ` · ອະນຸມັດ ${approvers.length}` : ''}{cc.length > 0 ? ` · CC ${cc.length}` : ''}</p>
          <div className="success-btns">
            <button className="btn ghost" onClick={() => { resetAll(); onExit && onExit() }}>ກັບໜ້າຫຼັກ</button>
            <button className="btn primary" onClick={resetAll}>ສ້າງເອກະສານໃໝ່</button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 1) return <Step1Input store={store} me={me} docSubtypes={docSubtypes} docCategories={docCategories} onNext={() => goTo(2)} onBack={onExit} />
  if (screen === 2) return <Step2Place store={store} onBack={() => goTo(1)} onNext={() => goTo(3)} />
  return <Step3Send store={store} onBack={() => goTo(2)} onSubmit={submit} />
}
