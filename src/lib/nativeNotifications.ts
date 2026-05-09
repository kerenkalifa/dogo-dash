import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { SoundId } from './sounds';

export const isNative = () => Capacitor.isNativePlatform();

const NOTIF_ID = 4242;

export async function ensureNotifPermission(): Promise<boolean> {
  if (!isNative()) {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      return 'Notification' in window && Notification.permission === 'granted';
    } catch {
      return false;
    }
  }
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch {
    return false;
  }
}

const soundFile = (id: SoundId) => {
  // iOS expects sound file inside the app bundle (e.g., chime.caf).
  // Android: sound file under res/raw. Falls back to default if missing.
  switch (id) {
    case 'bell': return 'bell.wav';
    case 'soft-alarm': return 'soft-alarm.wav';
    case 'dog-bark': return 'dog-bark.wav';
    case 'chime':
    default: return 'chime.wav';
  }
};

export async function scheduleWalkOverNotification(opts: {
  fireAt: Date;
  title: string;
  body: string;
  soundId: SoundId;
}) {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIF_ID,
          title: opts.title,
          body: opts.body,
          schedule: { at: opts.fireAt, allowWhileIdle: true },
          sound: soundFile(opts.soundId),
          smallIcon: 'ic_stat_icon_config_sample',
        },
      ],
    });
  } catch (e) {
    console.warn('[notif] schedule failed', e);
  }
}

export async function cancelWalkOverNotification() {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
  } catch { /* ignore */ }
}
