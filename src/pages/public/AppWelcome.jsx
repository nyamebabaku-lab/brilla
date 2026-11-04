// The Android app's first screen: straight to creating an account or logging in.
import { Link, Navigate } from 'react-router-dom';
import { Brill, Logo, SpeechBubble } from '../../components/brand';
import { useDB } from '../../data/store';
import { useTheme, useUser } from '../../lib/hooks';

export default function AppWelcome() {
  useTheme();
  const user = useUser();
  const student = useDB((s) => s.session.studentId);
  if (user || student) return <Navigate to="/home" replace />;
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-between px-5 py-10 text-center">
      <Logo size="text-4xl" />
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 animate-float">
          <Brill size={110} />
          <SpeechBubble className="text-lg">Hi! Let’s learn and play!</SpeechBubble>
        </div>
        <h1 className="on-bg text-balance text-4xl font-bold leading-tight">
          Learning that feels like <span className="rainbow-text">play</span>
        </h1>
        <p className="on-bg-muted max-w-sm text-lg">Tracing, colouring, phonics, maths, science, English, Twi and Ga for ages 2–12.</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link to="/signup" className="btn-accent py-4 text-xl">
          Create account
        </Link>
        <Link to="/login" className="btn-white py-4 text-xl">
          Log in
        </Link>
      </div>
    </div>
  );
}
