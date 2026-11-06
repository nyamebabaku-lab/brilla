// Two Android apps from one project:
//   APP unset → "Brilla" for families (android/, web files from dist-app)
//   APP=admin → "Brilla Admin" (android-admin/, web files from dist-admin)
import type { CapacitorConfig } from '@capacitor/cli';

const admin = process.env.APP === 'admin';

const config: CapacitorConfig = {
  appId: admin ? 'app.brilla.admin' : 'app.brilla.kids',
  appName: admin ? 'Brilla Admin' : 'Brilla',
  webDir: admin ? 'dist-admin' : 'dist-app',
  android: {
    path: admin ? 'android-admin' : 'android',
    backgroundColor: '#fff7ed',
  },
};

export default config;
