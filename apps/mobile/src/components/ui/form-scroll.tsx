// ScrollView wrapped in KeyboardAvoidingView so form inputs are never hidden
// behind the keyboard. Use this instead of plain ScrollView in form screens.
//
// Cross-platform notes:
// - iOS uses 'padding' behavior which most reliably pushes content up
// - Android uses 'height' which shrinks the container; combined with the
//   automatic adjust it lets ScrollView scroll to the focused input
// - automaticallyAdjustKeyboardInsets (iOS 14+) reserves space for the
//   keyboard on the ScrollView itself so multiline TextInputs stay visible

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
} from 'react-native'

export function FormScroll({
  keyboardOffset = 0,
  ...props
}: ScrollViewProps & { keyboardOffset?: number }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardOffset}
      className="flex-1"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        {...props}
      />
    </KeyboardAvoidingView>
  )
}
