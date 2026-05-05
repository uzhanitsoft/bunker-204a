import { motion } from 'framer-motion';
import { PauseIcon, PlayIcon } from './Icons';

interface PauseOverlayProps {
  isHost: boolean;
  onResume: () => void;
}

export default function PauseOverlay({ isHost, onResume }: PauseOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center"
    >
      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} className="text-center">
        <PauseIcon size={48} color="#FFD700" className="mx-auto mb-4" />
        <h2 className="font-display text-3xl text-bunker-yellow tracking-wider mb-3">ПАУЗА</h2>
        <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
          className="text-bunker-muted font-mono text-sm">Ведущий думает. Ждите.</motion.p>
      </motion.div>
      {isHost && (
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          onClick={onResume}
          className="mt-10 px-10 py-3 bg-bunker-green text-white rounded-xl font-display text-xl tracking-wider flex items-center gap-2"
          whileTap={{ scale: 0.95 }}>
          <PlayIcon size={18} /> ПРОДОЛЖИТЬ
        </motion.button>
      )}
    </motion.div>
  );
}
