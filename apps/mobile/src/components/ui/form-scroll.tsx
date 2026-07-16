// ScrollView wrapped in KeyboardAvoidingView so form inputs are never hidden
// behind the keyboard. Use this instead of plain ScrollView in form screens.

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
} from 'react-native'

export function FormScroll(props: ScrollViewProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <ScrollView keyboardShouldPersistTaps="handled" {...props} />
    </KeyboardAvoidingView>
  )
}
