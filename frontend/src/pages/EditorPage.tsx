export function EditorPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Timeline Editor</h1>
      <p className="text-gray-400">
        Edit your video segments here. Canvas timeline will appear after uploading a video.
      </p>
      <div className="mt-6 bg-gray-900 rounded-xl p-8 text-center">
        <p className="text-gray-500">Timeline canvas placeholder</p>
      </div>
    </div>
  );
}
