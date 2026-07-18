// Expo push notification helpers.
// Client stores only Expo push tokens under RLS. Server-side fanout lives in
// the notify Edge Function.

import { Platform } from 'react-native'

import Constants from 'expo-constants'
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'

import { supabase } from './supabase'

type NotificationRouter = {
  push: (href: string) => void
}

type PushData = {
  type?: unknown
  matchId?: unknown
  url?: unknown
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export async function registerPushToken(profileId: string) {
  if (Platform.OS === 'web') {
    return { token: null, error: 'Push-Benachrichtigungen sind in der Web-Vorschau nicht verfügbar' }
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('matches', {
      name: 'Matches und Nachrichten',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const permission = await Notifications.getPermissionsAsync()
  const finalPermission =
    permission.status === 'granted'
      ? permission
      : await Notifications.requestPermissionsAsync()

  if (finalPermission.status !== 'granted') {
    return { token: null, error: 'Benachrichtigungen wurden nicht erlaubt' }
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId || typeof projectId !== 'string') {
    return { token: null, error: 'EAS projectId fehlt in der App-Konfiguration' }
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId })
  const { error } = await supabase.from('push_tokens').upsert(
    {
      profile_id: profileId,
      expo_push_token: token.data,
      platform: Platform.OS,
      enabled: true,
      revoked_at: null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' },
  )

  return { token: token.data, error: error?.message ?? null }
}

export async function disablePushToken(expoPushToken: string) {
  const { error } = await supabase
    .from('push_tokens')
    .update({
      enabled: false,
      revoked_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .eq('expo_push_token', expoPushToken)

  return { error: error?.message ?? null }
}

export function subscribeNotificationResponses(router: NotificationRouter) {
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) handleNotificationResponse(router, response)
  })

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationResponse(router, response)
  })

  return () => subscription.remove()
}

export function handleNotificationResponse(
  router: NotificationRouter,
  response: Notifications.NotificationResponse,
) {
  const data = response.notification.request.content.data as PushData
  const href = resolveNotificationHref(data)

  if (href) {
    router.push(href)
  }
}

function resolveNotificationHref(data: PushData) {
  if (typeof data.url === 'string' && data.url.startsWith('/')) {
    return data.url
  }

  if (data.type === 'match' && typeof data.matchId === 'string') {
    return `/(app)/match/${data.matchId}`
  }

  if (data.type === 'message' && typeof data.matchId === 'string') {
    return `/(app)/chat/${data.matchId}`
  }

  const url = Linking.parse(String(data.url ?? ''))
  if (url.path) return `/${url.path}`

  return null
}
