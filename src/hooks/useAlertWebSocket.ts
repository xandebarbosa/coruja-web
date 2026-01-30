import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getSession, signOut } from 'next-auth/react';
import { AlertHistoryRow } from '../app/types/types';
import { toast } from 'react-toastify';

export const useAlertWebSocket = (onNewAlert: (alert: AlertHistoryRow) => void) => {
    const clientRef = useRef<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const retryCount = useRef(0);

    const connect = useCallback(async () => {
        // Evita múltiplas conexões
        if (clientRef.current?.active) return;

        const session = await getSession();
        const token = session?.accessToken;

        // Se não houver token, tentamos algumas vezes antes de desistir
        if (!token) {
            console.warn('⚠️ [WebSocket] Token não encontrado.');
            if (retryCount.current < 3) {
                retryCount.current += 1;
                setTimeout(connect, 3000); 
            }
            return;
        }

        const client = new Client({
            // Aponta para a porta correta que definimos no docker-compose (8082)
            webSocketFactory: () => new SockJS('http://localhost:8082/ws'),
            
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 25000,
            heartbeatOutgoing: 25000,
            
            onConnect: () => {
                console.log('✅ [WebSocket] Conectado com sucesso!');
                setIsConnected(true);
                retryCount.current = 0; // Reset contagem de erro
                
                client.subscribe('/topic/confirmed-alerts', (message) => {
                    if (message.body) {
                        try {
                            const newAlert = JSON.parse(message.body);
                            onNewAlert(newAlert);
                        } catch (error) {
                            console.error('❌ [WebSocket] Erro ao processar mensagem:', error);
                        }
                    }
                });
            },

            // Captura erros do protocolo STOMP (Ex: Token inválido/expirado)
            onStompError: (frame: IFrame) => {
                console.error('🔥 [WebSocket] Erro STOMP:', frame.headers['message']);
                console.error('Detalhes:', frame.body);

                // Se o erro for de autenticação, força o logout
                // O Backend pode retornar "Unauthorized", "Forbidden" ou "Jwt expired"
                const errorMsg = frame.headers['message'] || '';
                if (errorMsg.toLowerCase().includes('expired') || 
                    errorMsg.toLowerCase().includes('jwt') || 
                    errorMsg.toLowerCase().includes('unauthorized')) {
                    
                    toast.error("Sessão expirada. Por favor, faça login novamente.");
                    console.warn("🔒 Token expirado detectado no WebSocket. Deslogando...");
                    
                    // Encerra a conexão para evitar loops
                    client.deactivate();
                    
                    // Força logout para renovar token
                    signOut({ callbackUrl: '/' }); 
                }
            },

            onWebSocketClose: () => {
                console.warn('⚠️ [WebSocket] Conexão fechada.');
                setIsConnected(false);
            }
        });

        client.activate();
        clientRef.current = client;
    }, [onNewAlert]);

    useEffect(() => {
        connect();

        return () => {
            if (clientRef.current) {
                console.log('🔌 [WebSocket] Desconectando...');
                clientRef.current.deactivate();
                clientRef.current = null;
            }
        };
    }, [connect]);

    return { isConnected };
};