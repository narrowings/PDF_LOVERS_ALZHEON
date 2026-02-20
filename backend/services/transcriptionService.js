import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Transcribe un archivo de audio usando AssemblyAI (tiene créditos gratuitos)
 * @param {Buffer} audioBuffer - Buffer del archivo de audio
 * @param {string} originalName - Nombre original del archivo
 * @returns {Promise<string>} - Texto transcrito
 */
export const transcribeAudio = async (audioBuffer, originalName = 'audio.webm') => {
    console.log('🎙️ Iniciando transcripción de audio con AssemblyAI...');
    console.log('   - Tamaño del buffer:', audioBuffer.length, 'bytes');
    console.log('   - Nombre del archivo:', originalName);
    
    try {
        // Verificar si hay API key configurada
        if (!process.env.ASSEMBLYAI_API_KEY) {
            console.warn('⚠️ ASSEMBLYAI_API_KEY no configurada. Transcripción deshabilitada.');
            return null;
        }

        console.log('✅ API Key de AssemblyAI encontrada');

        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        const baseUrl = 'https://api.assemblyai.com/v2';

        // Paso 1: Subir el audio a AssemblyAI
        console.log('☁️ Subiendo audio a AssemblyAI...');
        const uploadResponse = await axios.post(
            `${baseUrl}/upload`,
            audioBuffer,
            {
                headers: {
                    'authorization': apiKey,
                    'content-type': 'application/octet-stream',
                }
            }
        );

        const uploadUrl = uploadResponse.data.upload_url;
        console.log('✅ Audio subido, URL:', uploadUrl.substring(0, 50) + '...');

        // Paso 2: Solicitar transcripción
        console.log('🌐 Solicitando transcripción...');
        const transcriptResponse = await axios.post(
            `${baseUrl}/transcript`,
            {
                audio_url: uploadUrl,
                speech_models: ['universal-2'],
                language_code: 'es', // Español
            },
            {
                headers: {
                    'authorization': apiKey,
                    'content-type': 'application/json',
                }
            }
        );

        const transcriptId = transcriptResponse.data.id;
        console.log('📝 Transcripción iniciada, ID:', transcriptId);

        // Paso 3: Esperar a que se complete la transcripción
        let transcript;
        let attempts = 0;
        const maxAttempts = 60; // Máximo 60 segundos

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo

            const statusResponse = await axios.get(
                `${baseUrl}/transcript/${transcriptId}`,
                {
                    headers: {
                        'authorization': apiKey,
                    }
                }
            );

            transcript = statusResponse.data;

            if (transcript.status === 'completed') {
                console.log('✅ Transcripción completada');
                console.log('   Texto:', transcript.text.substring(0, 100) + '...');
                return transcript.text;
            } else if (transcript.status === 'error') {
                console.error('❌ Error en la transcripción:', transcript.error);
                return null;
            }

            attempts++;
            if (attempts % 5 === 0) {
                console.log(`⏳ Esperando transcripción... (${attempts}s)`);
            }
        }

        console.warn('⚠️ Timeout esperando transcripción');
        return null;

    } catch (error) {
        console.error('❌ Error al transcribir audio:', error.message);
        if (error.response) {
            console.error('   Respuesta de API:', error.response.status, error.response.data);
        }
        console.error('   Stack:', error.stack);
        return null;
    }
};

/**
 * Transcribe múltiples archivos de audio
 * @param {Array} audioFiles - Array de objetos {buffer, originalName}
 * @returns {Promise<Array>} - Array de transcripciones
 */
export const transcribeMultipleAudios = async (audioFiles) => {
    try {
        const transcriptions = await Promise.all(
            audioFiles.map(file => transcribeAudio(file.buffer, file.originalName))
        );
        return transcriptions;
    } catch (error) {
        console.error('Error al transcribir múltiples audios:', error);
        return [];
    }
};
