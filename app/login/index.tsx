import { Link } from 'expo-router';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const LOGO_WIDTH = width * 0.3;

export default function LandingScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>EverydayEase</Text>
        <Text style={styles.subtitle}>Empowering lives, one task at a time!</Text>

        <Image source={require('../../assets/images/EverdayEaseLogo.png')} style={styles.logo} resizeMode="contain" />

        <View style={styles.buttonContainer}>
          <Link href="/login/signup" asChild>
            <TouchableOpacity style={styles.signUpButton}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/login/login" asChild>
            <TouchableOpacity style={styles.loginButton}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH,
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
  },
  signUpButton: {
    backgroundColor: '#0097B2',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0097B2',
  },
  loginText: {
    color: '#0097B2',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
