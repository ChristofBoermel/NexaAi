// React error boundary with a friendly fallback UI. Wrap sections that could
// blow up (async data screens, forms with dependencies) so a rendering error
// does not leave the user staring at a blank white screen.

import { Component, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

type State = { hasError: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.warn('ErrorBoundary caught', error, info)
  }

  private handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-2xl font-bold text-brand-800">Etwas ist schiefgelaufen</Text>
        <Text className="mt-2 text-center text-base text-brand-500">
          Bitte lade die Seite neu. Falls das öfter passiert, melde uns bitte was du gemacht hast.
        </Text>
        <Pressable
          onPress={this.handleReset}
          className="mt-6 rounded-lg bg-brand-800 px-6 py-3"
        >
          <Text className="text-base font-semibold text-white">Neu laden</Text>
        </Pressable>
      </View>
    )
  }
}
