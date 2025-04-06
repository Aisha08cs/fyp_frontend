import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { Caregiver, Patient } from '../models/User';
import apiClient from '../utils/apiClient';

export default function Settings() {
  const auth = useAuth();
  const user = auth.user as Patient | Caregiver | null;
  const { onLogout, onUserDetail } = auth;
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    birthday: user?.birthday || '',
    gender: user?.gender || 'male',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
        exif: false,
      });

      if (!result.canceled && onUserDetail) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        const base64Size = base64Image.length * 0.75;
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (base64Size > maxSize) {
          // Try with lower quality if image is too large
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3,
            base64: true,
            exif: false,
          });

          if (!result.canceled) {
            const retryBase64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            const retryBase64Size = retryBase64Image.length * 0.75;

            if (retryBase64Size > maxSize) {
              Alert.alert(
                'Image Too Large',
                'Please select an image smaller than 5MB. Try selecting a smaller image or one with lower resolution.',
                [{ text: 'OK' }],
              );
              return;
            }

            const response = await apiClient.post(
              '/users/me/profile-image',
              {
                image: retryBase64Image,
              },
              {
                timeout: 60000,
              },
            );

            if (response.data.status === 'ok') {
              await onUserDetail();
              Alert.alert('Success', 'Profile image updated successfully');
            }
          }
        } else {
          const response = await apiClient.post(
            '/users/me/profile-image',
            {
              image: base64Image,
            },
            {
              timeout: 60000,
            },
          );

          if (response.data.status === 'ok') {
            await onUserDetail();
            Alert.alert('Success', 'Profile image updated successfully');
          }
        }
      }
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      let errorMessage = 'Failed to upload profile image';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Please try again with a smaller image.';
      } else if (error.response?.status === 413) {
        errorMessage = 'Image file is too large. Please select a smaller image.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setProfileData({
      ...profileData,
      birthday: currentDate.toISOString().split('T')[0],
    });
  };

  const handleSave = async () => {
    try {
      const response = await apiClient.put('/users/me', profileData);
      if (response.data.status === 'ok') {
        if (onUserDetail) {
          await onUserDetail();
          setIsEditing(false);
          Alert.alert('Success', 'Profile updated successfully');
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
        router.replace('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isPatient = (user: Patient | Caregiver | null): user is Patient => {
    return user?.userType === 'patient';
  };

  const getFullName = (user: Patient | Caregiver | null) => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? 'save' : 'create-outline'} size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={40} color={Colors.gray} />
              </View>
            )}
            <View style={styles.editImageBadge}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{getFullName(user)}</Text>
          <Text style={styles.userType}>
            {user?.userType?.charAt(0).toUpperCase()}
            {user?.userType?.slice(1)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.label}>First Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profileData.firstName}
                onChangeText={(text) => setProfileData({ ...profileData, firstName: text })}
                placeholder="Enter first name"
              />
            ) : (
              <Text style={styles.value}>{profileData.firstName}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Last Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profileData.lastName}
                onChangeText={(text) => setProfileData({ ...profileData, lastName: text })}
                placeholder="Enter last name"
              />
            ) : (
              <Text style={styles.value}>{profileData.lastName}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profileData.email}
                onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.value}>{profileData.email}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Birthday</Text>
            {isEditing ? (
              Platform.OS === 'ios' ? (
                <TextInput
                  style={styles.input}
                  value={profileData.birthday}
                  editable={false}
                  placeholder="Select Birthday"
                  placeholderTextColor={Colors.gray}
                  onPress={() => setShowDatePicker(!showDatePicker)}
                />
              ) : (
                <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)}>
                  <TextInput
                    style={styles.input}
                    value={profileData.birthday}
                    editable={false}
                    placeholder="Select Birthday"
                    placeholderTextColor={Colors.gray}
                  />
                </TouchableOpacity>
              )
            ) : (
              <Text style={styles.value}>{profileData.birthday}</Text>
            )}
            {showDatePicker && (
              <DateTimePicker
                testID="datePicker"
                value={profileData.birthday ? new Date(profileData.birthday) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleConfirm}
                textColor="#000"
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Gender</Text>
            {isEditing ? (
              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={[styles.radioButton, profileData.gender === 'male' && styles.radioButtonSelected]}
                  onPress={() => setProfileData({ ...profileData, gender: 'male' })}
                >
                  <Text style={[styles.radioText, profileData.gender === 'male' && styles.radioTextSelected]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, profileData.gender === 'female' && styles.radioButtonSelected]}
                  onPress={() => setProfileData({ ...profileData, gender: 'female' })}
                >
                  <Text style={[styles.radioText, profileData.gender === 'female' && styles.radioTextSelected]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.value}>{profileData.gender}</Text>
            )}
          </View>
        </View>

        {!isEditing && (
          <>
            {user && isPatient(user) && user.caregiverEmail && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Assigned Caregiver</Text>
                <View style={styles.assignedUserContainer}>
                  <View style={styles.assignedUserImage}>
                    <Ionicons name="person" size={24} color={Colors.gray} />
                  </View>
                  <View style={styles.assignedUserInfo}>
                    <Text style={styles.assignedUserLabel}>Email</Text>
                    <Text style={styles.assignedUserValue}>{user.caregiverEmail}</Text>
                  </View>
                </View>
              </View>
            )}
            {user && isPatient(user) && !user.caregiverEmail && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Caregiver Connection</Text>
                <View style={styles.codeContainer}>
                  <Text style={styles.codeTitle}>Share this code with your caregiver to connect</Text>
                  <View style={styles.codeBoxes}>
                    {user.uniqueCode
                      .toString()
                      .split('')
                      .map((digit: string, index: number) => (
                        <View key={index} style={styles.codeBox}>
                          <Text style={styles.codeDigit}>{digit}</Text>
                        </View>
                      ))}
                  </View>
                </View>
              </View>
            )}
            {user && !isPatient(user) && user.patientEmail && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Assigned Patient</Text>
                <View style={styles.assignedUserContainer}>
                  <View style={styles.assignedUserImage}>
                    <Ionicons name="person" size={24} color={Colors.gray} />
                  </View>
                  <View style={styles.assignedUserInfo}>
                    <Text style={styles.assignedUserLabel}>Email</Text>
                    <Text style={styles.assignedUserValue}>{user.patientEmail}</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {isEditing && (
          <Button
            title="Save Changes"
            onPress={handleSave}
            style={styles.saveButton}
            textStyle={styles.saveButtonText}
          />
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userType: {
    fontSize: 16,
    color: Colors.gray,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: Colors.text,
  },
  input: {
    fontSize: 16,
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingVertical: 8,
  },
  caregiverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light,
    padding: 12,
    borderRadius: 8,
  },
  caregiverImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  caregiverDetails: {
    flex: 1,
  },
  caregiverName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  caregiverEmail: {
    fontSize: 14,
    color: Colors.gray,
  },
  noCaregiverText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    padding: 12,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radioText: {
    fontSize: 16,
    color: Colors.text,
  },
  radioTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  codeContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  codeTitle: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 12,
    textAlign: 'center',
  },
  codeBoxes: {
    flexDirection: 'row',
    gap: 8,
  },
  codeBox: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  codeDigit: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  assignedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light,
    padding: 12,
    borderRadius: 8,
  },
  assignedUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignedUserInfo: {
    flex: 1,
  },
  assignedUserLabel: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 2,
  },
  assignedUserValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});
