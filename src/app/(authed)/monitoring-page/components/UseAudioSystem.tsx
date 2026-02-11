import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify';

const AVAILABLE_SOUNDS = [
    { label: 'Sirene Padrão', url: '/public/sounds/police-operation-siren.mp3', icon: '🚨' },
    { label: 'Sirene Guerra', url: '/public/sounds/alarme-guerra.mp3', icon: '⚠️' },
    { label: 'Sirene Alarme', url: '/public/sounds/alarme-intelbras.mp3', icon: '🔔' }
];

const AUDIO_DURATION = 4000; // 4 segundos
const TOAST_DURATION = 5000; // 5 segundos

export default function UseAudioSystem() {
    const [audioVolume, setAudioVolume] = useState<number>(0.5);
    const [audioSource, setAudioSource] = useState<string>(AVAILABLE_SOUNDS[0].url);
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [audioStatus, setAudioStatus] = useState<string>('Inicializando...');

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isUnlockedRef = useRef(false);

    // Carrega preferências do localStorage
    useEffect(() => {
        const savedVolume = localStorage.getItem('audioVolume');
        const savedSource = localStorage.getItem('selectedAudioSource');

        if (savedVolume) setAudioVolume(parseFloat(savedVolume));
        if (savedSource) setAudioSource(savedSource);
    },[])

    // Cria e configura o objeto de áudio
    useEffect(() => {

        console.log('🔊 Criando objeto de áudio:', audioSource);

        const audio = new Audio(audioSource);
        audio.src = audioSource;
        audio.volume = audioVolume;
        audio.preload = 'auto'; // Pré-carrega o áudio

        // Flag para saber quando está pronto
        let isLoaded = false;

        const handleCanPlay = () => {
            if (!isLoaded) {
                isLoaded = true;
                console.log('✅ Áudio pode ser reproduzido');
                // Só marca como pronto se já foi desbloqueado
                if (isUnlockedRef.current) {
                    setIsAudioReady(true);
                    setAudioStatus('✅ Pronto para reproduzir');
                }
            }
        };

        const handleLoadedData = () => {
            console.log('📦 Dados do áudio carregados');
        };

        const handleError = (e: Event) => {
            console.error('❌ Erro ao carregar áudio:', e);
            setAudioStatus('❌ Erro ao carregar');
            toast.error('Arquivo de áudio não encontrado. Verifique a pasta /public/sounds/');
        };



        // Listener para verificar quando o áudio está pronto para tocar
        audio.addEventListener('canplaythrough', handleCanPlay);
        audio.addEventListener('loadeddata', handleLoadedData);
        audio.addEventListener('error', handleError);

        audioRef.current = audio;

        // Salva preferências no localStorage
        localStorage.setItem('selectedAudioSource', audioSource);
        localStorage.setItem('audioVolume', String(audioVolume));

        return () => {
            audio.removeEventListener('canplaythrough', handleCanPlay);
            audio.removeEventListener('loadeddata', handleLoadedData);
            audio.removeEventListener('error', handleError);
            audio.pause();
            audio.src = '';
        }
    },[audioSource, audioVolume]);

    /**
     * Desbloqueia o áudio - DEVE SER CHAMADO POR INTERAÇÃO DO USUÁRIO
     */
    const unlockAudio = useCallback(async () => {
        if (isUnlockedRef.current) {
            console.log('ℹ️ Áudio já desbloqueado');
            return true;
        }

        console.log('🔓 Desbloqueando áudio...');
        setAudioStatus('Desbloqueando...');
        
        if (!audioRef.current) {
            console.error('❌ Áudio não inicializado');
            return false;
        }

        try {
            const audio = audioRef.current;
            
            // Salva configurações originais
            const originalVolume = audio.volume;
            
            // Configura para teste silencioso
            audio.volume = 0.01; // Volume bem baixo
            audio.muted = true;
            audio.currentTime = 0;
            
            // Tenta tocar
            await audio.play();
            console.log('✅ Play silencioso bem-sucedido');
            
            // Para imediatamente
            audio.pause();
            audio.currentTime = 0;
            
            // Restaura configurações
            audio.muted = false;
            audio.volume = originalVolume;
            
            // Marca como desbloqueado
            isUnlockedRef.current = true;
            setIsAudioReady(true);
            setAudioStatus('✅ Áudio ativo');
            
            console.log('✅ Áudio desbloqueado e pronto!');
            
            toast.success('🔊 Sistema de áudio ativado!', {
                position: 'bottom-right',
                autoClose: 2000
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Falha ao desbloquear:', error);
            setAudioStatus('❌ Clique para ativar');
            isUnlockedRef.current = false;
            setIsAudioReady(false);
            return false;
        }
    }, []);

    // Auto-desbloquear na primeira interação
    useEffect(() => {
        const handleInteraction = () => {
            if (!isUnlockedRef.current) {
                unlockAudio();
            }
        };

        // Múltiplos eventos para garantir
        const events = ['click', 'touchstart', 'keydown'];
        
        events.forEach(event => {
            document.addEventListener(event, handleInteraction, { once: true, passive: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleInteraction);
            });
        };
    }, [unlockAudio]);

    /**
     * Reproduz o som - VERSÃO ROBUSTA E SEGURA
     */
    const playSound = useCallback(async () => {
        console.log('🔊 playSound chamado', {
            ready: isAudioReady,
            unlocked: isUnlockedRef.current,
            audioExists: !!audioRef.current
        });

        // Se não está pronto, tenta desbloquear primeiro
        if (!isUnlockedRef.current) {
            console.warn('⚠️ Áudio não desbloqueado. Tentando desbloquear...');
            const unlocked = await unlockAudio();
            if (!unlocked) {
                toast.warning('👆 Clique em qualquer lugar para ativar o som', {
                    position: 'bottom-right'
                });
                return;
            }
        }

        if (!audioRef.current) {
            console.error('❌ Objeto de áudio não existe');
            return;
        }

        try {
            const audio = audioRef.current;
            
            // Para qualquer reprodução anterior
            audio.pause();
            audio.currentTime = 0;
            
            // Garante configurações corretas
            audio.muted = false;
            audio.volume = audioVolume;
            
            console.log('▶️ Reproduzindo:', {
                src: audio.src,
                volume: audio.volume,
                readyState: audio.readyState,
                paused: audio.paused
            });

            // Reproduz
            await audio.play();
            console.log('✅ Reprodução iniciada!');
            setAudioStatus('🔊 Tocando');
            
            // Para após duração definida
            setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
                setAudioStatus('✅ Áudio ativo');
                console.log('⏹️ Reprodução finalizada');
            }, AUDIO_DURATION);
            
        } catch (error) {
            console.error('❌ Erro na reprodução:', error);
            setAudioStatus('❌ Erro');
            
            // Se falhou, tenta desbloquear novamente
            if (!isUnlockedRef.current) {
                toast.error('Clique na página para ativar o áudio');
            }
        }
    }, [audioVolume, isAudioReady, unlockAudio]);

    /**
     * Teste manual do som
     */
    const testSound = useCallback(() => {
        console.log('🧪 TESTE MANUAL INICIADO');
        playSound();
    }, [playSound]);

    return {
        audioVolume,
        audioSource,
        isAudioReady,
        audioStatus,
        setAudioVolume,
        setAudioSource,
        playSound,
        testSound,
        unlockAudio
    };
}
