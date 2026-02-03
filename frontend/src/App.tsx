import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { UpdatePrompt } from '@/components/ui/UpdatePrompt';
import { UploadPage } from '@/pages/UploadPage';
import { EditorPage } from '@/pages/EditorPage';
import { LibraryPage } from '@/pages/LibraryPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100 pb-[72px]">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
        <BottomNav />
        <UpdatePrompt />
      </div>
    </BrowserRouter>
  );
}
