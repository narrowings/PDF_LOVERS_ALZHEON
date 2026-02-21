import axios from 'axios'

//export const api = axios.create({
//  baseURL: import.meta.env.VITE_API_URL,     ///ESTO NO VA
//  withCredentials: true,
//})

export interface PatientPhoto {
  _id: string
  etiqueta: string
  url_contenido: string
  descripcion?: string
}

export interface PatientRecording {
  _id: string
  photoId: string
  fotoUrl: string
  fecha: string
  duracion: number
  audioUrl?: string
  nota?: string
  descripcionTexto?: string
  transcripcion?: string
  tipoContenido?: 'audio' | 'texto' | 'ambos'
}

export type ReminderFrequency = 'diario' | 'cada_2_dias' | 'semanal'

export interface ReminderSettings {
  enabled: boolean
  hour: string
  frequency: ReminderFrequency
  motivationalMessage: string
  nextSession?: string
}

export interface PatientProfile {
  nombre: string
  email: string
  telefono?: string
}

export interface UploadRecordingPayload {
  photoId: string
  audioBlob?: Blob
  duration?: number
  note?: string
  descripcionTexto?: string
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const fetchPatientPhotos = async (): Promise<PatientPhoto[]> => {
  const { data } = await apiClient.get('/api/paciente/fotos')
  return data
}

export const uploadPatientRecording = async (payload: UploadRecordingPayload): Promise<void> => {
  const formData = new FormData()
  formData.append('photoId', payload.photoId)
  
  if (payload.audioBlob) {
    formData.append('audio', payload.audioBlob)
    if (payload.duration) {
      formData.append('duration', payload.duration.toString())
    }
  }
  
  if (payload.descripcionTexto) {
    formData.append('descripcionTexto', payload.descripcionTexto)
  }
  
  if (payload.note) {
    formData.append('note', payload.note)
  }

  await apiClient.post('/api/paciente/grabar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const fetchPatientRecordings = async (): Promise<PatientRecording[]> => {
  const { data } = await apiClient.get('/api/paciente/grabaciones')
  return data
}

export const fetchReminderSettings = async (): Promise<ReminderSettings> => {
  const { data } = await apiClient.get('/api/paciente/configuracion')
  return data
}

export const updateReminderSettings = async (settings: ReminderSettings): Promise<ReminderSettings> => {
  const { data } = await apiClient.put('/api/paciente/configuracion', settings)
  return data
}

export const updatePatientProfile = async (profile: PatientProfile): Promise<PatientProfile> => {
  const { data } = await apiClient.put('/api/paciente/perfil', profile)
  return data
}

export const updatePatientPassword = async (payload: { currentPassword: string, newPassword: string }) => {
  const { data } = await apiClient.put('/api/paciente/perfil/password', payload)
  return data
}

// ── MEMORAMA ──────────────────────────────────────────────

export interface MemoramaNivel {
  completado: boolean;
  tiempoSegundos: number | null;
  errores: number;
}

export interface MemoramaSesion {
  _id: string;
  fecha: string;
  nivel1: MemoramaNivel;
  nivel2: MemoramaNivel;
  nivel3: MemoramaNivel;
  tiempoTotal: number | null;
  completadoTotal: boolean;
}

export interface MemoramaAnalisis {
  habilidades: {
    memoriaVisual: number;
    atencion: number;
    velocidadProcesamiento: number;
    reconocimientoPatrones: number;
    concentracion: number;
    memoriaCortoPlazo: number;
  };
  observacion: string;
  tendencia: 'mejorando' | 'estable' | 'necesita-apoyo';
  sesionesAnalizadas: number;
}

export const guardarSesionMemorama = async (data: {
  nivel1: MemoramaNivel;
  nivel2: MemoramaNivel;
  nivel3: MemoramaNivel;
}): Promise<{ ok: boolean; sesion: MemoramaSesion }> => {
  const res = await apiClient.post('/api/paciente/memorama', data);
  return res.data;
};

export const fetchSesionesMemorama = async (): Promise<MemoramaSesion[]> => {
  const res = await apiClient.get('/api/paciente/memorama');
  return Array.isArray(res.data) ? res.data : res.data?.sesiones ?? [];
};

export const fetchAnalisisMemorama = async (): Promise<MemoramaAnalisis> => {
  const res = await apiClient.get('/api/paciente/memorama/analisis');
  return res.data;
};