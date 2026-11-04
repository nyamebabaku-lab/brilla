import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/dancing-script/700.css';
import './index.css';
import App from './App.jsx';
import { toast } from './components/ui';
import { App as NativeApp } from '@capacitor/app';
import { IS_NATIVE } from './lib/platform';

window.addEventListener('brilla-storage-full', () => toast.error('Device storage is full', 'Delete some drawings from the sticker book gallery'));

// Android back button: go back a screen, or close the app from the start screen.
if (IS_NATIVE) {
  NativeApp.addListener('backButton', () => {
    const atStart = ['#/', '#/home', ''].includes(location.hash);
    if (atStart || history.length <= 1) NativeApp.exitApp();
    else history.back();
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
