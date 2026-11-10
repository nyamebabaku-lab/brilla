import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfirmHost, Toaster } from './components/ui';
import MusicController from './components/MusicController';
import SubscriptionWatcher from './components/SubscriptionWatcher';
import { Brill } from './components/brand';
import { useDB } from './data/store';
import { usePrefsSync } from './lib/hooks';
import Landing from './pages/public/Landing';
import AppWelcome from './pages/public/AppWelcome';
import { IS_ADMIN_APP, IS_APP } from './lib/platform';
import AdminAppStart from './pages/public/AdminAppStart';
import PinLock from './components/PinLock';
import { Login, Signup, ClassLogin } from './pages/public/Auth';
import Pricing from './pages/public/Pricing';
import Checkout from './pages/public/Checkout';
import Profiles from './pages/kid/Profiles';
import KidHome from './pages/kid/KidHome';
import SubjectMap from './pages/kid/SubjectMap';
import LessonPlayer from './pages/kid/LessonPlayer';
import Rewards from './pages/kid/Rewards';
import ThemePicker from './pages/kid/ThemePicker';

const ParentDash = lazy(() => import('./pages/parent/ParentDash'));
const TeacherDash = lazy(() => import('./pages/teacher/TeacherDash'));
const AdminDash = lazy(() => import('./pages/admin/AdminDash'));

function Loading() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <Brill size={80} className="animate-bob" />
    </div>
  );
}

function RequireRole({ roles, children }) {
  const session = useDB((s) => s.session);
  const user = useDB((s) => s.users.find((u) => u.id === s.session.userId));
  const schoolsOn = useDB((s) => !!s.settings.schoolsEnabled);
  // School accounts can be switched off by Admin: pupils and teachers then see a short notice.
  if (!schoolsOn && (session.studentId || user?.role === 'teacher')) return <SchoolsPaused />;
  if (session.studentId && roles.includes('student')) return children;
  if (!user) return <Navigate to={IS_ADMIN_APP ? '/' : '/login'} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/home" replace />;
  return children;
}

function SchoolsPaused() {
  const logout = useDB((s) => s.logout);
  return (
    <div className="grid min-h-[100dvh] place-items-center p-4">
      <div className="card max-w-md p-8 text-center">
        <Brill size={80} mood="think" className="mx-auto" />
        <h1 className="mt-3 text-2xl font-semibold">School accounts are paused</h1>
        <p className="mt-2 text-slate-600">Brilla is for families right now. Please ask a parent to create a family account.</p>
        <button onClick={() => (logout(), (location.hash = '#/'))} className="btn-primary mt-5">
          OK
        </button>
      </div>
    </div>
  );
}

export default function App() {
  usePrefsSync();
  return (
    <HashRouter>
      <Toaster />
      <ConfirmHost />
      {IS_ADMIN_APP && <PinLock />}
      <MusicController />
      <SubscriptionWatcher />
      <div className="stars-layer" />
      <div className="relative z-[1]">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={IS_ADMIN_APP ? <AdminAppStart /> : IS_APP ? <AppWelcome /> : <Landing />} />
            <Route path="/login" element={IS_ADMIN_APP ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/class" element={<ClassLogin />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout/:planId" element={<RequireRole roles={['parent', 'teacher']}><Checkout /></RequireRole>} />
            <Route path="/home" element={<RequireRole roles={['parent', 'teacher', 'admin', 'student']}><Profiles /></RequireRole>} />
            <Route path="/kid/:childId" element={<RequireRole roles={['parent', 'teacher', 'admin', 'student']}><KidHome /></RequireRole>} />
            <Route path="/kid/:childId/s/:subjectId" element={<RequireRole roles={['parent', 'teacher', 'admin', 'student']}><SubjectMap /></RequireRole>} />
            <Route path="/kid/:childId/l/:lessonId" element={<RequireRole roles={['parent', 'teacher', 'admin', 'student']}><LessonPlayer /></RequireRole>} />
            <Route path="/kid/:childId/stickers" element={<RequireRole roles={['parent', 'teacher', 'admin', 'student']}><Rewards /></RequireRole>} />
            <Route path="/kid/:childId/theme" element={<RequireRole roles={['parent', 'teacher', 'admin', 'student']}><ThemePicker /></RequireRole>} />
            <Route path="/parent/*" element={<RequireRole roles={['parent']}><ParentDash /></RequireRole>} />
            <Route path="/teacher/*" element={<RequireRole roles={['teacher']}><TeacherDash /></RequireRole>} />
            {/* Admin lives on the website only. */}
            <Route path="/admin/*" element={IS_APP && !IS_ADMIN_APP ? <Navigate to="/" replace /> : <RequireRole roles={['admin', 'recorder']}><AdminDash /></RequireRole>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </HashRouter>
  );
}
