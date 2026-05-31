import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, TextInput, StyleProp, ViewStyle, TextInputProps } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../styles/Theme';
import { AlertIcon } from '../assets/Icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'green' | 'rose' | 'sky';
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ComponentType<{ color: string; size: number }>;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, type = 'primary', full = false, style, icon: Icon }) => {
  const iconColor = (type === 'primary' || type === 'green' || type === 'sky')
    ? '#fff' 
    : (COLORS[type as keyof typeof COLORS] as string) || COLORS.g1;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.btn,
        type === 'primary' && styles.bprim,
        type === 'secondary' && styles.bsec,
        type === 'green' && styles.bgreen,
        type === 'rose' && styles.brose,
        type === 'sky' && styles.bsky,
        full && styles.bfull,
        style,
      ]}
      onPress={onPress}
    >
      {Icon && (
        <View style={styles.btnIcon}>
          <Icon color={iconColor} size={16} />
        </View>
      )}
      <Text style={[
        styles.btnText,
        (type === 'primary' || type === 'green' || type === 'sky') && { color: '#fff' },
        type === 'rose' && { color: COLORS.rose },
        type === 'secondary' && { color: COLORS.g1 },
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

interface InputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  type?: 'text' | 'password';
  error?: string | null;
  readonly?: boolean;
  noPadding?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  type = 'text', 
  error, 
  readonly, 
  noPadding, 
  ...props 
}) => {
  return (
    <View style={[styles.fg, noPadding && { marginBottom: 0 }]}>
      {label && <Text style={styles.flabel}>{label}</Text>}
      <TextInput
        style={[
          styles.finput,
          !!error && styles.finputErr,
          readonly && styles.finputReadonly,
          noPadding && { paddingVertical: 5, paddingHorizontal: 5 }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={type === 'password'}
        editable={!readonly}
        placeholderTextColor={COLORS.g4}
        {...props}
      />
      {!!error && (
        <View style={styles.errContainer}>
          <AlertIcon size={12} color={COLORS.rose} strokeWidth={2.5} style={{ marginTop: 1 }} />
          <Text style={styles.etxt}>{error}</Text>
        </View>
      )}
    </View>
  );
};

interface BadgeProps {
  label: string;
  type?: 'pr' | 'gray' | 'rose' | 'amber' | 'sky';
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'pr' }) => {
  const badgeStyle = styles[`bdg-${type}` as keyof typeof styles] || styles[`bdg-gray` as keyof typeof styles];
  const textColor = (badgeStyle as any)?.color || COLORS.g3;

  return (
    <View style={[styles.bdg, badgeStyle]}>
      <Text style={[styles.bdgText, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SIZES.rsm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bprim: {
    backgroundColor: COLORS.pr,
    ...SHADOWS.sh2,
  },
  bsec: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.g5,
  },
  bgreen: {
    backgroundColor: COLORS.pr, // Matching original layout where bgreen = COLORS.pr
    ...SHADOWS.sh2,
  },
  brose: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.rose,
  },
  bsky: {
    backgroundColor: COLORS.sky,
  },
  bfull: {
    width: '100%',
  },
  btnIcon: {},
  btnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  fg: {
    marginBottom: 12,
  },
  flabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.g2,
    marginBottom: 5,
  },
  finput: {
    borderWidth: 1.5,
    borderColor: COLORS.g5,
    borderRadius: SIZES.rsm,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontSize: 14,
    color: COLORS.g1,
    backgroundColor: COLORS.g6,
  },
  finputErr: {
    borderColor: COLORS.rose,
    backgroundColor: COLORS['rose-l'],
  },
  finputReadonly: {
    backgroundColor: '#eee',
    color: COLORS.g4,
  },
  errContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  etxt: {
    fontSize: 12,
    color: COLORS.rose,
    fontWeight: '700',
  },
  bdg: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bdgText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  'bdg-pr': { backgroundColor: COLORS['pr-l'], color: COLORS['pr-d'] },
  'bdg-gray': { backgroundColor: COLORS.g6, color: COLORS.g3 },
  'bdg-rose': { backgroundColor: COLORS['rose-l'], color: COLORS.rose },
  'bdg-amber': { backgroundColor: COLORS['amber-l'], color: COLORS.amber },
  'bdg-sky': { backgroundColor: COLORS['sky-l'], color: COLORS.sky },
});
