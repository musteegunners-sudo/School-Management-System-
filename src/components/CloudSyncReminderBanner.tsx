import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, CheckCircle, Clock, X, CloudUpload } from 'lucide-react';

interface CloudSyncReminderBannerProps {
  currentUserRole?: string;
  cloudStatus: {
    isConnected: boolean;
    lastSynced: string | null;
    databaseId: string;
  };
  isCloudSyncing: boolean;
  onTriggerSync: () => Promise<void>;
}

export const CloudSyncReminderBanner: React.FC<CloudSyncReminderBannerProps> = ({
  currentUserRole,
  cloudStatus,
  isCloudSyncing,
  onTriggerSync,
}) => {
  // Only super_admin receives this reminder
  const isSuperAdmin = currentUserRole === 'super_admin';

  const [isVisible, setIsVisible] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number>(0);
  const [justSyncedSuccess, setJustSyncedSuccess] = useState(false);
  const [timeAgoText, setTimeAgoText] = useState<string>('');

  // Initial delay of 8 minutes for newly opened sessions
  useEffect(() => {
    const initialSnooze = Date.now() + 8 * 60 * 1000;
    setDismissedUntil(initialSnooze);
  }, []);

  // Compute time since last sync
  const updateSyncTimeAgo = () => {
    if (!cloudStatus.lastSynced) {
      setTimeAgoText('No cloud sync recorded yet this session');
      return;
    }
    const diffMs = Date.now() - new Date(cloudStatus.lastSynced).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) {
      setTimeAgoText('Last synced just a moment ago');
    } else if (diffMins === 1) {
      setTimeAgoText('Last synced 1 minute ago');
    } else if (diffMins < 60) {
      setTimeAgoText(`Last synced ${diffMins} minutes ago`);
    } else {
      const diffHours = Math.floor(diffMins / 60);
      setTimeAgoText(`Last synced ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`);
    }
  };

  // Periodic timer: checks every 30 seconds
  useEffect(() => {
    if (!isSuperAdmin) {
      setIsVisible(false);
      return;
    }

    const checkReminderCondition = () => {
      updateSyncTimeAgo();
      const now = Date.now();

      // If user has dismissed/snoozed, wait until snooze expires
      if (now < dismissedUntil) {
        return;
      }

      // If cloud is currently syncing, don't show prompt
      if (isCloudSyncing) {
        return;
      }

      // Check if last sync was > 12 minutes ago or never synced
      let minutesSinceSync = 999;
      if (cloudStatus.lastSynced) {
        minutesSinceSync = (now - new Date(cloudStatus.lastSynced).getTime()) / 60000;
      }

      if (minutesSinceSync >= 10) {
        setIsVisible(true);
      }
    };

    checkReminderCondition();
    const interval = setInterval(checkReminderCondition, 30000);
    return () => clearInterval(interval);
  }, [isSuperAdmin, dismissedUntil, cloudStatus.lastSynced, isCloudSyncing]);

  const handleDismiss = (minutesToSnooze: number = 15) => {
    setIsVisible(false);
    setDismissedUntil(Date.now() + minutesToSnooze * 60 * 1000);
  };

  const handleSyncClick = async () => {
    try {
      await onTriggerSync();
      setJustSyncedSuccess(true);
      setTimeout(() => {
        setJustSyncedSuccess(false);
        handleDismiss(20); // Snooze for 20 mins after successful sync
      }, 3000);
    } catch (err) {
      console.error('Reminder sync failed:', err);
    }
  };

  if (!isSuperAdmin || !isVisible) {
    return null;
  }

  return (
    <div className="print:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 mb-2 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-r from-[#FAF4ED] via-white to-[#F7EFE6] border border-[#E4D0BD] p-3.5 sm:p-4 shadow-sm text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5F341B]/10 text-[#5F341B] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            {isCloudSyncing ? (
              <RefreshCw className="w-5 h-5 animate-spin text-[#5F341B]" />
            ) : justSyncedSuccess ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <CloudUpload className="w-5 h-5 text-[#5F341B]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#3E2213] flex items-center gap-1.5">
                <span>Cloud Database Sync Reminder</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#5F341B]/15 text-[#3E2213] uppercase tracking-wider">
                  Super Admin
                </span>
              </span>
              <span className="text-[11px] text-slate-400">•</span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{timeAgoText}</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {justSyncedSuccess
                ? 'Your school records, marks, and attendance registers have been successfully uploaded to the central Firestore cloud database!'
                : 'You have been actively managing school records. Trigger a manual sync to ensure Firestore cloud database holds your latest grade entries and attendance.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {justSyncedSuccess ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>Cloud Synchronized!</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                id="btn-reminder-sync-now"
                onClick={handleSyncClick}
                disabled={isCloudSyncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4E2D17] hover:bg-[#351C0D] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isCloudSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-[#debca3]" />
                    <span>Sync to Cloud Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-reminder-snooze"
                onClick={() => handleDismiss(15)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                title="Snooze reminder for 15 minutes"
              >
                Snooze 15m
              </button>

              <button
                type="button"
                onClick={() => handleDismiss(30)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Dismiss reminder"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
