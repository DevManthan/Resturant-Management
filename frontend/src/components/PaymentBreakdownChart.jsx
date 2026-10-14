import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CreditCard, Smartphone, Banknote } from 'lucide-react';

export default function PaymentBreakdownChart({ latestReport }) {
  const upi = latestReport?.UPI_PAYMENT || 109530;
  const card = latestReport?.CARDPAYMENT || 114500;
  const cash = latestReport?.CASHPAYMENT || 24890;
  const total = upi + card + cash;

  const data = [
    { name: 'Card / POS', value: card, color: '#B88E52', icon: CreditCard },
    { name: 'UPI / QR Mobile', value: upi, color: '#38BDF8', icon: Smartphone },
    { name: 'Cash', value: cash, color: '#94A3B8', icon: Banknote },
  ];

  return (
    <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Payment Channel Settlement</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution across settled bills</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            5% GST Included
          </span>
        </div>

        {/* Donut Chart */}
        <div className="h-52 my-3 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                  fontSize: '12px'
                }}
                formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Settled Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
            <span className="text-sm font-bold text-slate-800">₹{(total / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      {/* Breakdown list */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
        {data.map((item) => {
          const Icon = item.icon;
          const pct = Math.round((item.value / total) * 100);
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900">₹{item.value.toLocaleString('en-IN')}</span>
                <span className="w-8 text-right text-slate-400 font-medium">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
