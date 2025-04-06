import DateTimePicker from '@react-native-community/datetimepicker';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { User } from '../models/User';

export default function SignUpScreen() {
  const { onRegister } = useAuth();
  const [formData, setFormData] = useState<User>({
    userType: 'patient',
    firstName: '',
    lastName: '',
    gender: 'male',
    birthday: '',
    email: '',
    password: '',
  });
  const [uniqueCode, setUniqueCode] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    email: '',
    password: '',
    uniqueCode: '',
  });
  const [showErrors, setShowErrors] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      birthday: '',
      email: '',
      password: '',
      uniqueCode: '',
    };
    let isValid = true;

    // First Name validation
    if (formData.firstName.includes(' ')) {
      newErrors.firstName = 'First name cannot contain spaces';
      isValid = false;
    }
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    // Last Name validation
    if (formData.lastName.includes(' ')) {
      newErrors.lastName = 'Last name cannot contain spaces';
      isValid = false;
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    // Birthday validation
    if (!formData.birthday) {
      newErrors.birthday = 'Please select your birthday';
      isValid = false;
    } else {
      const birthdayDate = new Date(formData.birthday);
      const today = new Date();
      if (birthdayDate >= today) {
        newErrors.birthday = 'Birthday must be in the past';
        isValid = false;
      }
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    const lengthRegex = /.{8,}/;
    const lowercaseRegex = /[a-z]/;
    const uppercaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;

    const isLengthValid = lengthRegex.test(formData.password);
    const isLowercaseValid = lowercaseRegex.test(formData.password);
    const isUppercaseValid = uppercaseRegex.test(formData.password);
    const isNumberValid = numberRegex.test(formData.password);

    if (!isLengthValid || !isLowercaseValid || !isUppercaseValid || !isNumberValid) {
      newErrors.password = 'Password must be at least 8 characters and contain lowercase, uppercase, and numbers';
      isValid = false;
    }

    // Unique Code validation for caregivers
    if (formData.userType === 'caregiver') {
      if (!uniqueCode) {
        newErrors.uniqueCode = 'Unique code is required for caregivers';
        isValid = false;
      } else if (!/^\d+$/.test(uniqueCode)) {
        newErrors.uniqueCode = 'Unique code must be a number';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async () => {
    if (isLoading) return;

    setShowErrors(true);
    setApiError('');

    if (validateForm()) {
      try {
        setIsLoading(true);
        const registrationData = {
          ...formData,
          ...(formData.userType === 'caregiver' && { uniqueCode: parseInt(uniqueCode) }),
        };
        await onRegister?.(registrationData);
      } catch (err: any) {
        setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleConfirm = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setFormData({
      ...formData,
      birthday: currentDate.toISOString().split('T')[0],
    });
  };

  const ErrorMessage = ({ message }: { message: string }) =>
    message && showErrors ? <Text style={styles.errorText}>{message}</Text> : null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create an account</Text>
        <Text style={styles.subtitle}>Welcome! Please enter your details.</Text>

        <Text style={styles.label}>Account Type</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={[styles.radioButton, formData.userType === 'patient' && styles.radioButtonSelected]}
            onPress={() => setFormData({ ...formData, userType: 'patient' })}
          >
            <Text style={[styles.radioText, formData.userType === 'patient' && styles.radioTextSelected]}>Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, formData.userType === 'caregiver' && styles.radioButtonSelected]}
            onPress={() => setFormData({ ...formData, userType: 'caregiver' })}
          >
            <Text style={[styles.radioText, formData.userType === 'caregiver' && styles.radioTextSelected]}>
              Caregiver
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={[styles.input, showErrors && errors.firstName && styles.inputError]}
          placeholder="First Name"
          placeholderTextColor="#000"
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          testID="firstName-input"
        />
        <ErrorMessage message={errors.firstName} />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={[styles.input, showErrors && errors.lastName && styles.inputError]}
          placeholder="Last Name"
          placeholderTextColor="#000"
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          testID="lastName-input"
        />
        <ErrorMessage message={errors.lastName} />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={[styles.radioButton, formData.gender === 'male' && styles.radioButtonSelected]}
            onPress={() => setFormData({ ...formData, gender: 'male' })}
          >
            <Text style={[styles.radioText, formData.gender === 'male' && styles.radioTextSelected]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, formData.gender === 'female' && styles.radioButtonSelected]}
            onPress={() => setFormData({ ...formData, gender: 'female' })}
          >
            <Text style={[styles.radioText, formData.gender === 'female' && styles.radioTextSelected]}>Female</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Birthday</Text>
        {Platform.OS === 'ios' ? (
          <TextInput
            style={[styles.input, showErrors && errors.birthday && styles.inputError]}
            placeholder="Select Birthday"
            value={formData.birthday}
            editable={false}
            placeholderTextColor="#000"
            testID="birthday-input"
            onPress={() => setShowDatePicker(!showDatePicker)}
          />
        ) : (
          <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)}>
            <TextInput
              style={[styles.input, showErrors && errors.birthday && styles.inputError]}
              placeholder="Select Birthday"
              value={formData.birthday}
              editable={false}
              placeholderTextColor="#000"
              testID="birthday-input"
            />
          </TouchableOpacity>
        )}
        <ErrorMessage message={errors.birthday} />
        {showDatePicker && (
          <DateTimePicker
            testID="datePicker"
            textColor="#000"
            value={formData.birthday ? new Date(formData.birthday) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleConfirm}
            maximumDate={new Date()}
          />
        )}

        <Text
          testID="test-mode"
          style={styles.testMode}
          onPress={() => {
            setFormData({
              ...formData,
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              password: 'Password123!',
              userType: 'patient',
              birthday: '1990-01-01',
            });
          }}
        ></Text>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.input, showErrors && errors.email && styles.inputError]}
          placeholder="Enter email address"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          placeholderTextColor="#000"
          autoCapitalize="none"
          testID="email-input"
        />
        <ErrorMessage message={errors.email} />

        <Text style={styles.label}>Create Password</Text>
        <TextInput
          style={[styles.input, showErrors && errors.password && styles.inputError]}
          placeholder="Enter your password"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
          placeholderTextColor="#000"
          testID="password-input"
        />
        <ErrorMessage message={errors.password} />

        {formData.userType === 'caregiver' && (
          <>
            <Text style={styles.label}>Patient's Unique Code</Text>
            <TextInput
              style={[styles.input, showErrors && errors.uniqueCode && styles.inputError]}
              placeholder="Enter patient's unique code"
              value={uniqueCode}
              onChangeText={(text) => setUniqueCode(text)}
              keyboardType="number-pad"
              placeholderTextColor="#000"
            />
            <ErrorMessage message={errors.uniqueCode} />
          </>
        )}

        {apiError ? <Text style={styles.apiErrorText}>{apiError}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
        </TouchableOpacity>

        <Text style={styles.footer}>
          Already have an account?{' '}
          <Link href="/login/login" style={styles.link}>
            Sign In
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  button: {
    backgroundColor: '#0097B2',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 16,
  },
  link: {
    color: '#0097B2',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: 'red',
    marginTop: -10,
    marginBottom: 15,
    fontSize: 14,
  },
  apiErrorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  testMode: {
    position: 'absolute',
    opacity: 0,
  },
  radioButton: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  radioButtonSelected: {
    backgroundColor: '#0097B2',
    borderColor: '#0097B2',
  },
  radioText: {
    fontSize: 16,
    color: '#000',
  },
  radioTextSelected: {
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
