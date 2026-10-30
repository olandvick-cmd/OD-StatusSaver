import React, { useState } from 'react';
import { 
  Download, Check, Play, Share2, Repeat, Trash2, 
  RefreshCw, FolderCheck, X, Shield, ChevronLeft,
  Smartphone, Settings, CheckSquare, Square,
  Folder, ArrowLeft, CheckCircle2, AlertCircle,
  Activity, BarChart2
} from 'lucide-react';
import { SimulatedStatus, RemoteConfigSettings } from '../data/mockAndroidData';

interface AndroidSimulatorProps {
  statuses: SimulatedStatus[];
  onSaveStatus: (id: string) => void;
  onDeleteStatus: (id: string) => void;
  config: RemoteConfigSettings;
  onTrackEvent?: (name: string, params: Record<string, any>) => void;
}

export const AndroidSimulator: React.FC<AndroidSimulatorProps> = ({
  statuses,
  onSaveStatus,
  onDeleteStatus,
  config,
  onTrackEvent
}) => {
  const [activeTab, setActiveTab] = useState<'STANDARD' | 'BUSINESS' | 'SAVED'>('STANDARD');
  const [mediaFilter, setMediaFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [currentView, setCurrentView] = useState<'GALLERY' | 'SETTINGS'>('GALLERY');
  const [selectedStatus, setSelectedStatus] = useState<SimulatedStatus | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Independent source permission states
  const [whatsappSafGranted, setWhatsappSafGranted] = useState<boolean>(true);
  const [businessSafGranted, setBusinessSafGranted] = useState<boolean>(true);
  const [pendingSafSource, setPendingSafSource] = useState<'STANDARD' | 'BUSINESS' | null>(null);

  // User Privacy & Analytics Consent (Requirement 8)
  const [analyticsConsentEnabled, setAnalyticsConsentEnabled] = useState<boolean>(true);

  // Multi-select bulk saving state
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<String>>(new Set());
  const [bulkSaveProgress, setBulkSaveProgress] = useState<{ current: number; total: number } | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const dispatchAnalytics = (eventName: string, params: Record<string, any>) => {
    if (analyticsConsentEnabled && onTrackEvent) {
      onTrackEvent(eventName, params);
    }
  };

  const hasAccessForCurrentTab = activeTab === 'SAVED' 
    ? true 
    : (activeTab === 'STANDARD' ? whatsappSafGranted : businessSafGranted);

  const currentList = statuses.filter(s => {
    if (activeTab === 'SAVED') {
      if (!s.isSaved) return false;
    } else {
      if (s.source !== activeTab) return false;
    }
    if (mediaFilter === 'IMAGE') return s.mediaType === 'IMAGE';
    if (mediaFilter === 'VIDEO') return s.mediaType === 'VIDEO';
    return true;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
    if (next.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const selectAll = () => {
    setSelectedIds(new Set(currentList.map(s => s.id)));
  };

  const handleBulkSave = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    setBulkSaveProgress({ current: 0, total: count });
    const sourceStr = activeTab === 'BUSINESS' ? 'whatsapp_business' : 'whatsapp';

    setTimeout(() => {
      setBulkSaveProgress({ current: Math.ceil(count / 2), total: count });
      setTimeout(() => {
        selectedIds.forEach(id => onSaveStatus(id as string));
        setBulkSaveProgress(null);
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        triggerToast(`Successfully saved ${count} statuses to Gallery!`);

        dispatchAnalytics('bulk_save_completed', {
          total_count: count,
          success_count: count,
          failure_count: 0,
          source: sourceStr
        });
      }, 500);
    }, 400);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Phone Hardware Mockup */}
      <div className="w-full max-w-[380px] h-[740px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/60 relative flex flex-col overflow-hidden">
        
        {/* Device Notch / Camera Hole */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-900 ml-16" />
        </div>

        {/* Screen Content */}
        <div className="w-full h-full bg-slate-950 rounded-[34px] flex flex-col overflow-hidden relative text-slate-100 select-none">
          
          {/* Status Bar */}
          <div className="pt-6 px-6 pb-2 flex justify-between items-center text-xs text-slate-400 font-mono z-30">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2.5 border border-slate-400 rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-slate-300 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Top Bar (Jetpack Compose Material 3) */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md z-20">
            {currentView === 'SETTINGS' ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentView('GALLERY')}
                  className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="font-bold text-sm tracking-tight text-white">Settings & Privacy</h1>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    OD
                  </div>
                  <h1 className="font-bold text-base tracking-tight text-white">OD Status Saver</h1>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      triggerToast("Status cache refreshed");
                      dispatchAnalytics('status_list_viewed', {
                        source: activeTab === 'BUSINESS' ? 'whatsapp_business' : 'whatsapp',
                        item_count: currentList.length,
                        media_filter: mediaFilter.toLowerCase()
                      });
                    }} 
                    className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentView('SETTINGS');
                      dispatchAnalytics('help_opened', { screen_name: 'settings' });
                    }} 
                    className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Settings Screen View */}
          {currentView === 'SETTINGS' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Privacy Callout */}
              <div className="bg-emerald-950/60 border border-emerald-600/40 rounded-2xl p-3 text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>100% On-Device & Private</span>
                </div>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  No accounts, no phone numbers, and zero media uploads. All statuses remain on your phone.
                </p>
              </div>

              {/* Anonymous Analytics & Crashlytics Consent Toggle */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    <span>Analytics & Crash Reports</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsConsentEnabled}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setAnalyticsConsentEnabled(next);
                        triggerToast(next ? "Analytics collection enabled" : "Analytics collection disabled");
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Shares anonymous operational metrics and crash dumps. No media filenames, paths, or phone numbers are ever tracked.
                </p>
              </div>

              {/* Standard WhatsApp Source */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Standard WhatsApp</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    whatsappSafGranted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {whatsappSafGranted ? 'Connected' : 'Missing Access'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Package: <code className="text-slate-300">com.whatsapp</code></p>
                <p className="text-[10px] text-slate-400">Path: <code className="text-slate-300">Android/media/com.whatsapp/...</code></p>
                
                <div className="pt-1 flex justify-end">
                  {whatsappSafGranted ? (
                    <button
                      onClick={() => {
                        setWhatsappSafGranted(false);
                        triggerToast("Revoked WhatsApp folder access");
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-medium"
                    >
                      Reset Folder
                    </button>
                  ) : (
                    <button
                      onClick={() => setPendingSafSource('STANDARD')}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[10px] font-bold"
                    >
                      Grant Access
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp Business Source */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">WhatsApp Business</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    businessSafGranted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {businessSafGranted ? 'Connected' : 'Missing Access'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Package: <code className="text-slate-300">com.whatsapp.w4b</code></p>
                <p className="text-[10px] text-slate-400">Path: <code className="text-slate-300">Android/media/com.whatsapp.w4b/...</code></p>

                <div className="pt-1 flex justify-end">
                  {businessSafGranted ? (
                    <button
                      onClick={() => {
                        setBusinessSafGranted(false);
                        triggerToast("Revoked WA Business folder access");
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-medium"
                    >
                      Reset Folder
                    </button>
                  ) : (
                    <button
                      onClick={() => setPendingSafSource('BUSINESS')}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[10px] font-bold"
                    >
                      Grant Access
                    </button>
                  )}
                </div>
              </div>

              {/* Destination Albums */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                <span className="font-bold text-white text-xs">Gallery Albums</span>
                <p className="text-[11px] text-slate-400">Photos: <code className="text-emerald-400">Pictures/ODStatusSaver</code></p>
                <p className="text-[11px] text-slate-400">Videos: <code className="text-emerald-400">Movies/ODStatusSaver</code></p>
              </div>
            </div>
          ) : (
            <>
              {/* Material 3 Tabs */}
              <div className="grid grid-cols-3 bg-slate-900/90 border-b border-slate-800/80 text-xs font-semibold">
                <button
                  onClick={() => { 
                    setActiveTab('STANDARD'); 
                    setIsSelectionMode(false); 
                    setSelectedIds(new Set()); 
                    dispatchAnalytics('source_selected', { source: 'whatsapp' });
                  }}
                  className={`py-2.5 text-center transition-all relative ${
                    activeTab === 'STANDARD' 
                      ? 'text-emerald-400 font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  WhatsApp
                  {activeTab === 'STANDARD' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </button>
                <button
                  onClick={() => { 
                    setActiveTab('BUSINESS'); 
                    setIsSelectionMode(false); 
                    setSelectedIds(new Set()); 
                    dispatchAnalytics('source_selected', { source: 'whatsapp_business' });
                  }}
                  className={`py-2.5 text-center transition-all relative ${
                    activeTab === 'BUSINESS' 
                      ? 'text-emerald-400 font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  WA Business
                  {activeTab === 'BUSINESS' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </button>
                <button
                  onClick={() => { 
                    setActiveTab('SAVED'); 
                    setIsSelectionMode(false); 
                    setSelectedIds(new Set()); 
                    dispatchAnalytics('source_selected', { source: 'saved' });
                  }}
                  className={`py-2.5 text-center transition-all relative ${
                    activeTab === 'SAVED' 
                      ? 'text-emerald-400 font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Saved ({statuses.filter(s => s.isSaved).length})
                  {activeTab === 'SAVED' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </button>
              </div>

              {/* Multi-Select Bar OR Filter Chips */}
              {isSelectionMode ? (
                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}>
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                    <span>{selectedIds.size} Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={selectAll}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px]"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleBulkSave}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow"
                    >
                      <Download className="w-3 h-3" />
                      Save ({selectedIds.size})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 text-xs">
                  <div className="flex gap-1.5 overflow-x-auto">
                    {(['ALL', 'IMAGE', 'VIDEO'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => {
                          setMediaFilter(f);
                          dispatchAnalytics('status_list_viewed', {
                            source: activeTab === 'BUSINESS' ? 'whatsapp_business' : 'whatsapp',
                            item_count: currentList.length,
                            media_filter: f.toLowerCase()
                          });
                        }}
                        className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-all ${
                          mediaFilter === f
                            ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 font-medium'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {f === 'ALL' ? 'All' : f === 'IMAGE' ? 'Photos' : 'Videos'}
                      </button>
                    ))}
                  </div>

                  {activeTab !== 'SAVED' && currentList.length > 0 && (
                    <button
                      onClick={() => setIsSelectionMode(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50"
                    >
                      Select
                    </button>
                  )}
                </div>
              )}

              {/* Bulk Save Progress Bar */}
              {bulkSaveProgress && (
                <div className="bg-emerald-950 border-b border-emerald-700 px-3 py-1.5 text-xs flex items-center justify-between text-emerald-300">
                  <span>Saving to Gallery... ({bulkSaveProgress.current}/{bulkSaveProgress.total})</span>
                  <div className="w-20 h-1.5 bg-emerald-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${(bulkSaveProgress.current / bulkSaveProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Permission Banner (if revoked for current source) */}
              {!hasAccessForCurrentTab && (
                <div className="mx-3 my-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-300">
                    <FolderCheck className="w-4 h-4 shrink-0" />
                    <span>Permission needed for {activeTab === 'BUSINESS' ? 'WA Business' : 'WhatsApp'}</span>
                  </div>
                  <button
                    onClick={() => setPendingSafSource(activeTab as 'STANDARD' | 'BUSINESS')}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px]"
                  >
                    Grant
                  </button>
                </div>
              )}

              {/* Media Grid */}
              <div className="flex-1 overflow-y-auto p-3">
                {currentList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">No statuses found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                      {activeTab === 'SAVED' 
                        ? "Tap the download icon on any status to save it to your device."
                        : "View statuses in WhatsApp first, then check back here."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 pb-16">
                    {currentList.map(status => {
                      const isSelected = selectedIds.has(status.id);
                      return (
                        <div 
                          key={status.id}
                          className={`group relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 border cursor-pointer shadow-sm transition-all ${
                            isSelected 
                              ? 'border-2 border-emerald-400 ring-2 ring-emerald-500/30' 
                              : 'border-slate-800/80 hover:border-emerald-500/50'
                          }`}
                          onClick={() => {
                            if (isSelectionMode) {
                              toggleSelect(status.id);
                            } else {
                              setSelectedStatus(status);
                              dispatchAnalytics('media_previewed', {
                                media_type: status.mediaType.toLowerCase(),
                                source: status.source === 'BUSINESS' ? 'whatsapp_business' : 'whatsapp'
                              });
                            }
                          }}
                        >
                          {/* Media Thumbnail */}
                          {status.mediaType === 'IMAGE' ? (
                            <img 
                              src={status.url} 
                              alt={status.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-300">
                              <video 
                                src={status.url} 
                                className="w-full h-full object-cover" 
                                muted 
                                loop 
                                playsInline 
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                                  <Play className="w-4 h-4 fill-white" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Multi-Select Checkmark Overlay */}
                          {isSelectionMode && (
                            <div className="absolute top-2 left-2 z-10">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border shadow ${
                                isSelected 
                                  ? 'bg-emerald-500 border-white text-white' 
                                  : 'bg-black/60 border-slate-300 text-transparent'
                              }`}>
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          )}

                          {/* Gradient Overlay & Buttons */}
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-1">
                              {status.mediaType === 'VIDEO' && (
                                <span className="text-[10px] font-mono font-bold bg-black/70 px-1.5 py-0.5 rounded text-emerald-400">
                                  {status.duration || "0:15"}
                                </span>
                              )}
                            </div>

                            {!isSelectionMode && (
                              <div className="flex items-center gap-1">
                                {activeTab === 'SAVED' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteStatus(status.id);
                                      triggerToast("Deleted from gallery");
                                    }}
                                    className="w-7 h-7 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white flex items-center justify-center shadow"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!status.isSaved) {
                                        const sourceStr = status.source === 'BUSINESS' ? 'whatsapp_business' : 'whatsapp';
                                        dispatchAnalytics('save_started', {
                                          media_type: status.mediaType.toLowerCase(),
                                          source: sourceStr
                                        });

                                        onSaveStatus(status.id);
                                        triggerToast("Saved to Pictures/ODStatusSaver");

                                        dispatchAnalytics('save_completed', {
                                          media_type: status.mediaType.toLowerCase(),
                                          source: sourceStr,
                                          is_duplicate: false
                                        });
                                      }
                                    }}
                                    disabled={status.isSaved}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow transition-all ${
                                      status.isSaved
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-black/70 hover:bg-emerald-500 text-white hover:text-white'
                                    }`}
                                    title={status.isSaved ? "Saved" : "Save Status"}
                                  >
                                    {status.isSaved ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : (
                                      <Download className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Simulated Toast */}
          {toastMessage && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-slate-700/80 flex items-center gap-1.5 z-50 animate-bounce">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Fullscreen Status Viewer Modal */}
          {selectedStatus && (
            <div className="absolute inset-0 bg-black z-50 flex flex-col justify-between">
              {/* Top Bar */}
              <div className="p-4 pt-7 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
                <button
                  onClick={() => setSelectedStatus(null)}
                  className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center text-xs">
                  <p className="font-semibold text-white truncate max-w-[180px]">{selectedStatus.title}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {selectedStatus.source === 'BUSINESS' ? 'WA Business' : 'WhatsApp'} • {(selectedStatus.sizeBytes / 1024).toFixed(0)} KB
                  </p>
                </div>
                <div className="w-8" />
              </div>

              {/* Media Display */}
              <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden">
                {selectedStatus.mediaType === 'IMAGE' ? (
                  <img 
                    src={selectedStatus.url} 
                    alt={selectedStatus.title} 
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <video 
                    src={selectedStatus.url} 
                    className="max-h-full max-w-full rounded-lg" 
                    controls 
                    autoPlay 
                    loop 
                  />
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!selectedStatus.isSaved) {
                      const sourceStr = selectedStatus.source === 'BUSINESS' ? 'whatsapp_business' : 'whatsapp';
                      dispatchAnalytics('save_started', {
                        media_type: selectedStatus.mediaType.toLowerCase(),
                        source: sourceStr
                      });

                      onSaveStatus(selectedStatus.id);
                      setSelectedStatus({ ...selectedStatus, isSaved: true });
                      triggerToast("Saved to Pictures/ODStatusSaver");

                      dispatchAnalytics('save_completed', {
                        media_type: selectedStatus.mediaType.toLowerCase(),
                        source: sourceStr,
                        is_duplicate: false
                      });
                    }
                  }}
                  disabled={selectedStatus.isSaved}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition ${
                    selectedStatus.isSaved 
                      ? 'bg-slate-800 text-slate-400' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {selectedStatus.isSaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Saved to Device
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Save to Gallery
                    </>
                  )}
                </button>

                <button
                  onClick={() => triggerToast("Opening Android share sheet")}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => triggerToast("Opening WhatsApp story repost")}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                  title="Repost to WhatsApp"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SAF Android 11+ Permission Modal Simulation */}
          {pendingSafSource && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-[320px] text-slate-100 shadow-2xl">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <FolderCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm mb-1">
                  Access {pendingSafSource === 'BUSINESS' ? 'WA Business' : 'WhatsApp'} Folder
                </h3>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Android 11+ requires permission to this specific folder to preview and save media.
                </p>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5 mb-4 font-mono">
                  <div>1. Storage picker opens</div>
                  <div>2. Tap <b>"Use this folder"</b></div>
                  <div>3. Tap <b>"Allow"</b></div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const sourceStr = pendingSafSource === 'BUSINESS' ? 'whatsapp_business' : 'whatsapp';
                      dispatchAnalytics('permission_flow_completed', { source: sourceStr, permission_granted: false });
                      setPendingSafSource(null);
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const sourceStr = pendingSafSource === 'BUSINESS' ? 'whatsapp_business' : 'whatsapp';
                      if (pendingSafSource === 'BUSINESS') {
                        setBusinessSafGranted(true);
                      } else {
                        setWhatsappSafGranted(true);
                      }
                      setPendingSafSource(null);
                      triggerToast("SAF Tree URI persisted to DataStore");
                      dispatchAnalytics('permission_flow_completed', { source: sourceStr, permission_granted: true });
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
                  >
                    Allow & Save
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Simulation Helper Label */}
      <div className="mt-3 text-center">
        <span className="text-xs font-medium text-slate-400 inline-flex items-center gap-1.5 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
          <Smartphone className="w-3 h-3 text-emerald-400" />
          Interactive Jetpack Compose UI Simulation (Edge-to-Edge Material 3)
        </span>
      </div>
    </div>
  );
};
