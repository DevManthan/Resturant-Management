import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  RefreshCw,
  TrendingUp,
  Star,
  Users,
  ShoppingBag,
  Clock,
  Eye,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function DailyReportsView({
  dailyReports,
  onTriggerEOD,
  isEODRunning
}) {
  const [selectedReport, setSelectedReport] = useState(dailyReports[0] || null);

  // Month to date calculations
  const totalMtdRevenue = dailyReports.reduce((acc, r) => acc + r.TOTAL_REVENUE, 0);
  const totalMtdProfit = dailyReports.reduce((acc, r) => acc + r.PROFIT, 0);
  const totalMtdOrders = dailyReports.reduce((acc, r) => acc + r.TOTAL_ORDERS, 0);
  const avgMtdMargin = Math.round(totalMtdProfit / (totalMtdRevenue || 1) * 100);

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = [
      "Report ID", "Date", "Orders", "Customers", "Revenue (INR)", "Profit (INR)",
      "Margin %", "Avg Rating", "Most Ordered Item", "Peak Hour", "Cash", "Card", "UPI"
    ];
    const rows = dailyReports.map(r => [
      r.REPORT_ID,
      r.REPORT_DATE,
      r.TOTAL_ORDERS,
      r.TOTAL_CUSTOMERS,
      r.TOTAL_REVENUE,
      r.PROFIT,
      r.PROFIT_MARGIN,
      r.AVGRATING,
      `"${r.MOST_ORDERED}"`,
      `"${r.PEAKHOUR}"`,
      r.CASHPAYMENT,
      r.CARDPAYMENT,
      r.UPI_PAYMENT
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Luxe_Dine_Daily_Reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Aggregated MTD Revenue</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">₹{totalMtdRevenue.toLocaleString('en-IN')}</div>
          <span className="text-xs text-slate-500 mt-1 block">Recorded in DAILY_REPORTS table</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Aggregated Net Profit</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">₹{totalMtdProfit.toLocaleString('en-IN')}</div>
          <span className="text-xs text-emerald-700 mt-1 block">{avgMtdMargin}% Weighted Margin</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Settled Tickets</span>
          <div className="mt-2 text-2xl font-bold text-brand-700">{totalMtdOrders} Orders</div>
          <span className="text-xs text-slate-500 mt-1 block">Across dine-in tables</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Automated Pipeline Status</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Active Cron</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Executes nightly at 00:00:00 AM</span>
        </div>
      </div>

      {/* Main Table & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Table */}
        <div className="lg:col-span-2 bg-white rounded-card p-6 border border-slate-200/80 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Oracle DAILY_REPORTS Ledger</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Analytical snapshots generated from ORDERS, BILL, and REVIEW tables.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
                title="Download CSV export"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={onTriggerEOD}
                disabled={isEODRunning}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEODRunning ? 'animate-spin' : ''}`} />
                <span>{isEODRunning ? 'Aggregating...' : 'Trigger Aggregation'}</span>
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Revenue (₹)</th>
                  <th className="py-3 px-3">Profit & Margin</th>
                  <th className="py-3 px-3">Orders / Guests</th>
                  <th className="py-3 px-3">Rating</th>
                  <th className="py-3 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyReports.map((report) => {
                  const isSelected = selectedReport?.REPORT_ID === report.REPORT_ID;
                  return (
                    <tr
                      key={report.REPORT_ID}
                      onClick={() => setSelectedReport(report)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-50/70 font-semibold' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-slate-900">{report.REPORT_DATE}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        ₹{report.TOTAL_REVENUE.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-600 font-semibold">
                            ₹{report.PROFIT.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {report.PROFIT_MARGIN}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {report.TOTAL_ORDERS} orders ({report.TOTAL_CUSTOMERS} guests)
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                          <span>{report.AVGRATING}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Eye className={`w-4 h-4 inline-block ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Report Snapshot Inspector */}
        {selectedReport && (
          <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <h3 className="text-base font-bold text-slate-900">EOD Audit Dossier</h3>
                </div>
                <span className="font-mono text-xs text-brand-700 font-bold px-2 py-0.5 rounded bg-brand-50 border border-brand-200">
                  ID #{selectedReport.REPORT_ID}
                </span>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Audit Date</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedReport.REPORT_DATE}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Gross Revenue</span>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      ₹{selectedReport.TOTAL_REVENUE.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Net Profit</span>
                    <div className="text-base font-bold text-emerald-600 mt-0.5">
                      ₹{selectedReport.PROFIT.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Most Ordered Dish</span>
                    <span className="font-bold text-slate-900 text-right max-w-[170px] truncate" title={selectedReport.MOST_ORDERED}>
                      {selectedReport.MOST_ORDERED}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Peak Dining Hour</span>
                    <span className="font-bold text-slate-800">{selectedReport.PEAKHOUR}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Guest Footfall</span>
                    <span className="font-semibold text-slate-800">{selectedReport.TOTAL_CUSTOMERS} covers</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Avg Service Rating</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                      {selectedReport.AVGRATING} / 5.0
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Settlement Method Distribution
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Card Settlement:</span>
                      <span className="font-semibold text-slate-800">₹{selectedReport.CARDPAYMENT.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">UPI / QR Payment:</span>
                      <span className="font-semibold text-slate-800">₹{selectedReport.UPI_PAYMENT.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cash Settlement:</span>
                      <span className="font-semibold text-slate-800">₹{selectedReport.CASHPAYMENT.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dossier to CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
