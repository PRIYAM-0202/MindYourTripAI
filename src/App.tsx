import { AuthProvider, useAuth } from '@/lib/auth';
import { RouterProvider, useRouter } from '@/lib/router';
import { ToastProvider } from '@/lib/toast';
import { Spinner } from '@/components/ui';
import { Landing } from '@/pages/Landing';
import { Auth } from '@/pages/Auth';
import { Dashboard } from '@/pages/Dashboard';
import { TripsList } from '@/pages/TripsList';
import { CreateTrip } from '@/pages/CreateTrip';
import { TripWorkspace } from '@/pages/TripWorkspace';
import { ProfilePage } from '@/pages/Profile';
import { NotificationsPage } from '@/pages/Notifications';
import { SettingsPage } from '@/pages/Settings';

function Routes() {
  const { user, loading } = useAuth();
  const { path } = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // Public routes
  if (path === '/' || path === '/landing') {
    if (user) return <Dashboard />;
    return <Landing />;
  }

  if (path === '/auth') {
    if (user) return <Dashboard />;
    return <Auth />;
  }

  // Protected routes
  if (!user) return <Auth />;

  if (path === '/dashboard') return <Dashboard />;
  if (path === '/trips') return <TripsList />;
  if (path === '/trips/new') return <CreateTrip />;
  if (path.startsWith('/trips/')) return <TripWorkspace />;
  if (path === '/notifications') return <NotificationsPage />;
  if (path === '/profile') return <ProfilePage />;
  if (path === '/settings') return <SettingsPage />;

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <ToastProvider>
          <Routes />
        </ToastProvider>
      </RouterProvider>
    </AuthProvider>
  );
}
