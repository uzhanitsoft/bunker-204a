// Свайпабельная колода карт игрока
// Используем card.type как идентификатор (не индексы) — безопасно при изменении массива

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { BriefcaseIcon, DnaIcon, HeartPulseIcon, TargetIcon, ZapIcon, BackpackIcon } from './Icons';
import type { Card } from '../types';

const CARD_COLORS: Record<string, string> = {
  profession: '#FFFFFF',
  biology: '#4A90D9',
  health: '#E63946',
  hobby: '#2D9B6F',
  fact: '#87CEEB',
  baggage: '#FFD700',
};

const CARD_LABELS: Record<string, string> = {
  profession: 'П Р О Ф Е С С И Я',
  biology: 'Б И О Л О Г И Я',
  health: 'З Д О Р О В Ь Е',
  hobby: 'Х О Б Б И',
  fact: 'Ф А К Т',
  baggage: 'Б А Г А Ж',
};

const CARD_ICONS: Record<string, any> = {
  profession: BriefcaseIcon,
  biology: DnaIcon,
  health: HeartPulseIcon,
  hobby: TargetIcon,
  fact: ZapIcon,
  baggage: BackpackIcon,
};

interface CardDeckProps {
  cards: Card[];
  onRevealCard: (cardType: string) => void;
}

