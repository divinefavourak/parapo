import { useCssElement } from 'react-native-css';
import React from 'react';
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
  Modal as RNModal,
} from 'react-native';

export type ViewProps = React.ComponentProps<typeof RNView> & { className?: string };
export const View = (props: ViewProps) => useCssElement(RNView, props, { className: 'style' });
View.displayName = 'CSS(View)';

export type TextProps = React.ComponentProps<typeof RNText> & { className?: string };
export const Text = (props: TextProps) => useCssElement(RNText, props, { className: 'style' });
Text.displayName = 'CSS(Text)';

export type PressableProps = React.ComponentProps<typeof RNPressable> & { className?: string };
export const Pressable = (props: PressableProps) => useCssElement(RNPressable, props, { className: 'style' });
Pressable.displayName = 'CSS(Pressable)';

export type ScrollViewProps = React.ComponentProps<typeof RNScrollView> & {
  className?: string;
  contentContainerClassName?: string;
};
export const ScrollView = (props: ScrollViewProps) =>
  useCssElement(RNScrollView, props, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
  });
ScrollView.displayName = 'CSS(ScrollView)';

export type TextInputProps = React.ComponentProps<typeof RNTextInput> & { className?: string };
export const TextInput = (props: TextInputProps) => useCssElement(RNTextInput, props, { className: 'style' });
TextInput.displayName = 'CSS(TextInput)';

export type TouchableOpacityProps = React.ComponentProps<typeof RNTouchableOpacity> & { className?: string };
export const TouchableOpacity = (props: TouchableOpacityProps) =>
  useCssElement(RNTouchableOpacity, props, { className: 'style' });
TouchableOpacity.displayName = 'CSS(TouchableOpacity)';
