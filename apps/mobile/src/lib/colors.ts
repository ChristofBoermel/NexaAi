// Brand color constants for native props that cannot use NativeWind classes
// (Switch trackColor, TextInput placeholderTextColor, etc). Kept in sync with
// the palette in tailwind.config.js. Anything that CAN take a className should
// still use the className instead of this map.

export const brand = {
  50: '#F0F5F9',
  100: '#DDE7EF',
  200: '#B0C4D5',
  300: '#829FB8',
  400: '#4E7A9C',
  500: '#265D82',
  600: '#164764',
  700: '#0F3B57',
  800: '#0E3652',
  900: '#092640',
  950: '#04182D',
} as const

export const neutral = {
  white: '#FFFFFF',
} as const
