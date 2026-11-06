// Saves a file the user made (exports, CSVs). In a browser it downloads; in the Android apps the
// phone's Share sheet opens so it can be sent by WhatsApp, Gmail or saved to Drive.
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { IS_NATIVE } from './platform';

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

export async function saveFile(name, blob) {
  if (!IS_NATIVE) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    return;
  }
  const { uri } = await Filesystem.writeFile({ path: name, data: await toBase64(blob), directory: Directory.Cache });
  await Share.share({ title: name, files: [uri] });
}
