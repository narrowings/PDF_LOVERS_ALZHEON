import { useEffect, useState } from 'react'
import { HiArrowTrendingDown, HiArrowTrendingUp, HiMinus, HiSparkles } from 'react-icons/hi2'
import { MemoramaAnalisis as MemoramaAnalisisTipo, fetchAnalisisMemorama } from '../../../services/api'

const HABILIDADES_LABELS: Record<string, string> = {
  memoriaVisual: 'Memoria Visual',
  atencion: 'Atención',
  velocidadProcesamiento: 'Velocidad de Procesamiento',
  reconocimientoPatrones: 'Reconocimiento de Patrones',
  concentracion: 'Concentración',
  memoriaCortoPlazo: 'Memoria a Corto Plazo',
}

function colorBarra(val: number) {
  if (val >= 75) return 'bg-emerald-400'
  if (val >= 50) return 'bg-[#3B9CFF]'
  if (val >= 25) return 'bg-yellow-400'
  return 'bg-rose-400'
}

function labelNivel(val: number) {
  if (val >= 75) return { texto: 'Excelente', color: 'text-emerald-300' }
  if (val >= 50) return { texto: 'Bueno', color: 'text-[#3B9CFF]' }
  if (val >= 25) return { texto: 'Regular', color: 'text-yellow-300' }
  return { texto: 'Por mejorar', color: 'text-rose-300' }
}

const TendenciaIcon = ({ t }: { t: string }) => {
  if (t === 'mejorando') return <HiArrowTrendingUp className="text-emerald-400 text-xl" />
  if (t === 'necesita-apoyo') return <HiArrowTrendingDown className="text-rose-400 text-xl" />
  return <HiMinus className="text-yellow-400 text-xl" />
}

export const MemoramaAnalisis = () => {
  const [analisis, setAnalisis] = useState<MemoramaAnalisisTipo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalisisMemorama()
      .then((data) => {
        // Asegurar que habilidades siempre sea un objeto
        if (data && !data.habilidades) data.habilidades = {
          memoriaVisual: 0, atencion: 0, velocidadProcesamiento: 0,
          reconocimientoPatrones: 0, concentracion: 0, memoriaCortoPlazo: 0,
        }
        setAnalisis(data)
      })
      .catch((e) => {
        console.error(e)
        setErrorMsg('No se pudo cargar el análisis. Intenta más tarde.')
      })
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return <div className="glass-panel rounded-2xl p-8 text-center text-white/60">Analizando tu desempeño con IA...</div>
  }

  if (errorMsg) {
    return <div className="glass-panel rounded-2xl p-8 text-center text-rose-300">{errorMsg}</div>
  }

  if (!analisis) {
    return <div className="glass-panel rounded-2xl p-8 text-center text-white/60">Sin datos de análisis.</div>
  }

  const sinDatos = analisis.sesionesAnalizadas === 0
  const habilidades = analisis.habilidades ?? {}

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-[#3B9CFF]/20">
          <HiSparkles className="text-2xl text-[#3B9CFF]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-white font-bold text-lg">Análisis Cognitivo</h3>
            {!sinDatos && <TendenciaIcon t={analisis.tendencia} />}
          </div>
          <p className="text-white/70 text-sm">{analisis.observacion}</p>
          {!sinDatos && (
            <p className="text-white/40 text-xs mt-2">
              Basado en {analisis.sesionesAnalizadas} sesión{analisis.sesionesAnalizadas !== 1 ? 'es' : ''} · Tiempo + errores ponderados
            </p>
          )}
        </div>
      </div>

      {/* Habilidades */}
      {sinDatos ? (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-2">
          <p className="text-3xl">🧠</p>
          <p className="text-white/70 text-sm">Completa partidas de memorama para ver tu análisis cognitivo.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-5 space-y-5">
          <h4 className="text-white font-semibold">Habilidades Cognitivas</h4>
          <div className="space-y-4">
            {Object.entries(habilidades).map(([key, val]) => {
              const numVal = Number(val) || 0
              const label = HABILIDADES_LABELS[key] ?? key
              const { texto, color } = labelNivel(numVal)
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${color}`}>{texto}</span>
                      <span className="text-white font-bold text-sm">{numVal}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colorBarra(numVal)}`}
                      style={{ width: `${numVal}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Leyenda */}
      {!sinDatos && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { label: 'Excelente', color: 'bg-emerald-400', rango: '75–100%' },
            { label: 'Bueno', color: 'bg-[#3B9CFF]', rango: '50–74%' },
            { label: 'Regular', color: 'bg-yellow-400', rango: '25–49%' },
            { label: 'Por mejorar', color: 'bg-rose-400', rango: '0–24%' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
              <span className="text-white/70">{item.label} <span className="text-white/40">({item.rango})</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}