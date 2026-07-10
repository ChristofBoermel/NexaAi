// Typography primitive with heading/body/muted variants.

import { type ReactNode } from 'react'
import { Text as RNText } from 'react-native'

type TextVariants = Record<string, string>

const variants: TextVariants = {
  heading: 'text-2xl font-bold text-neutral-900',
  body: 'text-base text-neutral-900',
  muted: 'text-sm text-neutral-500',
}

export function Text({
  children,
  variant = 'body',
}: {
  children: ReactNode
  variant?: 'heading' | 'body' | 'muted'
}) {
  return <RNText className={variants[variant]}>{children}</RNText>
}
