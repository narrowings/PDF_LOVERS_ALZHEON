import { useCallback, useEffect, useRef, useState } from 'react'
import { HiCheckCircle, HiClock, HiStar, HiXMark } from 'react-icons/hi2'
import { MemoramaNivel } from '../../../services/api'

const IMAGENES = [
  { id: 'img1', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80', label: 'Gato' },
  { id: 'img2', url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=80', label: 'Perro' },
  { id: 'img3', url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=300&q=80', label: 'Flor' },
  { id: 'img4', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80', label: 'Playa' },
  { id: 'img5', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80', label: 'Montaña' },
  { id: 'img6', url: 'https://images.unsplash.com/photo-1444927714506-b3d4388fcf3a?w=300&q=80', label: 'Mariposa' },
]

interface Carta {
  uid: string
  valor: string
  tipo: 'numero' | 'imagen'
  imageUrl?: string
  label?: string
}

function crearTablero(nivel: 1 | 2 | 3): { cartas: Carta[]; visiblesInicio: number; pares: number; titulo: string; descripcion: string } {
  if (nivel === 1) {
    const nums = ['1', '2', '3', '4']
    const cartas: Carta[] = barajar([...nums, ...nums].map((n, i) => ({ uid: `n1-${n}-${i}`, valor: n, tipo: 'numero' as const })))
    return { cartas, visiblesInicio: 5, pares: 4, titulo: 'Nivel 1 — Números', descripcion: 'Observa los 4 pares durante 5 segundos y encuéntralos.' }
  }
  if (nivel === 2) {
    const imgs = IMAGENES.slice(0, 4)
    const cartas: Carta[] = barajar([...imgs, ...imgs].map((img, i) => ({ uid: `n2-${img.id}-${i}`, valor: img.id, tipo: 'imagen' as const, imageUrl: img.url, label: img.label })))
    return { cartas, visiblesInicio: 5, pares: 4, titulo: 'Nivel 2 — Imágenes', descripcion: 'Observa los 4 pares de imágenes durante 5 segundos.' }
  }
  const imgs = IMAGENES.slice(0, 6)
  const cartas: Carta[] = barajar([...imgs, ...imgs].map((img, i) => ({ uid: `n3-${img.id}-${i}`, valor: img.id, tipo: 'imagen' as const, imageUrl: img.url, label: img.label })))
  return { cartas, visiblesInicio: 2, pares: 6, titulo: 'Nivel 3 — Avanzado', descripcion: 'Observa los 6 pares durante solo 2 segundos. ¡Concéntrate!' }
}

function barajar<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatSeg(s: number) {
  const m = Math.floor(s / 60)
  const seg = s % 60
  return m > 0 ? `${m}m ${seg}s` : `${seg}s`
}

interface Props {
  nivel: 1 | 2 | 3
  onNivelCompleto: (nivel: MemoramaNivel) => void
}

type FaseJuego = 'inicio' | 'jugando' | 'completado'

export const MemoramaGame = ({ nivel, onNivelCompleto }: Props) => {
  const tablero = useRef(crearTablero(nivel))
  const [fase, setFase] = useState<FaseJuego>('inicio')
  const [countdown, setCountdown] = useState(tablero.current.visiblesInicio)
  const [voltcadas, setVoltcadas] = useState<string[]>([])
  const [encontradas, setEncontradas] = useState<string[]>([])
  const [bloqueado, setBloqueado] = useState(false)
  const [tiempoSeg, setTiempoSeg] = useState(0)
  const [errores, setErrores] = useState(0)
  const [ultimoError, setUltimoError] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown inicio
  useEffect(() => {
    if (fase !== 'inicio') return
    if (countdown <= 0) { setFase('jugando'); setVoltcadas([]); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [fase, countdown])

  // Timer juego
  useEffect(() => {
    if (fase === 'jugando') {
      timerRef.current = setInterval(() => setTiempoSeg((t) => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fase])

  const handleCarta = useCallback((uid: string) => {
    if (bloqueado || fase !== 'jugando') return
    if (voltcadas.includes(uid) || encontradas.includes(uid)) return
    if (voltcadas.length === 1 && voltcadas[0] === uid) return

    const nuevasVolt = [...voltcadas, uid]
    setVoltcadas(nuevasVolt)

    if (nuevasVolt.length === 2) {
      setBloqueado(true)
      const [uid1, uid2] = nuevasVolt
      const carta1 = tablero.current.cartas.find((c) => c.uid === uid1)!
      const carta2 = tablero.current.cartas.find((c) => c.uid === uid2)!

      if (carta1.valor === carta2.valor) {
        const nuevasEnc = [...encontradas, uid1, uid2]
        setEncontradas(nuevasEnc)
        setVoltcadas([])
        setBloqueado(false)
        setUltimoError(false)

        if (nuevasEnc.length === tablero.current.cartas.length) {
          setFase('completado')
          onNivelCompleto({ completado: true, tiempoSegundos: tiempoSeg + 1, errores })
        }
      } else {
        // Error
        const nuevosErrores = errores + 1
        setErrores(nuevosErrores)
        setUltimoError(true)
        setTimeout(() => {
          setVoltcadas([])
          setBloqueado(false)
          setUltimoError(false)
        }, 900)
      }
    }
  }, [bloqueado, fase, voltcadas, encontradas, tiempoSeg, errores, onNivelCompleto])

  const t = tablero.current
  const cols = t.cartas.length <= 8 ? 4 : 4

  // Estrellas según tiempo
  const limites = nivel === 1 ? [60, 90, 150] : nivel === 2 ? [90, 150, 240] : [120, 200, 360]
  const estrellas = tiempoSeg <= limites[0] ? 3 : tiempoSeg <= limites[1] ? 3 : tiempoSeg <= limites[2] ? 2 : 1

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-lg font-bold text-white">{t.titulo}</h3>
            <p className="text-xs text-white/60">{t.descripcion}</p>
          </div>
          {fase === 'jugando' && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 glass-button px-3 py-1.5 rounded-full">
                <HiClock className="text-[#3B9CFF] text-sm" />
                <span className="text-white font-mono font-bold text-sm">{formatSeg(tiempoSeg)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30">
                <HiXMark className="text-rose-400 text-xs" />
                <span className="text-rose-300 text-xs font-semibold">{errores} error{errores !== 1 ? 'es' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Countdown */}
      {fase === 'inicio' && (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
          <p className="text-white/70 text-sm">¡Memoriza las cartas!</p>
          <p className="text-6xl font-bold text-[#3B9CFF]">{countdown}</p>
          <p className="text-white/50 text-xs">segundos para observar</p>
        </div>
      )}

      {/* Tablero */}
      {fase !== 'completado' && (
        <div
          className={`grid gap-3 transition-all ${ultimoError ? 'animate-pulse' : ''}`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {t.cartas.map((carta) => {
            const voltcada = fase === 'inicio' || voltcadas.includes(carta.uid)
            const encontrada = encontradas.includes(carta.uid)
            const visible = voltcada || encontrada
            const esError = ultimoError && voltcadas.includes(carta.uid)

            return (
              <button
                key={carta.uid}
                onClick={() => handleCarta(carta.uid)}
                disabled={fase !== 'jugando' || encontrada || voltcadas.includes(carta.uid)}
                className={[
                  'aspect-square rounded-2xl transition-all duration-300 flex items-center justify-center select-none border-2',
                  encontrada
                    ? 'border-emerald-400/60 bg-emerald-500/20 cursor-default'
                    : esError
                    ? 'border-rose-500/60 bg-rose-500/20'
                    : visible
                    ? 'border-[#3B9CFF]/60 bg-[#3B9CFF]/10'
                    : 'border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer',
                ].join(' ')}
              >
                {visible ? (
                  carta.tipo === 'numero' ? (
                    <span className={`text-3xl font-bold ${encontrada ? 'text-emerald-300' : esError ? 'text-rose-300' : 'text-white'}`}>
                      {carta.valor}
                    </span>
                  ) : (
                    <img
                      src={carta.imageUrl}
                      alt={carta.label}
                      className={`w-full h-full object-cover rounded-xl ${encontrada ? 'opacity-60' : 'opacity-100'}`}
                    />
                  )
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white/40 text-lg">?</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Completado */}
      {fase === 'completado' && (
        <div className="glass-card rounded-2xl p-8 text-center space-y-4">
          <HiCheckCircle className="text-5xl text-emerald-400 mx-auto" />
          <h4 className="text-2xl font-bold text-white">¡Nivel completado!</h4>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-[#3B9CFF]">
              <HiClock />
              <span className="font-mono font-semibold">{formatSeg(tiempoSeg)}</span>
            </div>
            <div className="flex items-center gap-2 text-rose-300">
              <HiXMark />
              <span className="font-semibold">{errores} error{errores !== 1 ? 'es' : ''}</span>
            </div>
          </div>
          <div className="flex justify-center gap-1">
            {[1, 2, 3].map((s) => (
              <HiStar key={s} className={`text-2xl ${s <= estrellas ? 'text-yellow-400' : 'text-white/20'}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}