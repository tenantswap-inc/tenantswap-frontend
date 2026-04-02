import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const DEFAULT_STEPS = ['Looking For', 'Leaving From', 'Vacancy Alert', 'Confirm'];

const StepHeader: React.FC<{ current: number; steps?: string[] }> = ({
  current,
  steps = DEFAULT_STEPS,
}) => (
  <div className="mb-10 flex items-center justify-center">
    {steps.map((label: string, idx: number) => {
      const done = idx < current;
      const active = idx === current;

      return (
        <React.Fragment key={label}>
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.24, ease: 'easeOut' }}
          >
            <motion.div
              animate={{
                scale: active ? 1.06 : 1,
                boxShadow: active
                  ? '0 0 0 10px rgba(5,150,105,0.10)'
                  : '0 0 0 0 rgba(5,150,105,0)',
              }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-poppins-bold transition-all duration-300 ${
                done
                  ? 'bg-emerald-600 text-white'
                  : active
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {done ? <Check size={18} /> : idx + 1}
            </motion.div>
            <motion.span
              animate={{ opacity: active || done ? 1 : 0.65, y: active ? -1 : 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className={`whitespace-nowrap text-xs font-poppins-medium ${
                active ? 'text-emerald-600' : done ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {label}
            </motion.span>
          </motion.div>
          {idx < steps.length - 1 && (
            <motion.div
              initial={false}
              animate={{
                backgroundColor: idx < current ? 'rgb(5 150 105)' : 'rgb(226 232 240)',
                scaleX: idx < current ? 1 : 0.92,
                opacity: idx < current ? 1 : 0.75,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mx-2 mb-5 h-0.5 w-16 origin-center sm:w-24"
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default StepHeader;
