// Typography primitive with heading/body/muted variants.

import { type ReactNode } from 'react'
import { Text as RNText } from 'react-native'

const variants = {
  heading: 'text-3xl font-bold text-brand-800',
  subheading: 'text-xl font-semibold text-brand-800',
  body: 'text-base text-brand-900',
  muted: 'text-sm text-brand-500',
}

export function Text({
  children,
  variant = 'body',
}: {
  children: ReactNode
  variant?: keyof typeof variants
}) {
  return <RNText className={variants[variant]}>{children}</RNText>
}
