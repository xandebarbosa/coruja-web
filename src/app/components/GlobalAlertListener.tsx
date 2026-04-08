'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function GlobalAlertListener() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // GUARDA AS PASSAGENS RECENTES PARA BLOQUEAR DUPLICADOS DO BACKEND
    const processedAlerts = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Inicializa o áudio garantindo que o caminho está limpo (sem /public)
        const savedSource = localStorage.getItem('selectedAudioSource') || '/sounds/police-operation-siren.mp3';
        const savedVolume = localStorage.getItem('audioVolume') || '0.5';
        const cleanSource = savedSource.replace('/public', '');
        
        audioRef.current = new Audio(cleanSource);
        audioRef.current.volume = parseFloat(savedVolume);

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8089/ws'), // Ajuste a porta se necessário
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('🌍 Ouvinte Global Conectado ao WebSocket!');
                
                client.subscribe('/topic/confirmed-alerts', (message) => {
                    if (message.body) {
                        const alerta = JSON.parse(message.body);
                        
                        // ===== FILTRO ANTI-REPETIÇÃO =====
                        // Cria uma chave única juntando a Placa e a Hora exata em que o carro passou
                        const horaFormatada = Array.isArray(alerta.hora) ? alerta.hora.join(':') : alerta.hora;
                        const uniqueKey = `${alerta.placa}-${horaFormatada}`;

                        // Se já tocamos o alarme para este carro nesta exata hora, aborta!
                        if (processedAlerts.current.has(uniqueKey)) {
                            console.log('⚠️ WebSocket: Alerta duplicado ignorado pelo Filtro Anti-Spam:', uniqueKey);
                            return; 
                        }

                        // Adiciona na memória para não repetir
                        processedAlerts.current.add(uniqueKey);
                        if (processedAlerts.current.size > 20) {
                            processedAlerts.current.clear(); // Evita vazamento de memória limpando a cada 20 alertas
                        }
                        // =================================

                        // 1. Toca o Som
                        if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                            audioRef.current.play().catch(e => console.warn('Interação necessária para tocar áudio', e));
                        }

                        // 2. Dispara o Toast
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
                    }
                });
            },
        });

        client.activate();

        return () => {
            client.deactivate();
        };
    }, []);

    return null;
}