import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navyDeep} />

      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>IB</Text>
        </View>
        <Text style={styles.appName}>InnerBrother</Text>
        <Text style={styles.tagline}>You don't have to carry{'\n'}this alone.</Text>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}
          accessibilityLabel="Get started with InnerBrother"
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.oauthButton}
          onPress={() => navigation.navigate('OAuthLogin', { provider: 'apple' })}
        >
          <Text style={styles.oauthButtonText}>🍎  Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.oauthButton}
          onPress={() => navigation.navigate('OAuthLogin', { provider: 'google' })}
        >
          <Text style={styles.oauthButtonText}>G  Continue with Google</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        By continuing, you agree to our{' '}
        <Text style={styles.link}>Terms of Service</Text> and{' '}
        <Text style={styles.link}>Privacy Policy</Text>.{'\n'}
        InnerBrother is a wellbeing support tool, not a substitute for professional care.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navyDeep,
    paddingHorizontal: Spacing['3xl'],
    justifyContent: 'space-between',
    paddingBottom: Spacing['3xl'],
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['6xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  logoText: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '800',
    color: Colors.textOnDark,
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.textOnDark,
    letterSpacing: 1,
    marginBottom: Spacing.xl,
  },
  tagline: {
    fontSize: Typography.fontSize.xl,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 30,
  },
  buttonSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    backgroundColor: Colors.tealSoft,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textOnDark,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.4)',
  },
  oauthButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  oauthButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textOnDark,
  },
  disclaimer: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    textDecorationLine: 'underline',
    color: 'rgba(255,255,255,0.5)',
  },
});
