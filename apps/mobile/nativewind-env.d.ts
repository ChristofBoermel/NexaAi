/// <reference types="nativewind/types" />

declare module '*.css'

// Side-effect import used in src/app/_layout.tsx to install the localStorage
// polyfill for Supabase-JS session persistence in React Native.
declare module 'expo-sqlite/localStorage/install'
