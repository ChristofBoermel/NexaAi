// Skeleton placeholder with a subtle pulse animation. Use while data loads
// so the user sees layout instead of a blank white screen.

import { useEffect, useMemo } from 'react'
import { Animated, Easing, View } from 'react-native'

export function Skeleton({
  width,
  height,
  className,
}: {
  width?: number | `${number}%`
  height?: number
  className?: string
}) {
  const opacity = useMemo(() => new Animated.Value(0.6), [])

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <Animated.View
      style={{ width, height, opacity }}
      className={`rounded-lg bg-brand-100 ${className ?? ''}`}
    />
  )
}

// Convenience: a stack of skeleton lines that mimics a typical CV layout.
export function CvSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton width="70%" height={32} />
      <Skeleton width="100%" height={1} />
      <Skeleton width="100%" height={120} />
      <Skeleton width="100%" height={100} />
      <Skeleton width="100%" height={80} />
    </View>
  )
}
