import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui';
import { Brill } from './components/brand';
import { useDB } from './data/store';
import { usePrefsSync } from './lib/hooks';
import Landing from './pages/public/Landing';
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
  if (session.studentId && roles.includes('student')) return children;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  usePrefsSync();
  return (
    <HashRouter>
      <Toaster />
      <div className="stars-layer" />
      <div className="relative z-[1]">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
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
            <Route path="/admin/*" element={<RequireRole roles={['admin']}><AdminDash /></RequireRole>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </HashRouter>
  );
}
