import { useEffect, useRef } from 'react'

export default function Signature({ label, hint, onChange }) {
  const ref = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)

  useEffect(() => {
    const c = ref.current
    const dpr = window.devicePixelRatio || 1
    const rect = c.getBoundingClientRect()
    c.width = rect.width * dpr
    c.height = rect.height * dpr
    const ctx = c.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1c1b1a'
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, rect.width, rect.height)
  }, [])

  const pos = e => {
    const r = ref.current.getBoundingClientRect()
    const p = e.touches ? e.touches[0] : e
    return { x: p.clientX - r.left, y: p.clientY - r.top }
  }
  const start = e => { e.preventDefault(); drawing.current = true; last.current = pos(e) }
  const move = e => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = ref.current.getContext('2d'); const p = pos(e)
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke()
    last.current = p
  }
  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    onChange(ref.current.toDataURL('image/png'))
  }
  const clear = () => {
    const c = ref.current; const ctx = c.getContext('2d'); const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width / dpr, c.height / dpr)
    onChange(null)
  }

  return (
    <div className="sig">
      <div className="sig-head">
        <span>{label}{hint ? <em> {hint}</em> : null}</span>
        <button type="button" className="sig-clear" onClick={clear}>Effacer</button>
      </div>
      <canvas ref={ref} className="sig-canvas"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
    </div>
  )
}
