import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { Icon, SectionHead } from './shared.jsx'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// ດຶງข้อความจาก PDF ແລ້ວสรุปแบบง่าย (ตัวแทน AI summary ในตัว prototype)
async function summarize(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let text = ''
  const n = Math.min(pdf.numPages, 4)
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    text += tc.items.map((it) => it.str).join(' ') + ' '
  }
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return { text: 'ບໍ່ພົບຂໍ້ຄວາມໃນເອກະສານ (ອາດເປັນຮູບສະແກນ)', pages: pdf.numPages }
  // ຂ້າມຫົວກະດາດ/ຄຳຂວັນ ໄປຫາເນື້ອໃນຕົວຈິງ
  const markers = ['ດ້ວຍ ', 'ຂໍຮຽນເຊີນ', 'ຈຶ່ງຮຽນເຊີນ', 'ເລື່ອງ', 'ຮຽນ:']
  let start = -1
  for (const m of markers) { const i = clean.indexOf(m); if (i >= 0 && (start < 0 || i < start)) start = i }
  const body = start >= 0 ? clean.slice(start) : clean
  let s = body.slice(0, 240)
  if (body.length > 240) {
    const cut = s.lastIndexOf(' ')
    s = (cut > 60 ? s.slice(0, cut) : s) + ' …'
  }
  return { text: s, pages: pdf.numPages }
}

export default function AiSummary({ files }) {
  const [map, setMap] = useState({}) // id -> {loading|text|error, pages}
  const started = useRef(new Set())

  useEffect(() => {
    files.forEach((f) => {
      if (started.current.has(f.id)) return
      started.current.add(f.id)
      setMap((m) => ({ ...m, [f.id]: { loading: true } }))
      summarize(f.file)
        .then((r) => setMap((m) => ({ ...m, [f.id]: { loading: false, ...r } })))
        .catch(() => setMap((m) => ({ ...m, [f.id]: { loading: false, error: true } })))
    })
  }, [files])

  if (!files.length) return null

  return (
    <div className="card ai-card">
      <SectionHead icon={<Icon.sparkle />} title="ສະຫຼຸບໂດຍ AI" sub="ສະຫຼຸບເນື້ອໃນເອກະສານໂດຍອັດຕະໂນມັດ"
        right={<span className="ai-badge">AI</span>} />
      {files.map((f) => {
        const s = map[f.id] || { loading: true }
        return (
          <div className="ai-item" key={f.id}>
            <div className="ai-file"><span className="file-badge sm"><Icon.pdf /></span> <b>{f.name}</b></div>
            {s.loading ? (
              <div className="ai-shimmer"><span /><span /><span /></div>
            ) : s.error ? (
              <p className="muted">ສະຫຼຸບບໍ່ໄດ້</p>
            ) : (
              <p className="ai-text">{s.text}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
