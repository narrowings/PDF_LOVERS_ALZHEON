import { useEffect, useState } from 'react'
import { HiCalendar, HiCheckCircle, HiClock, HiXCircle, HiXMark } from 'react-icons/hi2'
import { MemoramaSesion, fetchSesionesMemorama } from '../../../services/api'

function formatSeg(s: number | null) {
  if (s === null || s === undefined) return '—'
  const m = Math.floor(s / 60)
  const seg = s % 60
  return m > 0 ? `${m}m ${seg}s` : `${seg}s`
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const NivelBadge = ({ completado, tiempo, errores }: { completado: boolean; tiempo: number | null; errores: number }) => (
  <div className={`flex flex-col gap-1 px-3 py-2 rounded-xl text-xs font-semibold border ${
    completado
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : 'bg-white/10 text-white/40 border-white/10'
  }`}>
    {completado ? (
      <>
        <div className="flex items-center gap-1.5">
          <HiCheckCircle className="text-sm" />
          <span>{formatSeg(tiempo)}</span>
        </div>
        <div className="flex items-center gap-1 text-rose-300/80">
          <HiXMark className="text-xs" />
          <span>{errores ?? 0} error{(errores ?? 0) !== 1 ? 'es' : ''}</span>
        </div>
      </>
    ) : (
      <div className="flex items-center gap-1.5">
        <HiXCircle className="text-sm" />
        <span>No completado</span>
      </div>
    )}
  </div>
)

export const MemoramaResultados = () => {
  const [sesiones, setSesiones] = useState<MemoramaSesion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSesionesMemorama()
      .then((data) => {
        setSesiones(Array.isArray(data) ? data : [])
      })
      .catch((e) => {
        console.error(e)
        setError('No se pudo cargar el historial.')
        setSesiones([])
      })
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return <div className="glass-panel rounded-2xl p-8 text-center text-white/60">Cargando historial...</div>
  }

  if (error) {
    return <div className="glass-panel rounded-2xl p-8 text-center text-rose-300">{error}</div>
  }

  if (sesiones.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center space-y-2">
        <p className="text-2xl">🧩</p>
        <p className="text-white font-semibold">Aún no hay partidas registradas</p>
        <p className="text-white/60 text-sm">Completa tu primer memorama para ver los resultados aquí.</p>
      </div>
    )
  }
  

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white/70 text-sm">
        <HiClock />
        <span>{sesiones.length} sesión{sesiones.length !== 1 ? 'es' : ''} registrada{sesiones.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3">
        {sesiones.map((s) => (
          <div key={s._id} className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <HiCalendar className="text-[#3B9CFF]" />
                <span>{formatFecha(s.fecha)}</span>
              </div>
              {s.completadoTotal && (
                <span className="bg-[#3B9CFF]/20 text-[#3B9CFF] border border-[#3B9CFF]/30 px-3 py-1 rounded-full text-xs font-bold">
                  ✓ Completo
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['nivel1', 'nivel2', 'nivel3'] as const).map((key, i) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs text-white/50 uppercase tracking-wide">Nivel {i + 1}</p>
                  <NivelBadge
                    completado={s[key]?.completado ?? false}
                    tiempo={s[key]?.tiempoSegundos ?? null}
                    errores={s[key]?.errores ?? 0}
                  />
                </div>
              ))}
            </div>

            {s.tiempoTotal !== null && (
              <div className="border-t border-white/10 pt-2 flex items-center gap-2 text-white/70 text-sm">
                <HiClock className="text-yellow-400" />
                <span>Tiempo total: <strong className="text-white">{formatSeg(s.tiempoTotal)}</strong></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
