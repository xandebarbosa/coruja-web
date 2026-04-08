import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

const AVAILABLE_SOUNDS = [
    { label: 'Sirene Padrão', url: '/sounds/police-operation-siren.mp3', icon: '🚨' },
    { label: 'Sirene Guerra', url: '/sounds/alarme-guerra.mp3', icon: '⚠️' },
    { label: 'Sirene Alarme', url: '/sounds/alarme-intelbras.mp3', icon: '🔔' }
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

    // 1. CARREGA PREFERÊNCIAS E LIMPA O CACHE ANTIGO
    useEffect(() => {
        const savedVolume = localStorage.getItem('audioVolume');
        const savedSource = localStorage.getItem('selectedAudioSource');

        if (savedVolume) setAudioVolume(parseFloat(savedVolume));
        
        if (savedSource) {
            // CORREÇÃO CRÍTICA: Se o cache antigo ainda tiver "/public", removemos ele aqui
            const cleanSource = savedSource.replace('/public', '');
            
            // Valida se o som limpo existe na nossa lista, senão volta pro padrão
            const isValidSound = AVAILABLE_SOUNDS.some(s => s.url === cleanSource);
            setAudioSource(isValidSound ? cleanSource : AVAILABLE_SOUNDS[0].url);
        }
    }, []);

    // 2. ATUALIZA SOMENTE O VOLUME (Sem destruir e recriar o arquivo de áudio)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = audioVolume;
        }
        // Salva a alteração no cache
        localStorage.setItem('audioVolume', String(audioVolume));
    }, [audioVolume]);

    // 3. GERENCIA A CRIAÇÃO DO ÁUDIO (Executa APENAS quando troca o som no menu)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        console.log('🔊 Preparando áudio:', audioSource);
        setAudioStatus('Carregando...');

        const audio = new Audio(audioSource);
        audio.volume = audioVolume;
        audio.preload = 'auto'; // Pré-carrega o áudio

        let isLoaded = false;

        const handleCanPlay = () => {
            if (!isLoaded) {
                isLoaded = true;
                console.log('✅ Áudio pronto para uso');
                if (isUnlockedRef.current) {
                    setIsAudioReady(true);
                    setAudioStatus('✅ Áudio ativo');
                } else {
                    setAudioStatus('Aguardando interação');
                }
            }
        };

        const handleError = (e: Event) => {
            // Ignora o erro se ele for causado pelo desmonte do componente
            if (!audio.getAttribute('src')) return;
            
            console.error('❌ Erro no caminho do áudio:', audioSource);
            setAudioStatus('❌ Erro ao carregar');
            toast.error('Arquivo de áudio não encontrado. Verifique a pasta public/sounds');
        };

        audio.addEventListener('canplaythrough', handleCanPlay);
        audio.addEventListener('error', handleError);

        audioRef.current = audio;
        localStorage.setItem('selectedAudioSource', audioSource);

        return () => {
            audio.removeEventListener('canplaythrough', handleCanPlay);
            audio.removeEventListener('error', handleError);
            audio.pause();
            // Correção: Cancela o download do cache em andamento sem gerar erro no console
            audio.removeAttribute('src'); 
            audio.load(); 
        };
    }, [audioSource]); // Removemos o audioVolume das dependências!

    /**
     * Desbloqueia o áudio - DEVE SER CHAMADO POR INTERAÇÃO DO USUÁRIO
     */
    const unlockAudio = useCallback(async () => {
        if (isUnlockedRef.current) return true;

        if (!audioRef.current) return false;

        try {
            const audio = audioRef.current;
            const originalVolume = audio.volume;
            
            audio.volume = 0.01; 
            audio.muted = true;
            
            await audio.play();
            
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
            audio.volume = originalVolume;
            
            isUnlockedRef.current = true;
            setIsAudioReady(true);
            setAudioStatus('✅ Áudio ativo');
            
            return true;
            
        } catch (error) {
            console.warn('⚠️ Falha silenciosa ao desbloquear (Aguardando clique na tela)');
            isUnlockedRef.current = false;
            setIsAudioReady(false);
            return false;
        }
    }, []);

    // Auto-desbloquear na primeira interação na tela
    useEffect(() => {
        const handleInteraction = () => {
            if (!isUnlockedRef.current) {
                unlockAudio();
            }
        };

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
     * Reproduz o som
     */
    const playSound = useCallback(async () => {
        if (!isUnlockedRef.current) {
            const unlocked = await unlockAudio();
            if (!unlocked) return; // Navegador ainda bloqueando, ignora silenciosamente
        }

        if (!audioRef.current) return;

        try {
            const audio = audioRef.current;
            
            audio.pause();
            audio.currentTime = 0;
            
            await audio.play();
            setAudioStatus('🔊 Tocando');
            
            setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
                setAudioStatus('✅ Áudio ativo');
            }, AUDIO_DURATION);
            
        } catch (error) {
            console.error('❌ Erro na reprodução:', error);
            setAudioStatus('❌ Erro');
        }
    }, [unlockAudio]);

    /**
     * Teste manual do som
     */
    const testSound = useCallback(() => {
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