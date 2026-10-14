import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  subtext,
  delta,
  isPositive = true,
  icon: Icon,
  badge,
  prefix = '',
  suffix = '',
}) {
  return (
    <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <Icon className="w-5 h-5 text-brand-600" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-xl font-bold text-slate-700">{prefix}</span>}
          <span className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            {value}
          </span>
          {suffix && <span className="text-sm font-semibold text-slate-500">{suffix}</span>}
        </div>

        <div className="mt-2.5 flex items-center justify-between text-xs">
          {delta !== undefined && (
            <div
              className={`flex items-center gap-1 font-semibold ${
                isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{delta}</span>
              <span className="text-slate-400 font-normal">vs last week</span>
            </div>
          )}

          {badge && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              {badge}
            </span>
          )}

          {subtext && !delta && (
            <span className="text-slate-400 font-medium">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
}
