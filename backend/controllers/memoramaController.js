import Memorama from '../models/memorama.js';
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-exp';

// POST /paciente/memorama
export const guardarResultado = async (req, res) => {
  try {
    const pacienteId = req.usuario._id;
    const { nivel1, nivel2, nivel3 } = req.body;

    const tiempos = [nivel1, nivel2, nivel3]
      .filter((n) => n?.completado && typeof n.tiempoSegundos === 'number')
      .map((n) => n.tiempoSegundos);

    const tiempoTotal = tiempos.length > 0 ? tiempos.reduce((a, b) => a + b, 0) : null;
    const completadoTotal = [nivel1, nivel2, nivel3].every((n) => n?.completado);

    const sesion = await Memorama.create({
      pacienteId,
      nivel1: { completado: nivel1?.completado ?? false, tiempoSegundos: nivel1?.tiempoSegundos ?? null, errores: nivel1?.errores ?? 0 },
      nivel2: { completado: nivel2?.completado ?? false, tiempoSegundos: nivel2?.tiempoSegundos ?? null, errores: nivel2?.errores ?? 0 },
      nivel3: { completado: nivel3?.completado ?? false, tiempoSegundos: nivel3?.tiempoSegundos ?? null, errores: nivel3?.errores ?? 0 },
      tiempoTotal,
      completadoTotal,
    });

    res.status(201).json({ ok: true, sesion });
  } catch (error) {
    console.error('Error guardarResultado memorama:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /paciente/memorama
export const obtenerResultados = async (req, res) => {
  try {
    const pacienteId = req.usuario._id;
    const resultados = await Memorama.find({ pacienteId })
      .sort({ fecha: -1 })
      .limit(50);
    res.json(resultados);
  } catch (error) {
    console.error('Error obtenerResultados memorama:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /paciente/memorama/analisis
export const obtenerAnalisis = async (req, res) => {
  try {
    const pacienteId = req.usuario._id;
    const resultados = await Memorama.find({ pacienteId })
      .sort({ fecha: -1 })
      .limit(30);

    if (resultados.length === 0) {
      return res.json({
        habilidades: habilidadesPorDefecto(),
        observacion: 'Aún no hay sesiones registradas. Completa partidas de memorama para ver tu análisis.',
        tendencia: 'estable',
        sesionesAnalizadas: 0,
      });
    }

    if (!GEMINI_API_KEY) {
      return res.json({
        habilidades: calcularLocal(resultados),
        observacion: 'Análisis basado en tus tiempos y precisión. ¡Sigue practicando!',
        tendencia: 'estable',
        sesionesAnalizadas: resultados.length,
      });
    }

    const resumen = resultados.map((r) => ({
      fecha: r.fecha,
      nivel1: { completado: r.nivel1.completado, tiempoSegundos: r.nivel1.tiempoSegundos, errores: r.nivel1.errores },
      nivel2: { completado: r.nivel2.completado, tiempoSegundos: r.nivel2.tiempoSegundos, errores: r.nivel2.errores },
      nivel3: { completado: r.nivel3.completado, tiempoSegundos: r.nivel3.tiempoSegundos, errores: r.nivel3.errores },
      completadoTotal: r.completadoTotal,
    }));

    const prompt = `Eres un neuropsicólogo especialista en Alzheimer.
Analiza resultados de memorama terapéutico de un paciente con Alzheimer.

DATOS: ${JSON.stringify(resumen, null, 2)}

Niveles:
- Nivel 1: 4 pares números (8 cartas), visible 5s. Ref: excelente<60s, bueno<120s, regular<200s
- Nivel 2: 4 pares imágenes (8 cartas), visible 5s. Ref: excelente<90s, bueno<180s, regular<300s
- Nivel 3: 6 pares imágenes (12 cartas), visible 2s. Ref: excelente<120s, bueno<240s, regular<420s

El puntaje de cada nivel = 60% tiempo + 40% precisión (errores=0 → 100%, cada error resta 8 puntos, mínimo 0%).

Evalúa (0-100) considerando tiempo Y errores juntos:
- memoriaVisual: capacidad de recordar posición de imágenes (niveles 2 y 3)
- atencion: constancia y foco durante el juego (nivel 1 y errores)
- velocidadProcesamiento: rapidez de respuesta (tiempo nivel 1)
- reconocimientoPatrones: identificar pares correctamente (todos los niveles, errores)
- concentracion: consistencia general (errores totales)
- memoriaCortoPlazo: retención después del tiempo de observación (nivel 3)

Responde SOLO con JSON sin markdown:
{
  "habilidades": {
    "memoriaVisual": <0-100>,
    "atencion": <0-100>,
    "velocidadProcesamiento": <0-100>,
    "reconocimientoPatrones": <0-100>,
    "concentracion": <0-100>,
    "memoriaCortoPlazo": <0-100>
  },
  "observacion": "<2-3 oraciones motivadoras y clínicas sobre el progreso>",
  "tendencia": "<mejorando|estable|necesita-apoyo>"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    });

    const texto = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!parsed || !parsed.habilidades) throw new Error('Respuesta inválida de Gemini');

    const habilidades = {};
    for (const [k, v] of Object.entries(parsed.habilidades)) {
      habilidades[k] = Math.min(100, Math.max(0, Number(v) || 0));
    }

    res.json({
      habilidades,
      observacion: parsed.observacion || '',
      tendencia: parsed.tendencia || 'estable',
      sesionesAnalizadas: resultados.length,
    });
  } catch (error) {
    console.error('Error obtenerAnalisis memorama:', error.message);
    try {
      const pacienteId = req.usuario._id;
      const resultados = await Memorama.find({ pacienteId }).sort({ fecha: -1 }).limit(30);
      res.json({
        habilidades: calcularLocal(resultados),
        observacion: 'Análisis basado en tus tiempos y errores. ¡Cada sesión cuenta!',
        tendencia: 'estable',
        sesionesAnalizadas: resultados.length,
      });
    } catch (e) {
      res.status(500).json({ error: error.message });
    }
  }
};

// ── Helpers ──
function puntuacionCombinada(tiempoSeg, errores, refs) {
  if (!tiempoSeg) return 0;

  // Puntaje tiempo (0-100)
  let pTiempo;
  if (tiempoSeg <= refs.excelente) pTiempo = 100;
  else if (tiempoSeg <= refs.bueno) pTiempo = 75;
  else if (tiempoSeg <= refs.regular) pTiempo = 50;
  else pTiempo = 25;

  // Puntaje precisión (0-100): cada error resta 8 puntos
  const pPrecision = Math.max(0, 100 - (errores || 0) * 8);

  // Ponderación: 60% tiempo + 40% precisión
  return Math.round(pTiempo * 0.6 + pPrecision * 0.4);
}

function avg(arr) {
  const clean = arr.filter((v) => v !== null && v !== undefined);
  return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null;
}

function calcularLocal(resultados) {
  const sesiones = resultados.filter((r) => r.completadoTotal);
  if (!sesiones.length) return habilidadesPorDefecto();

  const p1 = avg(sesiones.map((s) =>
    puntuacionCombinada(s.nivel1?.tiempoSegundos, s.nivel1?.errores, { excelente: 60, bueno: 120, regular: 200 })
  ));
  const p2 = avg(sesiones.map((s) =>
    puntuacionCombinada(s.nivel2?.tiempoSegundos, s.nivel2?.errores, { excelente: 90, bueno: 180, regular: 300 })
  ));
  const p3 = avg(sesiones.map((s) =>
    puntuacionCombinada(s.nivel3?.tiempoSegundos, s.nivel3?.errores, { excelente: 120, bueno: 240, regular: 420 })
  ));

  const s1 = p1 || 0, s2 = p2 || 0, s3 = p3 || 0;
  const base = Math.round((s1 + s2 + s3) / 3);
  const errTotalesAvg = avg(sesiones.map((s) =>
    (s.nivel1?.errores || 0) + (s.nivel2?.errores || 0) + (s.nivel3?.errores || 0)
  )) || 0;
  const precisionGlobal = Math.max(0, 100 - errTotalesAvg * 5);

  return {
    memoriaVisual: Math.min(100, Math.round((s2 + s3) / 2)),
    atencion: Math.min(100, Math.round(precisionGlobal * 0.5 + base * 0.5)),
    velocidadProcesamiento: Math.min(100, s1),
    reconocimientoPatrones: Math.min(100, Math.round(precisionGlobal * 0.6 + base * 0.4)),
    concentracion: Math.min(100, Math.round(precisionGlobal)),
    memoriaCortoPlazo: Math.min(100, s3),
  };
}

function habilidadesPorDefecto() {
  return {
    memoriaVisual: 0,
    atencion: 0,
    velocidadProcesamiento: 0,
    reconocimientoPatrones: 0,
    concentracion: 0,
    memoriaCortoPlazo: 0,
  };
}