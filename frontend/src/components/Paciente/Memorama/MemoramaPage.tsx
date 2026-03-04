import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HiCpuChip, HiChartBar, HiPhoto, HiPuzzlePiece, HiSparkles } from 'react-icons/hi2'
import { MemoramaGame, ImagenMemorama } from './MemoramaGame'
import { MemoramaResultados } from './MemoramaResultados'
import { MemoramaAnalisis } from './MemoramaAnalisis'
import { MemoramaNivel, guardarSesionMemorama, fetchPatientPhotos } from '../../../services/api'

type Seccion = 'juego' | 'resultados' | 'analisis'
type FaseJuego = 'menu' | 1 | 2 | 3 | 'fin'

const MENSAJES_FIN = [
  '¡Excelente trabajo! Tu mente sigue fuerte. 🧠',
  '¡Lo lograste! Cada partida fortalece tu memoria. ⭐',
  '¡Increíble! El ejercicio mental es tu mejor aliado. 🎉',
  '¡Muy bien hecho! Sigue así, lo estás logrando. 💪',
]

const navItems = [
  { key: 'juego' as Seccion, label: 'Jugar', icon: HiPuzzlePiece },
  { key: 'resultados' as Seccion, label: 'Mis Resultados', icon: HiChartBar },
  { key: 'analisis' as Seccion, label: 'Análisis Cognitivo', icon: HiCpuChip },
]

