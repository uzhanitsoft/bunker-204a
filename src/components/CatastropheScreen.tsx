// Экран катастрофы — эпичный, звуковой, без эмодзи

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BiohazardIcon, PlayIcon } from './Icons';
import { sounds } from '../utils/sounds';

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
      }, 40);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowButton(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [charIndex]);

  // Сирена при загрузке
  useEffect(() => {
    sounds.catastropheAlarm();
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-5 relative overflow-hidden bg-black">
      {/* Частицы */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 25 }).map((_, i) => (
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

      {/* Сканлайны */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />

      {/* Символ биоугрозы */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
        animate={{ opacity: 0.08, scale: 1, rotate: 0 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute"
      >
        <BiohazardIcon size={250} color="#E63946" />
      </motion.div>

      {/* Терминал */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-20 w-full max-w-md"
      >
        {/* Шапка терминала */}
        <div className="bg-bunker-card/80 rounded-t-lg px-4 py-2 flex items-center gap-2 border-b border-bunker-red/30">
          <div className="w-2.5 h-2.5 rounded-full bg-bunker-red" />
          <div className="w-2.5 h-2.5 rounded-full bg-bunker-yellow" />
          <div className="w-2.5 h-2.5 rounded-full bg-bunker-green" />
          <span className="ml-2 text-bunker-muted font-mono text-[9px]">ЭКСТРЕННОЕ ОПОВЕЩЕНИЕ — УРОВЕНЬ УГРОЗЫ: КРИТИЧЕСКИЙ</span>
        </div>

        {/* Тело терминала */}
        <div className="bg-black/80 backdrop-blur-sm rounded-b-lg p-5 border border-bunker-red/20 min-h-[250px]">
          <div className="font-mono text-bunker-red text-[10px] mb-3 animate-pulse">
            СИСТЕМА ОПОВЕЩЕНИЯ АКТИВИРОВАНА
          </div>

          <pre className="font-mono text-bunker-green text-sm leading-relaxed whitespace-pre-wrap">
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
              className="mt-4 text-bunker-red font-mono text-xs animate-pulse"
            >
              ПРОТОКОЛ ВЫЖИВАНИЯ АКТИВИРОВАН
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Кнопка старта */}
      {isHost && showButton && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => { sounds.buttonClick(); onStartGame(); }}
          className="relative z-20 mt-6 w-full max-w-md py-4 bg-bunker-red text-white rounded-xl font-display text-xl tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <BiohazardIcon size={22} color="#fff" />
          НАЧАТЬ ИГРУ
        </motion.button>
      )}

      {!isHost && charIndex >= CATASTROPHE_TEXT.length && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative z-20 mt-6 text-bunker-muted font-mono text-xs"
        >
          Ожидание ведущего...
        </motion.p>
      )}
    </div>
  );
}
