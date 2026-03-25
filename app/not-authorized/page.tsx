export default function NotAuthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-gray-500">
          You don’t have permission to access this page.
        </p>
      </div>
    </main>
  );
}