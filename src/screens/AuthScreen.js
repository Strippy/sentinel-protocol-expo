import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

const TAB_LOGIN    = 'login';
const TAB_REGISTER = 'register';
const TAB_FORGOT   = 'forgot';

export default function AuthScreen({ navigation }) {
  const { login, register, continueAsGuest, forgotPassword } = useAuth();

  const [tab, setTab]     = useState(TAB_LOGIN);
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forgotSent, setForgotSent] = useState(false);

  const passRef = useRef(null);

  function resetForm() {
    setEmail(''); setPass(''); setConfirm(''); setName(''); setError(null);
  }

  function switchTab(t) { setTab(t); resetForm(); }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      if (tab === TAB_LOGIN) {
        await login(email.trim(), pass);
        navigation.replace('Main');
      } else if (tab === TAB_REGISTER) {
        if (pass !== confirm) throw new Error('Passwords do not match');
        await register(email.trim(), pass, name.trim());
        navigation.replace('Main');
      } else {
        await forgotPassword(email.trim());
        setForgotSent(true);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    await continueAsGuest();
    navigation.replace('Main');
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <Text style={s.logo}>⬡</Text>
        <Text style={s.title}>SENTINEL</Text>
        <Text style={s.subtitle}>P R O T O C O L</Text>

        {/* Tab bar */}
        {tab !== TAB_FORGOT && (
          <View style={s.tabBar}>
            {[TAB_LOGIN, TAB_REGISTER].map(t => (
              <TouchableOpacity
                key={t}
                style={[s.tabItem, tab === t && s.tabItemActive]}
                onPress={() => switchTab(t)}
              >
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t === TAB_LOGIN ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Forgot password heading */}
        {tab === TAB_FORGOT && (
          <View style={s.forgotHeading}>
            <Text style={s.forgotTitle}>RESET PASSWORD</Text>
            <Text style={s.forgotSub}>Enter your email and we will send a reset link</Text>
          </View>
        )}

        {/* Form */}
        {tab === TAB_REGISTER && (
          <View style={s.inputWrap}>
            <Text style={s.inputLabel}>DISPLAY NAME</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        )}

        <View style={s.inputWrap}>
          <Text style={s.inputLabel}>EMAIL</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType={tab === TAB_FORGOT ? 'send' : 'next'}
            onSubmitEditing={() => tab !== TAB_FORGOT && passRef.current?.focus()}
          />
        </View>

        {tab !== TAB_FORGOT && (
          <View style={s.inputWrap}>
            <Text style={s.inputLabel}>PASSWORD</Text>
            <TextInput
              ref={passRef}
              style={s.input}
              value={pass}
              onChangeText={setPass}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              returnKeyType={tab === TAB_REGISTER ? 'next' : 'done'}
              onSubmitEditing={tab === TAB_LOGIN ? handleSubmit : undefined}
            />
          </View>
        )}

        {tab === TAB_REGISTER && (
          <View style={s.inputWrap}>
            <Text style={s.inputLabel}>CONFIRM PASSWORD</Text>
            <TextInput
              style={s.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>
        )}

        {/* Error */}
        {error && <Text style={s.errorText}>{error}</Text>}

        {/* Forgot sent */}
        {forgotSent && (
          <View style={s.sentBanner}>
            <Text style={s.sentText}>
              ✓ Reset link sent — check your inbox
            </Text>
          </View>
        )}

        {/* Submit */}
        {!forgotSent && (
          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={s.btnText}>
                  {tab === TAB_LOGIN ? 'SIGN IN' : tab === TAB_REGISTER ? 'CREATE ACCOUNT' : 'SEND RESET LINK'}
                </Text>
            }
          </TouchableOpacity>
        )}

        {/* Forgot / Back links */}
        <View style={s.linkRow}>
          {tab === TAB_LOGIN && (
            <TouchableOpacity onPress={() => switchTab(TAB_FORGOT)}>
              <Text style={s.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          )}
          {tab === TAB_FORGOT && (
            <TouchableOpacity onPress={() => switchTab(TAB_LOGIN)}>
              <Text style={s.linkText}>← Back to sign in</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>OR</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Social buttons */}
        <TouchableOpacity style={s.socialBtn} activeOpacity={0.8}
          onPress={() => Alert.alert('Google Sign-In', 'Connect a Google account in your device settings to enable this.')}>
          <Text style={s.socialIcon}>G</Text>
          <Text style={s.socialText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.socialBtn, s.appleBtn]} activeOpacity={0.8}
          onPress={() => Alert.alert('Apple Sign-In', 'Connect an Apple ID in your device settings to enable this.')}>
          <Text style={[s.socialIcon, { color: colors.bg }]}>🍎</Text>
          <Text style={[s.socialText, { color: colors.bg }]}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* Guest */}
        <TouchableOpacity style={s.guestBtn} onPress={handleGuest} activeOpacity={0.7}>
          <Text style={s.guestText}>Continue as Guest</Text>
        </TouchableOpacity>

        <Text style={s.footer}>ZERO LOGS · ZERO TRACKING · YOUR YIELD</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  content:       { paddingHorizontal: 24, paddingTop: 70, paddingBottom: 50, alignItems: 'center' },
  logo:          { fontSize: 50, color: colors.pink },
  title:         { color: colors.white, fontSize: 26, fontWeight: 'bold',
                   letterSpacing: 6, fontFamily: 'monospace', marginTop: 8 },
  subtitle:      { color: colors.pink, fontSize: 11, letterSpacing: 6,
                   marginBottom: 36, fontFamily: 'monospace' },

  tabBar:        { flexDirection: 'row', backgroundColor: colors.panel, borderRadius: 12,
                   borderWidth: 1, borderColor: colors.border, width: '100%', marginBottom: 24, overflow: 'hidden' },
  tabItem:       { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabItemActive: { backgroundColor: colors.pink },
  tabText:       { color: colors.textMuted, fontSize: 10, fontWeight: 'bold',
                   letterSpacing: 2, fontFamily: 'monospace' },
  tabTextActive: { color: colors.bg },

  forgotHeading: { width: '100%', marginBottom: 20 },
  forgotTitle:   { color: colors.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 3, fontFamily: 'monospace' },
  forgotSub:     { color: colors.textMuted, fontSize: 12, marginTop: 6 },

  inputWrap:     { width: '100%', marginBottom: 16 },
  inputLabel:    { color: colors.textMuted, fontSize: 9, letterSpacing: 3,
                   fontFamily: 'monospace', marginBottom: 6 },
  input:         { backgroundColor: colors.panel, borderRadius: 10, borderWidth: 1,
                   borderColor: colors.border, color: colors.white, fontSize: 15,
                   paddingHorizontal: 16, paddingVertical: 13 },

  errorText:     { color: '#FF6B6B', fontSize: 12, marginBottom: 12, textAlign: 'center', width: '100%' },
  sentBanner:    { backgroundColor: 'rgba(0,230,118,0.1)', borderRadius: 10, padding: 14,
                   borderWidth: 1, borderColor: colors.green, width: '100%', marginBottom: 16 },
  sentText:      { color: colors.green, fontSize: 13, textAlign: 'center' },

  btn:           { backgroundColor: colors.pink, borderRadius: 12, paddingVertical: 15,
                   width: '100%', alignItems: 'center', marginBottom: 10 },
  btnText:       { color: colors.bg, fontWeight: 'bold', fontSize: 12, letterSpacing: 3, fontFamily: 'monospace' },

  linkRow:       { width: '100%', alignItems: 'flex-end', marginBottom: 20, marginTop: 2 },
  linkText:      { color: colors.pink, fontSize: 12 },

  dividerRow:    { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 },
  dividerLine:   { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText:   { color: colors.textMuted, fontSize: 11, marginHorizontal: 12, fontFamily: 'monospace' },

  socialBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   backgroundColor: colors.panel, borderRadius: 12, borderWidth: 1,
                   borderColor: colors.border, paddingVertical: 13, width: '100%', marginBottom: 10 },
  appleBtn:      { backgroundColor: colors.white, borderColor: colors.white },
  socialIcon:    { color: colors.white, fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  socialText:    { color: colors.white, fontSize: 14, fontWeight: '600' },

  guestBtn:      { paddingVertical: 14, marginTop: 4 },
  guestText:     { color: colors.textMuted, fontSize: 13, textDecorationLine: 'underline' },

  footer:        { color: colors.textMuted, fontSize: 9, letterSpacing: 3,
                   fontFamily: 'monospace', marginTop: 28 },
});
