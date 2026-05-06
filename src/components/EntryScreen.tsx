// Экран входа — премиум SVG иконки

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBunkerStore } from '../stores/gameStore';
import { BiohazardIcon, CrownIcon, UserIcon, FlaskIcon, CopyIcon, DoorIcon, PlayIcon } from './Icons';

interface EntryScreenProps {
  onCreateRoom: () => Promise<any>;
  onJoinRoom: (code: string, name: string) => Promise<any>;
}

export default function EntryScreen({ onCreateRoom, onJoinRoom }: EntryScreenProps) {
  const [mode, setMode] = useState<'choose' | 'host' | 'player'>('choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);


  const { gameState, connected } = useBunkerStore();

  const handleCreateRoom = async () => {
    setLoading(true); setError('');
    try {
      const result = await onCreateRoom();
      if (result?.success) { setCreatedCode(result.roomCode); setMode('host'); }
      else setError(result?.error || 'Ошибка');
    } catch (e: any) { setError('Ошибка: ' + e.message); }
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (name.length < 2) { setError('Имя минимум 2 символа'); return; }
    if (code.length !== 4) { setError('Код — 4 цифры'); return; }
    setLoading(true); setError('');
    try {
      const result = await onJoinRoom(code, name);
      if (result?.error) setError(result.error);
    } catch (e: any) { setError('Ошибка: ' + e.message); }
    setLoading(false);
  };



  const copyCode = () => {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ═══ ЛОББИ ВЕДУЩЕГО ═══
  if (mode === 'host' && createdCode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <Particles />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
          <h1 className="font-display text-4xl text-bunker-yellow text-center mb-1 tracking-wider">БУНКЕР 204-А</h1>
          <p className="text-bunker-muted text-center mb-6 font-mono text-[10px] tracking-wider">КОМНАТА СОЗДАНА</p>

          <motion.div className="bg-bunker-card border border-bunker-yellow/40 rounded-2xl p-6 mb-4 text-center cursor-pointer"
            onClick={copyCode} whileTap={{ scale: 0.98 }}>
            <p className="text-bunker-muted text-[10px] mb-1 font-mono tracking-wider">КОД КОМНАТЫ</p>
            <p className="font-display text-7xl text-bunker-yellow tracking-[0.3em]">{createdCode}</p>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-bunker-muted">
              <CopyIcon size={12} />
              <span className="text-[10px]">{copied ? 'Скопировано!' : 'Нажми чтобы скопировать'}</span>
            </div>
          </motion.div>

          <div className="bg-bunker-card/40 rounded-xl p-3 mb-4 border border-white/5">
            <p className="text-bunker-yellow font-mono text-[10px] mb-2 tracking-wider">
              ПОДКЛЮЧИЛИСЬ: {gameState?.players?.length || 0}/13
            </p>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {gameState?.players?.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }} className="flex items-center gap-2 bg-bunker-bg/50 rounded-lg px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-bunker-green" />
                  <span className="text-bunker-text font-body text-sm">{p.name}</span>
                </motion.div>
              ))}
              {(!gameState?.players || gameState.players.length === 0) && (
                <p className="text-bunker-muted text-[10px] font-mono text-center py-3">Ждём игроков...</p>
              )}
            </div>
          </div>

          <motion.button
            onClick={() => window.dispatchEvent(new CustomEvent('startGame'))}
            disabled={(gameState?.players?.length || 0) < 2}
            className={`w-full py-3.5 rounded-xl font-display text-lg tracking-wider transition-all flex items-center justify-center gap-2
              ${(gameState?.players?.length || 0) >= 2 ? 'bg-bunker-yellow text-bunker-bg' : 'bg-bunker-card text-bunker-muted cursor-not-allowed'}`}>
            <PlayIcon size={16} color={(gameState?.players?.length || 0) >= 2 ? '#1A1A1A' : '#666'} />
            {(gameState?.players?.length || 0) >= 2 ? 'НАЧАТЬ ИГРУ' : 'ЖДЁМ ИГРОКОВ'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ═══ ОЖИДАНИЕ ИГРОКА ═══
  if (mode === 'player' && gameState?.players?.length > 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <Particles />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full max-w-md text-center">
          <h1 className="font-display text-3xl text-bunker-yellow mb-1">БУНКЕР 204-А</h1>
          <p className="text-bunker-green font-mono text-xs mb-6">Комната {code}</p>
          <div className="bg-bunker-card/40 rounded-xl p-5 border border-white/5 mb-4">
            <p className="text-bunker-muted font-mono text-[10px] mb-3">ОЖИДАНИЕ</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {gameState.players.map(p => (
                <div key={p.id} className="bg-bunker-bg px-3 py-1.5 rounded-full text-xs font-body border border-bunker-yellow/15">{p.name}</div>
              ))}
            </div>
          </div>
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
            className="text-bunker-muted font-mono text-[10px]">Ждём ведущего...</motion.div>
        </motion.div>
      </div>
    );
  }

  // ═══ ГЛАВНЫЙ ЭКРАН ═══
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Particles />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 w-full max-w-md">
        {/* Лого */}
        <motion.div className="text-center mb-8" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <BiohazardIcon size={48} color="#FFD700" className="mx-auto mb-3" />
          <h1 className="font-display text-5xl text-bunker-yellow tracking-wider mb-1">БУНКЕР</h1>
          <h2 className="font-display text-2xl text-bunker-red tracking-[0.5em]">204-А</h2>
          <p className="text-bunker-muted font-mono text-[9px] mt-2 tracking-[0.2em]">КОНФЛИКТЫ В МЕДИЦИНЕ</p>
        </motion.div>

        {/* Статус */}
        <div className="text-center mb-4">
          <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${connected ? 'text-bunker-green' : 'text-bunker-red'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-bunker-green' : 'bg-bunker-red animate-pulse'}`} />
            {connected ? 'Подключено' : 'Подключение...'}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <motion.button onClick={handleCreateRoom} disabled={loading || !connected}
                className="w-full py-4 bg-bunker-yellow text-bunker-bg rounded-xl font-display text-xl tracking-wider disabled:opacity-50 flex items-center justify-center gap-2.5"
                whileTap={{ scale: 0.97 }}>
                <CrownIcon size={20} color="#1A1A1A" />
                {loading ? 'Создаём...' : 'ВЕДУЩИЙ'}
              </motion.button>

              <motion.button onClick={() => { setMode('player'); setError(''); }} disabled={!connected}
                className="w-full py-4 bg-bunker-card border border-bunker-yellow/20 text-bunker-yellow rounded-xl font-display text-xl tracking-wider disabled:opacity-50 flex items-center justify-center gap-2.5"
                whileTap={{ scale: 0.97 }}>
                <UserIcon size={20} color="#FFD700" />
                УЧАСТНИК
              </motion.button>

              {error && <p className="text-bunker-red text-xs font-mono text-center">{error}</p>}
            </motion.div>
          )}



          {mode === 'player' && !gameState && (
            <motion.div key="player" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <div>
                <label className="text-bunker-muted font-mono text-[9px] block mb-1.5 tracking-wider">ТВОЁ ИМЯ</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Введи имя"
                  className="w-full px-4 py-3 bg-bunker-card border border-white/10 rounded-xl text-bunker-text font-body text-base focus:border-bunker-yellow focus:outline-none" maxLength={20} autoFocus />
              </div>
              <div>
                <label className="text-bunker-muted font-mono text-[9px] block mb-1.5 tracking-wider">КОД КОМНАТЫ</label>
                <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4 цифры"
                  className="w-full px-4 py-3 bg-bunker-card border border-white/10 rounded-xl text-bunker-yellow font-display text-3xl text-center tracking-[0.5em] focus:border-bunker-yellow focus:outline-none" maxLength={4} inputMode="numeric" />
              </div>
              {error && <p className="text-bunker-red text-xs font-mono text-center">{error}</p>}
              <motion.button onClick={handleJoinRoom} disabled={loading || name.length < 2 || code.length !== 4}
                className="w-full py-3.5 bg-bunker-yellow text-bunker-bg rounded-xl font-display text-xl tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                whileTap={{ scale: 0.97 }}>
                <DoorIcon size={18} color="#1A1A1A" /> {loading ? 'Подключение...' : 'ВОЙТИ В БУНКЕР'}
              </motion.button>
              <button onClick={() => { setMode('choose'); setError(''); }} className="w-full py-2 text-bunker-muted text-xs font-mono">Назад</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${6 + Math.random() * 6}s`,
          width: `${2 + Math.random() * 4}px`,
          height: `${2 + Math.random() * 4}px`,
        }} />
      ))}
    </div>
  );
}
