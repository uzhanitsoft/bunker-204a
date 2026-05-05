// Экран катастрофы — посимвольный текст как в терминале

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CatastropheScreenProps {
  isHost: boolean;
  onStartGame: () => void;
}

const CATASTROPHE_TEXT = `Неизвестный вирус за 48 часов охватил город. Больницы переполнены, персонал разбегается, пациенты агрессивны.\n\nВы заперты в подвале городской больницы. Выйти нельзя — снаружи карантин.\n\nЕды на 2 недели. Кислорода строго на определённое число людей.\n\nВас больше чем мест.\n\nКто-то должен уйти.`;

export default function CatastropheScreen({ isHost, onStartGame }: CatastropheScreenProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (charIndex < CATASTROPHE_TEXT.length) {
      const timer = setTimeout(() => {
        setDisplayedText(CATASTROPHE_TEXT.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 40); // Speed of typewriter
      return () => clearTimeout(timer);
    } else {
      // Text fully displayed - show button after 5 seconds
      const timer = setTimeout(() => setShowButton(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [charIndex]);

  // Try to play alarm sound
  useEffect(() => {
    // Create a simple alarm beep using Web Audio API
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.value = 0.1;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.stop(ctx.currentTime + 2);
    } catch (e) {
      // Audio not allowed - ignore
    }
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
      {/* Biohazard particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 6}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: i % 3 === 0 ? '#E63946' : '#2D9B6F',
              boxShadow: i % 3 === 0 ? '0 0 6px #E63946' : '0 0 6px #2D9B6F',
            }}
          />
        ))}
      </div>

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />

      {/* Biohazard symbol */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
        animate={{ opacity: 0.1, scale: 1, rotate: 0 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute text-[200px] text-bunker-red select-none"
      >
        ☣️
      </motion.div>

      {/* Terminal text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-20 w-full max-w-2xl"
      >
        {/* Terminal header */}
        <div className="bg-bunker-card/80 rounded-t-lg px-4 py-2 flex items-center gap-2 border-b border-bunker-red/30">
          <div className="w-3 h-3 rounded-full bg-bunker-red" />
          <div className="w-3 h-3 rounded-full bg-bunker-yellow" />
          <div className="w-3 h-3 rounded-full bg-bunker-green" />
          <span className="ml-2 text-bunker-muted font-mono text-xs">ЭКСТРЕННОЕ ОПОВЕЩЕНИЕ — УРОВЕНЬ УГРОЗЫ: КРИТИЧЕСКИЙ</span>
        </div>

        {/* Terminal body */}
        <div className="bg-black/80 backdrop-blur-sm rounded-b-lg p-6 border border-bunker-red/20 min-h-[300px]">
          <div className="font-mono text-bunker-red text-xs mb-4 animate-pulse">
            ▶ СИСТЕМА ОПОВЕЩЕНИЯ АКТИВИРОВАНА
          </div>

          <pre className="font-mono text-bunker-green text-base md:text-lg leading-relaxed whitespace-pre-wrap">
            {displayedText}
            {charIndex < CATASTROPHE_TEXT.length && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-bunker-yellow"
              >
                █
              </motion.span>
            )}
          </pre>

          {charIndex >= CATASTROPHE_TEXT.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-bunker-red font-mono text-sm animate-pulse"
            >
              ▶ ПРОТОКОЛ ВЫЖИВАНИЯ АКТИВИРОВАН
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Start game button (host only) */}
      {isHost && showButton && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onStartGame}
          className="relative z-20 mt-8 px-12 py-4 bg-bunker-red text-white rounded-xl font-display text-2xl tracking-wider hover:bg-red-500 active:scale-95 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ☣️ НАЧАТЬ ИГРУ
        </motion.button>
      )}

      {!isHost && charIndex >= CATASTROPHE_TEXT.length && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative z-20 mt-8 text-bunker-muted font-mono text-sm"
        >
          Ожидание ведущего...
        </motion.p>
      )}
    </div>
  );
}
