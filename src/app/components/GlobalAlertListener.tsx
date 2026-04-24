'use client';

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAlertWebSocket } from '../../hooks/useAlertWebSocket'; // Ajuste o caminho se necessário
import { AlertHistoryRow } from '../types/types'; // Ajuste o caminho se necessário

export default function GlobalAlertListener() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // GUARDA AS PASSAGENS RECENTES PARA BLOQUEAR DUPLICADOS DO BACKEND
    const processedAlerts = useRef<Set<string>>(new Set());

    // 1. Inicializa o áudio apenas uma vez ao montar o componente
    useEffect(() => {
        const savedSource = localStorage.getItem('selectedAudioSource') || '/sounds/police-operation-siren.mp3';
        const savedVolume = localStorage.getItem('audioVolume') || '0.5';
        const cleanSource = savedSource.replace('/public', '');
        
        audioRef.current = new Audio(cleanSource);
        audioRef.current.volume = parseFloat(savedVolume);
    }, []);

    // 2. Cria a função que será chamada pelo Hook quando chegar um novo alerta
    const handleNewAlert = useCallback((alerta: AlertHistoryRow) => {
        // ===== FILTRO ANTI-REPETIÇÃO =====
        // Cria uma chave única juntando a Placa e a Hora exata em que o carro passou
        const horaFormatada = Array.isArray(alerta.hora) ? alerta.hora.join(':') : alerta.hora;
        const uniqueKey = `${alerta.placa}-${horaFormatada}`;

        // Se já tocamos o alarme para este carro nesta exata hora, aborta!
        if (processedAlerts.current.has(uniqueKey)) {
            console.log('⚠️ Alerta global duplicado ignorado pelo Filtro Anti-Spam:', uniqueKey);
            return; 
        }

        // Adiciona na memória para não repetir
        processedAlerts.current.add(uniqueKey);
        if (processedAlerts.current.size > 20) {
            processedAlerts.current.clear(); // Evita vazamento de memória limpando a cada 20 alertas
        }
        // =================================

        // 3. Toca o Som
        if (audioRef.current) {
            // Busca o volume mais recente caso o usuário tenha alterado no meio da sessão
            const currentVolume = localStorage.getItem('audioVolume') || '0.5';
            audioRef.current.volume = parseFloat(currentVolume);

            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => {
                console.warn('🔇 Interação necessária na página para tocar áudio automaticamente', e);
            });
        }

        // 4. Dispara o Toast
        toast.error(
            <div className="flex flex-col">
                <span className="font-bold text-lg">🚨 ALERTA DE PASSAGEM!</span>
                <span>Placa monitorada: <strong>{alerta.placa}</strong></span>
                <span className="text-sm">Local: {alerta.rodovia}</span>
            </div>, 
            {
                position: "top-right",
                autoClose: 8000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
            }
        );
    }, []);

    // 5. Acopla a nossa lógica ao Hook oficial de WebSocket
    useAlertWebSocket(handleNewAlert);

    // Este componente é puramente lógico e visualmente invisível, não renderiza DOM.
    return null;
}