export const MemoramaPage = () => {
  const [seccion, setSeccion] = useState<Seccion>('juego')
  const [faseJuego, setFaseJuego] = useState<FaseJuego>('menu')
  const [niveles, setNiveles] = useState<{ nivel1?: MemoramaNivel; nivel2?: MemoramaNivel; nivel3?: MemoramaNivel }>({})
  const [guardando, setGuardando] = useState(false)
  const [mensajeFin] = useState(MENSAJES_FIN[Math.floor(Math.random() * MENSAJES_FIN.length)])
  const [imagenesPersonalizadas, setImagenesPersonalizadas] = useState<ImagenMemorama[]>([])
  const [cargandoFotos, setCargandoFotos] = useState(true)

  // Cargar fotos del paciente al montar
  useEffect(() => {
    fetchPatientPhotos()
      .then((fotos) => {
        const imagenes: ImagenMemorama[] = fotos.map((f) => ({
          id: f._id,
          url: f.url_contenido,
          label: f.etiqueta,
        }))
        setImagenesPersonalizadas(imagenes)
      })
      .catch(() => {
        // Si falla, simplemente se usarán las imágenes por defecto
      })
      .finally(() => setCargandoFotos(false))
  }, [])

  const handleNivelCompleto = (nivel: 1 | 2 | 3) => async (datos: MemoramaNivel) => {
    const actualizado = { ...niveles, [`nivel${nivel}`]: datos }
    setNiveles(actualizado)

    if (nivel < 3) {
      setTimeout(() => setFaseJuego((nivel + 1) as 2 | 3), 1500)
    } else {
      setGuardando(true)
      try {
        await guardarSesionMemorama({
          nivel1: actualizado.nivel1 ?? { completado: false, tiempoSegundos: null, errores: 0 },
          nivel2: actualizado.nivel2 ?? { completado: false, tiempoSegundos: null, errores: 0 },
          nivel3: actualizado.nivel3 ?? { completado: false, tiempoSegundos: null, errores: 0 },
        })
        toast.success('¡Sesión guardada correctamente!')
      } catch {
        toast.error('No se pudo guardar la sesión')
      } finally {
        setGuardando(false)
        setTimeout(() => setFaseJuego('fin'), 1500)
      }
    }
  }

  const reiniciar = () => {
    setNiveles({})
    setFaseJuego('menu')
  }

  const usandoFotosPersonales = imagenesPersonalizadas.length >= 6

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="glass-card rounded-3xl p-6 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[#3B9CFF]/20">
          <HiPuzzlePiece className="text-3xl text-[#3B9CFF]" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Memorama Cognitivo</h2>
          <p className="text-white/70 text-sm">Ejercita tu memoria diariamente con este juego terapéutico.</p>
        </div>
        {/* Indicador de fotos personales */}
        {!cargandoFotos && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${
            usandoFotosPersonales
              ? 'bg-[#3B9CFF]/20 border-[#3B9CFF]/30 text-[#3B9CFF]'
              : 'bg-white/10 border-white/20 text-white/50'
          }`}>
            <HiPhoto className="text-sm" />
            {usandoFotosPersonales
              ? `${imagenesPersonalizadas.length} fotos personales activas`
              : `${imagenesPersonalizadas.length}/6 fotos (usando imágenes base)`}
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex gap-2 flex-wrap">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setSeccion(item.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              seccion === item.key ? 'bg-[#3B9CFF] text-white' : 'glass-button text-white/70 hover:text-white'
            }`}
          >
            <item.icon className="text-lg" />
            {item.label}
          </button>
        ))}
      </div>

      {/* SECCIÓN JUEGO */}
      {seccion === 'juego' && (
        <>
          {faseJuego === 'menu' && (
            <div className="glass-card rounded-3xl p-8 space-y-6 text-center">
              <HiPuzzlePiece className="text-6xl text-[#3B9CFF] mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">¿Listo para jugar?</h3>
                <p className="text-white/70 text-sm max-w-md mx-auto">
                  El memorama tiene 3 niveles. En cada uno deberás encontrar pares de cartas. ¡Tus tiempos se registran!
                </p>
                {usandoFotosPersonales && (
                  <p className="text-[#3B9CFF]/80 text-xs mt-2">
                    ✦ Los niveles 2 y 3 usarán tus fotos personales
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3 text-left">
                {[
                  { n: 1, titulo: 'Nivel 1 — Números', desc: '4 pares · 8 cartas · 5s para observar', color: 'bg-blue-500/20 border-blue-500/30' },
                  { n: 2, titulo: 'Nivel 2 — Imágenes', desc: '4 pares · 8 cartas · 5s para observar', color: 'bg-purple-500/20 border-purple-500/30' },
                  { n: 3, titulo: 'Nivel 3 — Avanzado', desc: '6 pares · 12 cartas · 2s para observar', color: 'bg-rose-500/20 border-rose-500/30' },
                ].map((niv) => (
                  <div key={niv.n} className={`rounded-2xl border p-4 ${niv.color}`}>
                    <p className="text-white font-semibold text-sm">{niv.titulo}</p>
                    <p className="text-white/60 text-xs mt-1">{niv.desc}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setFaseJuego(1)}
                disabled={cargandoFotos}
                className="bg-[#3B9CFF] hover:bg-[#2d7fe0] disabled:opacity-50 transition-colors text-white font-bold px-10 py-3 rounded-2xl text-lg"
              >
                {cargandoFotos ? 'Cargando...' : '¡Comenzar!'}
              </button>
            </div>
          )}

          {(faseJuego === 1 || faseJuego === 2 || faseJuego === 3) && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className={`flex-1 h-1.5 rounded-full transition-all ${
                    n < faseJuego ? 'bg-emerald-400' : n === faseJuego ? 'bg-[#3B9CFF]' : 'bg-white/20'
                  }`} />
                ))}
              </div>
              <p className="text-xs text-white/50 text-center">Nivel {faseJuego} de 3</p>
              <MemoramaGame
                key={`nivel-${faseJuego}`}
                nivel={faseJuego}
                imagenesPersonalizadas={imagenesPersonalizadas}
                onNivelCompleto={handleNivelCompleto(faseJuego)}
              />
            </div>
          )}

          {faseJuego === 'fin' && (
            <div className="glass-card rounded-3xl p-10 text-center space-y-6">
              <HiSparkles className="text-6xl text-yellow-400 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{mensajeFin}</h3>
                <p className="text-white/60 text-sm">Has completado los 3 niveles del memorama de hoy.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['nivel1', 'nivel2', 'nivel3'] as const).map((key, i) => {
                  const t = niveles[key]?.tiempoSegundos
                  const m = t ? Math.floor(t / 60) : 0
                  const s = t ? t % 60 : 0
                  return (
                    <div key={key} className="glass-panel rounded-2xl p-4 space-y-1">
                      <p className="text-white/50 text-xs">Nivel {i + 1}</p>
                      <p className="text-white font-mono font-bold">{t != null ? (m > 0 ? `${m}m ${s}s` : `${s}s`) : '—'}</p>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={reiniciar} className="glass-button text-white font-semibold px-8 py-3 rounded-2xl">
                  Jugar de nuevo
                </button>
                <button
                  onClick={() => { reiniciar(); setSeccion('resultados') }}
                  className="bg-[#3B9CFF] text-white font-semibold px-8 py-3 rounded-2xl"
                >
                  Ver mis resultados
                </button>
              </div>
              {guardando && <p className="text-white/40 text-xs">Guardando sesión...</p>}
            </div>
          )}
        </>
      )}

      {seccion === 'resultados' && <MemoramaResultados />}
      {seccion === 'analisis' && <MemoramaAnalisis />}
    </div>
  )
}