export default function CardDeck({ cards, onRevealCard }: CardDeckProps) {
  // Используем type как ключ, не индексы — безопасно при изменении массива
  const [deckTypes, setDeckTypes] = useState<string[]>([]);
  const [swiping, setSwiping] = useState(false);
  const [confirmCard, setConfirmCard] = useState<Card | null>(null);

  // Синхронизируем порядок колоды при изменении cards
  useEffect(() => {
    setDeckTypes(prev => {
      const currentTypes = cards.map(c => c.type);
      if (currentTypes.length === 0) return [];
      // Сохраняем порядок существующих карт, убираем удалённые
      const kept = prev.filter(t => currentTypes.includes(t));
      // Добавляем новые (если есть)
      const newTypes = currentTypes.filter(t => !kept.includes(t));
      const merged = [...kept, ...newTypes];
      return merged.length > 0 ? merged : currentTypes;
    });
  }, [cards]);

  // Текущая верхняя карта
  const topType = deckTypes[0];
  const topCard = cards.find(c => c.type === topType);
  const topIdx = cards.findIndex(c => c.type === topType);

  const handleSwipe = useCallback((_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80 && deckTypes.length > 1) {
      setSwiping(true);
      setDeckTypes(prev => {
        const newOrder = [...prev];
        const removed = newOrder.shift()!;
        newOrder.push(removed);
        return newOrder;
      });
      setTimeout(() => setSwiping(false), 100);
    }
  }, [deckTypes.length]);

  const handleConfirm = () => {
    if (confirmCard) {
      onRevealCard(confirmCard.type);
      setConfirmCard(null);
    }
  };

  if (cards.length === 0 || !topCard) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
      >
        {/* Заголовок */}
        <div className="text-center mb-6">
          <p className="text-bunker-yellow font-display text-xl tracking-wider mb-1">ВАШ ХОД</p>
          <p className="text-bunker-muted font-mono text-xs">Листайте карты свайпом ← → • Нажмите чтобы открыть</p>
        </div>

        {/* Колода */}
        <div className="relative w-72 h-96">
          {/* Фоновые карты (стопка) */}
          {deckTypes.slice(1, 4).reverse().map((cardType, stackPos) => {
            const card = cards.find(c => c.type === cardType);
            if (!card) return null;
            const offset = (3 - stackPos) * 4;
            const scale = 1 - (3 - stackPos) * 0.03;
            return (
              <div
                key={`bg-${cardType}`}
                className="absolute inset-0 rounded-2xl border"
                style={{
                  transform: `translateY(${offset}px) scale(${scale})`,
                  borderColor: CARD_COLORS[card.type] + '30',
                  backgroundColor: '#1a1a1a',
                  zIndex: stackPos,
                }}
              />
            );
          })}

          {/* Верхняя карта — свайпабельная */}
          <AnimatePresence mode="wait">
            {topCard && !swiping && (
              <motion.div
                key={topCard.type}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                onDragEnd={handleSwipe}
                onTap={() => setConfirmCard(topCard)}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{
                  x: 300,
                  opacity: 0,
                  rotateZ: 15,
                  transition: { duration: 0.25 }
                }}
                className="absolute inset-0 rounded-2xl border-2 flex flex-col items-center justify-center p-6 select-none touch-pan-y"
                style={{
                  borderColor: CARD_COLORS[topCard.type] + '60',
                  backgroundColor: '#0d0d0d',
                  boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 30px ${CARD_COLORS[topCard.type]}15`,
                  zIndex: 10,
                  WebkitUserSelect: 'none',
                  touchAction: 'pan-y',
                }}
              >
                {/* Иконка */}
                {(() => {
                  const Icon = CARD_ICONS[topCard.type] || BriefcaseIcon;
                  return (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                      style={{ backgroundColor: CARD_COLORS[topCard.type] + '15', border: `2px solid ${CARD_COLORS[topCard.type]}40` }}
                    >
                      <Icon size={32} color={CARD_COLORS[topCard.type]} />
                    </div>
                  );
                })()}

                {/* Тип карты */}
                <p
                  className="font-mono text-xs tracking-[0.3em] mb-4"
                  style={{ color: CARD_COLORS[topCard.type] + 'CC' }}
                >
                  {CARD_LABELS[topCard.type]}
                </p>

                {/* Разделитель */}
                <div className="w-16 h-px mb-4" style={{ backgroundColor: CARD_COLORS[topCard.type] + '30' }} />

                {/* Значение карты */}
                <p className="text-white text-xl font-body text-center leading-relaxed px-2">
                  {topCard.value}
                </p>

                {/* Подсказка */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-bunker-muted/50 font-mono text-[9px]">← СВАЙП → листать • ТАП — открыть</p>
                </div>

                {/* Свайп индикаторы */}
                <motion.div
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/10 text-2xl"
                  animate={{ x: [-3, 0, -3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ‹
                </motion.div>
                <motion.div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/10 text-2xl"
                  animate={{ x: [3, 0, 3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ›
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Счётчик */}
        <div className="mt-6 flex gap-2">
          {deckTypes.map((type) => (
            <div
              key={type}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                backgroundColor: type === topType ? (CARD_COLORS[type] || '#FFD700') : '#333',
                transform: type === topType ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Модалка подтверждения */}
      <AnimatePresence>
        {confirmCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
            onClick={() => setConfirmCard(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
              className="bg-bunker-bg border-2 rounded-2xl p-6 w-full max-w-xs text-center"
              style={{ borderColor: CARD_COLORS[confirmCard.type] + '60' }}
            >
              <p className="text-bunker-muted font-mono text-xs mb-2">ОТКРЫТЬ КАРТУ?</p>
              <p
                className="font-display text-lg tracking-wider mb-1"
                style={{ color: CARD_COLORS[confirmCard.type] }}
              >
                {CARD_LABELS[confirmCard.type]}
              </p>
              <p className="text-white text-lg font-body mb-6">{confirmCard.value}</p>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3.5 rounded-xl font-display text-lg text-bunker-bg active:scale-95 transition-transform"
                  style={{ backgroundColor: CARD_COLORS[confirmCard.type] }}
                >
                  ОТКРЫТЬ
                </button>
                <button
                  onClick={() => setConfirmCard(null)}
                  className="px-5 py-3.5 rounded-xl bg-bunker-card text-bunker-muted font-mono text-sm active:scale-95 transition-transform"
                >
                  Нет
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
