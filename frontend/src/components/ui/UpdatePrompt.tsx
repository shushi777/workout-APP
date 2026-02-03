import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-lg bg-gray-800 p-4 shadow-lg border border-gray-700">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-100">
          {offlineReady
            ? 'האפליקציה מוכנה לשימוש אופליין'
            : 'גרסה חדשה זמינה - לחץ לעדכון'}
        </p>
        <div className="flex gap-2 justify-end">
          {needRefresh && (
            <button
              className="px-4 py-2 min-h-[44px] bg-purple-600 text-white rounded-lg font-medium"
              onClick={() => updateServiceWorker(true)}
            >
              עדכן עכשיו
            </button>
          )}
          <button
            className="px-4 py-2 min-h-[44px] border border-gray-600 text-gray-100 rounded-lg"
            onClick={close}
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
