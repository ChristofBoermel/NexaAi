// Wordmark logo (handshake + "nexa consulting"). Aspect ratio ~3.28:1.
// Static import means Metro bundles the asset and the same URI works on all platforms.

import { Image } from 'react-native'

const ASPECT = 305 / 93

const sizes = {
  sm: 120,
  md: 180,
  lg: 240,
}

export function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const width = sizes[size]
  const height = width / ASPECT

  return (
    <Image
      source={require('../../../assets/logo.png')}
      style={{ width, height }}
      resizeMode="contain"
      accessibilityLabel="NexaAi"
    />
  )
}
