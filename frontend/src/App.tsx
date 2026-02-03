import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { UpdatePrompt } from '@/components/ui/UpdatePrompt';
import { UploadPage } from '@/pages/UploadPage';
import { EditorPage } from '@/pages/EditorPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { getSharedVideo, deleteSharedVideo, cleanupOldSharedVideos } from '@/lib/shareTarget';
import { useUploadStore } from '@/stores/uploadStore';

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSharedFile = useUploadStore(state => state.setSharedFile);

  useEffect(() => {
    // Cleanup old shared videos on app start
    cleanupOldSharedVideos().catch(console.error);

    const sharedVideoId = searchParams.get('shared');
    const error = searchParams.get('error');

    if (error) {
      // Handle share errors
      let errorMessage = 'שגיאה בשיתוף הקובץ';
      if (error === 'no-video') {
        errorMessage = 'לא התקבל קובץ וידאו';
      } else if (error === 'invalid-type') {
        errorMessage = 'סוג קובץ לא נתמך';
      }
      // Show error toast or alert
      alert(errorMessage);
      // Clear error from URL
      setSearchParams({});
      return;
    }

    if (sharedVideoId) {
      // Retrieve shared video from IndexedDB
      getSharedVideo(sharedVideoId)
        .then((file) => {
          if (file) {
            console.log('[App] Received shared video:', file.name, file.size);
            // Set in upload store
            setSharedFile(file);
            // Delete from IndexedDB (cleanup)
            deleteSharedVideo(sharedVideoId);
            // Clear query param and ensure we're on upload page
            setSearchParams({});
            navigate('/');
          } else {
            console.warn('[App] Shared video not found in IndexedDB');
            setSearchParams({});
          }
        })
        .catch((err) => {
          console.error('[App] Error retrieving shared video:', err);
          setSearchParams({});
        });
    }
  }, [searchParams, setSearchParams, navigate, setSharedFile]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-[72px]">
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/library" element={<LibraryPage />} />
      </Routes>
      <BottomNav />
      <UpdatePrompt />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
