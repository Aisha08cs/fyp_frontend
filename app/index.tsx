import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const styles = StyleSheet.create({
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center' as const,
  },
  menuItemText: {
    marginLeft: 16,
    marginRight: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});

const Index = () => {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/safezone')}>
      <View style={styles.menuItemContent}>
        <Ionicons name="location-outline" size={24} color="#0097B2" />
        <Text style={styles.menuItemText}>Safe Zones</Text>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </View>
    </TouchableOpacity>
  );
};

export default Index;
