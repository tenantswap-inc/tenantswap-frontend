import { Check } from "lucide-react";
import React from "react";

const STEPS = ['Looking For', 'Leaving From', 'Confirm'];

const StepHeader: React.FC<{ current: number }> = ({ current }) => (
  <div className="flex items-center justify-center mb-10">
    {STEPS.map((label: string, idx: number) => {
      const done   = idx < current;
      const active = idx === current;
      return (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-poppins-bold text-sm transition-all duration-300 ${
              done   ? 'bg-emerald-600 text-white' :
              active ? 'bg-emerald-600 text-white ring-4 ring-emerald-600/20' :
                       'bg-slate-100 text-slate-400'
            }`}>
              {done ? <Check size={18} /> : idx + 1}
            </div>
            <span className={`text-xs font-poppins-medium whitespace-nowrap ${
              active ? 'text-emerald-600' : done ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`h-0.5 w-16 sm:w-24 mx-2 mb-5 transition-all duration-300 ${
              idx < current ? 'bg-emerald-600' : 'bg-slate-200'
            }`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default StepHeader;