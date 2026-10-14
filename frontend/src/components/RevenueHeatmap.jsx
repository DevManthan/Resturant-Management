import React, { useState } from 'react';
import { Flame, Clock, Calendar, Info, TrendingUp } from 'lucide-react';
import { revenueHeatmapMatrix, heatmapTimeSlots } from '../data/mockData';

export default function RevenueHeatmap() {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Helper to calculate color intensity based on value (0 to 140)
  // Strict soft light mode colors: creamy warm off-white to rich warm bronze
  const getCellColor = (val) => {
    if (val === 0) return 'bg-slate-100/60 border-slate-200/50 text-slate-300';
    if (val < 25) return 'bg-[#FBF8F3] border-[#EBDDC5] text-slate-600';
    if (val < 50) return 'bg-[#F6EFE3] border-[#DEC5A0] text-slate-700 font-medium';
    if (val < 80) return 'bg-[#EBDDC5] border-[#D4B98E] text-slate-800 font-semibold';
    if (val < 110) return 'bg-[#DEC5A0] border-[#C39F6C] text-slate-900 font-bold';
    return 'bg-[#B88E52] border-[#9E743A] text-white font-bold shadow-sm';
  };

  return (
    <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
              <Flame className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Revenue & Footfall Heatmap</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              7-Day Cycle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hourly sales velocity (₹ in thousands) showing peak dining spikes across lunch and dinner shifts.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>Low</span>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200" title="0" />
            <span className="w-3.5 h-3.5 rounded bg-[#FBF8F3] border border-[#EBDDC5]" title="<25k" />
            <span className="w-3.5 h-3.5 rounded bg-[#F6EFE3] border border-[#DEC5A0]" title="25k-50k" />
            <span className="w-3.5 h-3.5 rounded bg-[#EBDDC5] border border-[#D4B98E]" title="50k-80k" />
            <span className="w-3.5 h-3.5 rounded bg-[#DEC5A0] border border-[#C39F6C]" title="80k-110k" />
            <span className="w-3.5 h-3.5 rounded bg-[#B88E52] border border-[#9E743A]" title=">110k" />
          </div>
          <span>Peak Velocity</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header Row (Hours) */}
          <div className="grid grid-cols-[60px_repeat(12,minmax(0,1fr))] gap-2 pb-2 text-[11px] font-semibold text-slate-400">
            <div className="text-center font-bold text-slate-600">Day</div>
            {heatmapTimeSlots.map((slot, i) => (
              <div key={i} className="text-center truncate">
                {slot}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          <div className="space-y-2">
            {revenueHeatmapMatrix.map((row) => (
              <div key={row.day} className="grid grid-cols-[60px_repeat(12,minmax(0,1fr))] gap-2 items-center">
                <div className="text-xs font-bold text-slate-700 text-center py-2 bg-slate-50 rounded-lg">
                  {row.day}
                </div>
                {row.hours.map((val, idx) => {
                  const hourLabel = heatmapTimeSlots[idx];
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredCell({ day: row.day, hour: hourLabel, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-10 rounded-xl border flex items-center justify-center text-xs cursor-pointer transition-all hover:scale-105 hover:z-10 relative ${getCellColor(
                        val
                      )}`}
                    >
                      {val > 0 ? `${val}k` : '—'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Tooltip & Insights Footer */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {hoveredCell ? (
            <div className="text-xs font-medium text-slate-700 flex items-center gap-2 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200">
              <span className="font-bold text-brand-900">{hoveredCell.day} at {hoveredCell.hour}:</span>
              <span>₹{(hoveredCell.val * 1000).toLocaleString('en-IN')} revenue</span>
              <span className="text-slate-400">|</span>
              <span className="text-brand-700 font-semibold">
                {hoveredCell.val > 100 ? '🔥 Prime Rush' : hoveredCell.val > 50 ? 'Dinner Shift' : 'Moderate Flow'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Hover over any hour cell to inspect granular hourly sales volume</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400">Peak Dining Window: </span>
            <span className="font-bold text-slate-800">Saturday 8:00 PM – 10:00 PM (₹252k)</span>
          </div>
          <div>
            <span className="text-slate-400">Lunch Peak: </span>
            <span className="font-bold text-slate-800">Sunday 1:00 PM – 2:00 PM (₹70k)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
