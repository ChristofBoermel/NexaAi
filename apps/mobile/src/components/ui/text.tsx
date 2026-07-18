// Typography primitive.
// Editorial hierarchy for a premium mobile feel:
//   display   -> hero titles (Login welcome, feed empty, match reveal)
//   heading   -> screen titles
//   subheading-> section titles inside a screen
//   body      -> paragraph text
//   muted     -> supporting subtitles, help text
//   caption   -> tiny uppercase labels for section eyebrows

import { type ReactNode } from 'react'
import { Text as RNText } from 'react-native'

const variants = {
  display: 'text-4xl font-bold leading-tight text-brand-800',
  heading: 'text-3xl font-bold leading-tight text-brand-800',
  subheading: 'text-xl font-semibold text-brand-800',
  body: 'text-base leading-6 text-brand-900',
  muted: 'text-sm text-brand-500',
  caption: 'text-xs font-semibold uppercase tracking-widest text-brand-500',
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
