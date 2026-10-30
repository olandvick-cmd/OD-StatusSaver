import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { DailyAnalyticsDoc } from '../../services/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface ExportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: DailyAnalyticsDoc[];
}

export const ExportCsvModal: React.FC<ExportCsvModalProps> = ({
  isOpen,
  onClose,
  analytics
}) => {
  const { isAnalyst } = useAdminAuth();
  const [downloading, setDownloading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!isAnalyst) return;
    setDownloading(true);

    const headers = [
      'Date',
      'Daily Active Users (DAU)',
      'Monthly Active Users (MAU)',
      'New Installs',
      'Sessions',
      'Avg Engagement (Sec)',
      'WhatsApp Standard Count',
      'WhatsApp Business Count',
      'Media Previews',
      'Save Success',
      'Save Errors',
      'Reliability Rate (%)'
    ];

    const rows = analytics.map(a => {
      const totalOps = (a.saveSuccess || 0) + (a.saveErrors || 0);
      const reliability = totalOps > 0 ? (((a.saveSuccess || 0) / totalOps) * 100).toFixed(2) : '100.00';
      return [
        a.date,
        a.dau || 0,
        a.mau || 0,
        a.newUsers || 0,
        a.sessions || 0,
        a.avgEngagementSeconds || 0,
        a.whatsappSelected || 0,
        a.whatsappBusinessSelected || 0,
        a.previewsCount || 0,
        a.saveSuccess || 0,
        a.saveErrors || 0,
        reliability
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `OD_Status_Saver_Aggregate_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Export Aggregate Analytics</h3>
              <p className="text-[11px] text-slate-400">Standard CSV Format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>

        {/* Security & Zero PII verification notice */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero PII Compliance Guarantee</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            The exported dataset contains strictly high-level counts and daily aggregates. It does not contain user phone numbers, IP addresses, media contents, contact lists, or private identifiers.
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono text-[11px] text-slate-300">
            <span>Records to export:</span>
            <span className="text-emerald-400 font-bold">{analytics.length} daily rows</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Preparing...' : 'Download CSV File'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
