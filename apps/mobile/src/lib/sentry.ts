// Central Sentry wrapper for the mobile app.
// Keep privacy defaults here so screens never configure Sentry directly.

import * as Sentry from '@sentry/react-native'

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN

const piiPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\b(?:\+49|0049|0)[1-9][0-9\s/-]{6,}\b/g,
]

const sensitiveKeys = new Set([
  'email',
  'first_name',
  'firstname',
  'firstName',
  'last_name',
  'lastname',
  'lastName',
  'name',
  'real_name',
  'realName',
  'body',
  'message',
  'cv',
  'cvText',
  'cv_markdown',
  'cvMarkdown',
  'rawCv',
  'raw_cv',
])

let initialized = false

export function initSentry() {
  if (initialized || !dsn) return

  Sentry.init({
    dsn,
    sendDefaultPii: false,
    enableAutoSessionTracking: false,
    enableAutoPerformanceTracing: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      return scrubEvent(event)
    },
  })

  initialized = true
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!initialized) return

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('nexaai', scrubRecord(context))
    }
    Sentry.captureException(error)
  })
}

export function setSentryUser(userId: string) {
  if (!initialized) return
  Sentry.setUser({ id: userId })
}

export function clearSentryUser() {
  if (!initialized) return
  Sentry.setUser(null)
}

export function withSentryRoot<T extends Record<string, unknown>>(
  component: React.ComponentType<T>,
) {
  return Sentry.wrap(component)
}

export function triggerDevCrash() {
  if (!__DEV__) return
  captureException(new Error('NexaAi Dev Crash'), { source: 'dev-button' })
}

function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.user) {
    event.user = event.user.id ? { id: event.user.id } : undefined
  }

  if (event.message) {
    event.message = scrubString(event.message)
  }

  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((value) => ({
      ...value,
      value: value.value ? scrubString(value.value) : value.value,
    }))
  }

  if (event.contexts) {
    event.contexts = scrubRecord(event.contexts) as Sentry.Event['contexts']
  }

  if (event.extra) {
    event.extra = scrubRecord(event.extra)
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      message: breadcrumb.message ? scrubString(breadcrumb.message) : breadcrumb.message,
      data: breadcrumb.data ? scrubRecord(breadcrumb.data) : breadcrumb.data,
    }))
  }

  return event
}

function scrubRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeys.has(key) ? '[redacted]' : scrubValue(entry),
    ]),
  )
}

function scrubValue(value: unknown): unknown {
  if (typeof value === 'string') return scrubString(value)
  if (Array.isArray(value)) return value.map(scrubValue)
  if (value && typeof value === 'object') {
    return scrubRecord(value as Record<string, unknown>)
  }
  return value
}

function scrubString(value: string) {
  return piiPatterns.reduce((text, pattern) => text.replace(pattern, '[redacted]'), value)
}
