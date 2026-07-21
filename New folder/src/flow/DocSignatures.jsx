import { Icon } from './shared.jsx'
import { nameOf } from '../home/data.js'

// ── mock ລາຍເຊັນ cursive ຕາມຊື່ (seed ດ້ວຍຊື່ ໃຫ້ແຕ່ລະຄົນຕ່າງກັນ) ──
const SIG_PATHS = [
  'M6 30 Q20 6 32 28 T54 25 Q68 8 82 28 T114 20',
  'M8 26 C18 8 26 34 36 20 S56 8 66 26 92 30 112 16',
  'M6 24 Q16 40 28 22 T50 24 Q64 40 80 22 T112 26',
  'M8 20 Q22 44 34 22 Q46 6 58 26 Q72 42 86 22 Q98 8 114 24',
  'M6 28 Q18 10 30 26 Q40 38 52 22 Q64 8 76 26 Q90 40 114 18',
]
export function MockSignature({ id, w = 100 }) {
  const name = nameOf(id)
  const seed = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  const path = SIG_PATHS[seed % SIG_PATHS.length]
  return (
    <svg className="mock-sig" viewBox="0 0 120 44" width={w} height={w * 44 / 120}>
      <path d={path} fill="none" stroke="#1a2a5e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── ບ່ອນລາຍເຊັນ ຂອງທຸກຄົນ (ຜູ້ເຊັນ = ລາຍເຊັນ / ຜູ້ອະນຸມັດ = ✓ອະນຸມັດ / ຍັງບໍ່ເຊັນ = ບ່ອນວ່າງ) ──
// meId → ໄຮໄລທ໌ບ່ອນຂອງຜູ້ທີ່ກຳລັງເຊັນ (ໃຫ້ຮູ້ວ່າຕ້ອງເຊັນບ່ອນໃດ)
export function SignedSignatures({ doc, meId }) {
  const list = doc.signers.filter((s) => s.role === 'signer') // ຜู้อนุมัด ບໍ່ຂຶ້ນເອกະສານ
  if (!list.length) return null
  return (
    <div className="doc-sigs">
      {list.map((s) => {
        const signed = s.status === 'signed'
        const approver = s.role === 'approver'
        const here = s.id === meId && !signed
        return (
          <div className={`doc-sig ${here ? 'mine' : ''}`} key={s.id}>
            {signed
              ? (approver ? <span className="doc-sig-approve"><Icon.checkCircle /> ອະນຸມັດແລ້ວ</span> : <MockSignature id={s.id} />)
              : <span className="doc-sig-empty-line" />}
            <span className="doc-sig-line" />
            <b className="doc-sig-name">{nameOf(s.id)}{approver ? ' · ຜູ້ອະນຸມັດ' : ''}</b>
            <span className={`doc-sig-meta ${signed ? '' : 'wait'} ${here ? 'here' : ''}`}>
              {signed
                ? <><Icon.check /> {approver ? 'ອະນຸມັດແລ້ວ' : 'ເຊັນແລ້ວ'}{s.time ? ` · ${s.time}` : ''}</>
                : (here ? '← ບ່ອນຂອງທ່ານ · ລໍຖ້າເຊັນ' : 'ລໍຖ້າເຊັນ')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── ເນື້ອໃນໜ້າເອກະສານ (mockup ຄ້າຍເອກະສານທາງການ) — ໃຊ້ຮ່ວມ SignScreen ແລະ DocDetail ──
export function DocPageBody({ doc, file, wm, meId }) {
  return (
    <div className="mockdoc">
      {wm && <div className="sign-wm"><span>AIDC DOCUMENT</span></div>}
      <div className="mockdoc-head">
        <div><b>ບໍລິສັດ AIDC Tech Sole Co., Ltd</b><span>ນະຄອນຫຼວງວຽງຈັນ · ສປປ ລາວ</span></div>
        <div className="mockdoc-ref"><span>ເລກທີ: {doc.docNo || `AIDC/${doc.id}`}</span><span>ວັນທີ: {doc.date}</span></div>
      </div>
      {file && <div className="mockdoc-filetag"><Icon.pdf /> {file.name}</div>}
      <h3 className="mockdoc-title">{doc.title}</h3>
      <p className="mockdoc-note">— ເອກະສານຕົວຢ່າງ (SAMPLE) ສຳລັບທົດສອບການລົງນາມ —</p>
      <div className="mockdoc-body">
        <p>ຮຽນ ຜູ້ທີ່ກ່ຽວຂ້ອງທຸກທ່ານ,</p>
        <p>ຕາມທີ່ ບໍລິສັດ AIDC Tech Sole Co., Ltd ໄດ້ດຳເນີນການກ່ຽວກັບ ໂຄງການ ຕາມລາຍລະອຽດ ແລະ ເງື່ອນໄຂ ທີ່ລະບຸໄວ້ໃນເອກະສານສະບັບນີ້.</p>
        <p>ຈຶ່ງຮຽນມາເພື່ອໃຫ້ຜູ້ທີ່ກ່ຽວຂ້ອງ ພິຈາລະນາ ແລະ ລົງນາມຮັບຮອງ ຕາມລຳດັບ. ບໍລິສັດ ຫວັງເປັນຢ່າງຍິ່ງ ວ່າຈະໄດ້ຮັບຄວາມຮ່ວມມື ດ້ວຍດີ.</p>
      </div>
      <div className="mockdoc-sig">
        <p className="mockdoc-sig-label">ບ່ອນລາຍເຊັນ</p>
        <SignedSignatures doc={doc} meId={meId} />
      </div>
    </div>
  )
}
