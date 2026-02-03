export function LibraryPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Exercise Library</h1>
      <p className="text-gray-400 mb-6">
        Your saved exercises will appear here.
      </p>
      <div className="grid gap-4">
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-gray-500">No exercises yet</p>
        </div>
      </div>
    </div>
  );
}
