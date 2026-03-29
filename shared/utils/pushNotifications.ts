import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { Client } from './ApiClient'

const firebaseConfig = {
  apiKey: 'AIzaSyC_kY4zDYsOP-_7upwt-uEWT6FBkgs9TBM',
  authDomain: 'tenantswap1.firebaseapp.com',
  projectId: 'tenantswap1',
  storageBucket: 'tenantswap1.firebasestorage.app',
  messagingSenderId: '513059459056',
  appId: '1:513059459056:web:463be627bfbf8231689735',
}

const VAPID_KEY = 'BIAW4TvAdyMElhBQScKvRVpdcWasLr-FhmKdHpiExbhuHjRJFGm14oYvEcCI1QTG-vS__v7U04DTc0cwQsEcTDE'

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0]
  return initializeApp(firebaseConfig)
}

export async function registerPushNotifications(authToken: string): Promise<void> {
  try {
    if (typeof window === 'undefined') return

    const supported = await isSupported()
    if (!supported) {
      console.warn('[PUSH] Web push not supported in this browser')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('[PUSH] Notification permission denied')
      return
    }

    const app = getFirebaseApp()
    const messaging = getMessaging(app)

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    })

    if (!token) {
      console.warn('[PUSH] No FCM token received')
      return
    }

    await Client.post('/users/me/push-token', { token }, {
      Authorization: `Bearer ${authToken}`,
    })

    console.log('[PUSH] Push token registered successfully')
  } catch (error) {
    console.error('[PUSH] Failed to register push notifications:', error)
  }
}
