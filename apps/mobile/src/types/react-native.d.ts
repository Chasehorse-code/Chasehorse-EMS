import * as React from 'react';

declare module 'react-native' {
  export interface ViewProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export interface TextProps {
    style?: any;
    numberOfLines?: number;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export interface TouchableOpacityProps {
    style?: any;
    onPress?: () => void;
    children?: React.ReactNode;
    activeOpacity?: number;
    disabled?: boolean;
    [key: string]: any;
  }
  export interface ScrollViewProps {
    style?: any;
    contentContainerStyle?: any;
    refreshControl?: React.ReactNode;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export interface TextInputProps {
    style?: any;
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    keyboardType?: any;
    autoCapitalize?: any;
    multiline?: boolean;
    numberOfLines?: number;
    [key: string]: any;
  }
  export interface ModalProps {
    visible?: boolean;
    animationType?: 'none' | 'slide' | 'fade';
    transparent?: boolean;
    onRequestClose?: () => void;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
    style?: any;
    [key: string]: any;
  }
  export interface RefreshControlProps {
    refreshing: boolean;
    onRefresh?: () => void;
    tintColor?: string;
    colors?: string[];
    [key: string]: any;
  }
  export interface ImageProps {
    source: any;
    style?: any;
    resizeMode?: any;
    [key: string]: any;
  }

  export interface SafeAreaViewProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export interface KeyboardAvoidingViewProps {
    behavior?: 'height' | 'position' | 'padding';
    keyboardVerticalOffset?: number;
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export interface StatusBarProps {
    barStyle?: 'default' | 'light-content' | 'dark-content';
    backgroundColor?: string;
    hidden?: boolean;
    translucent?: boolean;
    [key: string]: any;
  }

  export const View: React.ComponentType<ViewProps>;
  export const Text: React.ComponentType<TextProps>;
  export const TouchableOpacity: React.ComponentType<TouchableOpacityProps>;
  export const ScrollView: React.ComponentType<ScrollViewProps>;
  export const TextInput: React.ComponentType<TextInputProps>;
  export const Modal: React.ComponentType<ModalProps>;
  export const ActivityIndicator: React.ComponentType<ActivityIndicatorProps>;
  export const RefreshControl: React.ComponentType<RefreshControlProps>;
  export const Image: React.ComponentType<ImageProps>;
  export const SafeAreaView: React.ComponentType<SafeAreaViewProps>;
  export const KeyboardAvoidingView: React.ComponentType<KeyboardAvoidingViewProps>;
  export const StatusBar: React.ComponentType<StatusBarProps> & { currentHeight?: number };
}
