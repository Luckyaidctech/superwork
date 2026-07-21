import { useRef, useEffect } from 'react'

// canvas ວາດລາຍເຊັນ → dataURL (ໃຊ້ໃນ Settings + ໜ້າລົງນາມ)
export default function SignaturePad({ onChange }) {
  const ref = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const dirty = useRef(false)

  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#12203a'
    const pos = (e) => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) } }
    const down = (e) => { e.preventDefault(); drawing.current = true; last.current = pos(e) }
    const move = (e) => {
      if (!drawing.current) return
      e.preventDefault()
      const p = pos(e)
      ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke()
      last.current = p; dirty.current = true
    }
    const up = () => { if (drawing.current && dirty.current) onChange?.(c.toDataURL('image/png')); drawing.current = false }
    c.addEventListener('pointerdown', down)
    c.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [onChange])

  const clear = () => { const c = ref.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); dirty.current = false; onChange?.(null) }

  return (
    <div className="sigpad-wrap">
      <canvas ref={ref} width={640} height={240} className="sigpad" />
      <div className="sigpad-line" />
      <button className="sigpad-clear" onClick={clear}>ລ້າງ</button>
    </div>
  )
}
