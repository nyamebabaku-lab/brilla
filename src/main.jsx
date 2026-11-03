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

window.addEventListener('brilla-storage-full', () => toast.error('Device storage is full', 'Delete some drawings from the sticker book gallery'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
