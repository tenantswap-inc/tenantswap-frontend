import { fetchEventSource } from '@microsoft/fetch-event-source'

const STREAM_PATH = '/events/stream'
const LIVE_UPDATE_SOUND_PATHS = {
  match: '/sounds/match.mp3',
  request: '/sounds/request.mp3',
  notification: '/sounds/notification.mp3',
} as const
const SOUND_COOLDOWN_MS = 2000

let audioUnlockBound = false
let audioPrimed = false
let lastSoundAt = 0
const liveUpdateAudios = new Map<string, HTMLAudioElement>()

function buildStreamUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured')
  }

  return new URL(STREAM_PATH, `${baseUrl.replace(/\/$/, '')}/`).toString()
}

function ensureLiveUpdateAudio(src: string): HTMLAudioElement | null {
  if (typeof window === 'undefined') {
    return null
  }

  const existingAudio = liveUpdateAudios.get(src)
  if (existingAudio) {
    return existingAudio
  }

  const audio = new Audio(src)
  audio.preload = 'auto'
  audio.volume = 0.9
  liveUpdateAudios.set(src, audio)
  return audio
}

function removeAudioUnlockListeners() {
  if (typeof window === 'undefined' || !audioUnlockBound) {
    return
  }

  const options: AddEventListenerOptions = { capture: true }
  window.removeEventListener('pointerdown', unlockAudioPlayback, options)
  window.removeEventListener('touchstart', unlockAudioPlayback, options)
  window.removeEventListener('keydown', unlockAudioPlayback, options)
  audioUnlockBound = false
}

async function unlockAudioPlayback() {
  const audio = ensureLiveUpdateAudio(LIVE_UPDATE_SOUND_PATHS.notification)

  if (!audio || audioPrimed) {
    return
  }

  try {
    audio.currentTime = 0
    audio.muted = true
    await audio.play()
    audio.pause()
    audio.currentTime = 0
    audio.muted = false
    audioPrimed = true
    removeAudioUnlockListeners()
  } catch {
    audio.muted = false
  }
}

function bindAudioUnlockListeners() {
  if (typeof window === 'undefined' || audioUnlockBound || audioPrimed) {
    return
  }

  const options: AddEventListenerOptions = { capture: true, passive: true }
  window.addEventListener('pointerdown', unlockAudioPlayback, options)
  window.addEventListener('touchstart', unlockAudioPlayback, options)
  window.addEventListener('keydown', unlockAudioPlayback, options)
  audioUnlockBound = true
}

function playLiveUpdateSound(kind: 'match' | 'request' | 'notification') {
  const requestedSrc = LIVE_UPDATE_SOUND_PATHS[kind]
  const fallbackSrc = LIVE_UPDATE_SOUND_PATHS.notification
  const audio = ensureLiveUpdateAudio(requestedSrc) ?? ensureLiveUpdateAudio(fallbackSrc)

  if (!audio) {
    return
  }

  if (!audioPrimed) {
    bindAudioUnlockListeners()
    return
  }

  const now = Date.now()
  if (now - lastSoundAt < SOUND_COOLDOWN_MS) {
    return
  }

  lastSoundAt = now

  const playback = new Audio(audio.src || fallbackSrc)
  playback.volume = audio.volume

  void playback.play().catch(() => {
    lastSoundAt = 0
    bindAudioUnlockListeners()
  })
}

type LiveUpdateHandlers = {
  refreshUser: () => Promise<void> | void
  refreshUnreadCount?: () => Promise<void> | void
  refreshInterests?: () => Promise<void> | void
}

export type LiveUpdateCueKind = 'match' | 'request' | 'notification'
export const LIVE_UPDATE_CUE_EVENT = 'tenantswap:live-cue'
export const LIVE_UPDATE_EVENT = 'tenantswap:live-update'

type LiveEventData = {
  type?: string
  [key: string]: unknown
}

export type LiveUpdateEventType =
  | 'connected'
  | 'heartbeat'
  | 'matches.updated'
  | 'interests.updated'
  | 'notifications.updated'
  | 'user.refresh'

export type LiveUpdateEventDetail = {
  type: LiveUpdateEventType
  data: LiveEventData | null
}

function emitLiveUpdateCue(kind: LiveUpdateCueKind) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(LIVE_UPDATE_CUE_EVENT, {
      detail: { kind },
    }),
  )
}

function emitLiveUpdateEvent(detail: LiveUpdateEventDetail) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(LIVE_UPDATE_EVENT, {
      detail,
    }),
  )
}

function parseEventData(data?: string): LiveEventData | null {
  if (!data) {
    return null
  }

  try {
    return JSON.parse(data) as LiveEventData
  } catch {
    return null
  }
}

function resolveEventType(event: { event?: string; data?: string }): LiveUpdateEventType | null {
  if (event.event) {
    return event.event as LiveUpdateEventType
  }

  const parsed = parseEventData(event.data)
  return typeof parsed?.type === 'string' ? (parsed.type as LiveUpdateEventType) : null
}

export function connectLiveUpdates(token: string, handlers: LiveUpdateHandlers) {
  const controller = new AbortController()

  bindAudioUnlockListeners()
  ensureLiveUpdateAudio(LIVE_UPDATE_SOUND_PATHS.notification)
  ensureLiveUpdateAudio(LIVE_UPDATE_SOUND_PATHS.request)
  ensureLiveUpdateAudio(LIVE_UPDATE_SOUND_PATHS.match)

  void fetchEventSource(buildStreamUrl(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    signal: controller.signal,
    openWhenHidden: true,
    async onmessage(event) {
      const eventType = resolveEventType(event)
      const eventData = parseEventData(event.data)

      if (eventType) {
        emitLiveUpdateEvent({
          type: eventType,
          data: eventData,
        })
      }

      switch (eventType) {
        case 'matches.updated':
          emitLiveUpdateCue('match')
          playLiveUpdateSound('match')
          await handlers.refreshUser()
          break
        case 'user.refresh':
          await handlers.refreshUser()
          break
        case 'notifications.updated':
          emitLiveUpdateCue('notification')
          playLiveUpdateSound('notification')
          await handlers.refreshUnreadCount?.()
          break
        case 'interests.updated':
          emitLiveUpdateCue('request')
          playLiveUpdateSound('request')
          await handlers.refreshInterests?.()
          break
        case 'connected':
        case 'heartbeat':
        default:
          break
      }
    },
    onerror(error) {
      if (controller.signal.aborted) {
        return
      }

      console.error('Live updates stream error:', error)
    },
  })

  return () => controller.abort()
}
