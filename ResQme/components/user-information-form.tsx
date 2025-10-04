import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { userInformationService } from '@/lib/services';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

interface UserInformationFormProps {
  onComplete: () => void;
}

export default function UserInformationForm({ onComplete }: UserInformationFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    dob: '',
    gender: 'male' as 'male' | 'female' | 'other',
    blood_group: 'A+' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
    disability: '',
    special_needs: '',
    weight: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { dob, gender, blood_group, weight } = formData;

    if (!dob.trim()) {
      Alert.alert('Error', 'Please enter your date of birth');
      return false;
    }

    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return false;
    }

    if (!blood_group) {
      Alert.alert('Error', 'Please select your blood group');
      return false;
    }

    if (weight && isNaN(Number(weight))) {
      Alert.alert('Error', 'Please enter a valid weight');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setIsLoading(true);

    try {
      const { data, error } = await userInformationService.createUserInformation({
        user_id: user.id,
        dob: new Date(formData.dob),
        gender: formData.gender,
        blood_group: formData.blood_group,
        disability: formData.disability || undefined,
        special_needs: formData.special_needs || undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
      });

      if (error) {
        Alert.alert('Error', (error as Error).message || 'Failed to save information');
      } else {
        Alert.alert('Success', 'Your information has been saved successfully!');
        onComplete();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText style={styles.title}>
              Complete Your Profile
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Help us provide better emergency assistance by sharing your information
            </ThemedText>
          </ThemedView>

          {/* Form */}
          <ThemedView style={styles.form}>
            {/* Date of Birth */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Date of Birth *</ThemedText>
              <TextInput
                value={formData.dob}
                onChangeText={(value) => handleInputChange('dob', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </ThemedView>

            {/* Gender */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Gender *</ThemedText>
              <ThemedView style={styles.radioContainer}>
                {['male', 'female', 'other'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.radioOption}
                    onPress={() => handleInputChange('gender', option)}
                  >
                    <ThemedView style={[
                      styles.radioCircle,
                      formData.gender === option && styles.radioCircleSelected
                    ]}>
                      {formData.gender === option && <ThemedView style={styles.radioInner} />}
                    </ThemedView>
                    <ThemedText style={styles.radioLabel}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>

            {/* Blood Group */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Blood Group *</ThemedText>
              <ThemedView style={styles.radioContainer}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.radioOption}
                    onPress={() => handleInputChange('blood_group', option)}
                  >
                    <ThemedView style={[
                      styles.radioCircle,
                      formData.blood_group === option && styles.radioCircleSelected
                    ]}>
                      {formData.blood_group === option && <ThemedView style={styles.radioInner} />}
                    </ThemedView>
                    <ThemedText style={styles.radioLabel}>{option}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>

            {/* Weight */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Weight (kg)</ThemedText>
              <TextInput
                value={formData.weight}
                onChangeText={(value) => handleInputChange('weight', value)}
                placeholder="Enter your weight"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                style={styles.input}
              />
            </ThemedView>

            {/* Disability */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Disability (if any)</ThemedText>
              <TextInput
                value={formData.disability}
                onChangeText={(value) => handleInputChange('disability', value)}
                placeholder="Describe any disabilities"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                multiline
                numberOfLines={3}
              />
            </ThemedView>

            {/* Special Needs */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Special Needs</ThemedText>
              <TextInput
                value={formData.special_needs}
                onChangeText={(value) => handleInputChange('special_needs', value)}
                placeholder="Any special medical needs or requirements"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                multiline
                numberOfLines={3}
              />
            </ThemedView>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            >
              <ThemedText style={styles.submitButtonText}>
                {isLoading ? 'Saving...' : 'Complete Profile'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  radioLabel: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
});
