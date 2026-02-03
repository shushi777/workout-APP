import { Button } from '@/components/ui/Button';

export function UploadPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <p className="text-gray-400 mb-6">
        Drag and drop a video file or tap to select from your device.
      </p>
      <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center">
        <p className="text-gray-500 mb-4">Upload area placeholder</p>
        <Button variant="primary">Select Video</Button>
      </div>
    </div>
  );
}
