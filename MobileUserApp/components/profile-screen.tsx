import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { UserInformationData, userInformationService } from '@/lib/services';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInformationData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    dob: '',
    gender: 'male' as 'male' | 'female' | 'other',
    blood_group: 'A+' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
    disability: '',
    special_needs: '',
    weight: '',
  });

  useEffect(() => {
    loadUserInformation();
  }, [user]);

  const loadUserInformation = async () => {
    if (!user) return;

    try {
      const { data, error } = await userInformationService.getUserInformationByUserId(user.id);
      if (error) {
        console.error('Error loading user information:', error);
        return;
      }
      
      if (data) {
        setUserInfo(data);
        setFormData({
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
          gender: data.gender,
          blood_group: data.blood_group,
          disability: data.disability || '',
          special_needs: data.special_needs || '',
          weight: data.weight ? data.weight.toString() : '',
        });
      }
    } catch (error) {
      console.error('Error loading user information:', error);
    }
  };

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

  const handleSave = async () => {
    if (!validateForm() || !userInfo) return;

    setIsLoading(true);

    try {
      const { data, error } = await userInformationService.updateUserInformation(userInfo.id!, {
        user_id: user!.id,
        dob: new Date(formData.dob),
        gender: formData.gender,
        blood_group: formData.blood_group,
        disability: formData.disability || undefined,
        special_needs: formData.special_needs || undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
      });

      if (error) {
        Alert.alert('Error', (error as Error).message || 'Failed to update information');
      } else {
        Alert.alert('Success', 'Your information has been updated successfully!');
        setUserInfo(data);
        setIsEditing(false);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  if (!userInfo) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.noDataContainer}>
          <ThemedText style={styles.noDataTitle}>No Profile Information</ThemedText>
          <ThemedText style={styles.noDataText}>
            You haven't completed your profile yet. Please go back and complete the profile form first.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText style={styles.title}>Profile</ThemedText>
            <ThemedText style={styles.subtitle}>
              {user?.email}
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
                editable={isEditing}
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
                    onPress={() => isEditing && handleInputChange('gender', option)}
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
                    onPress={() => isEditing && handleInputChange('blood_group', option)}
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
                editable={isEditing}
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
                editable={isEditing}
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
                editable={isEditing}
              />
            </ThemedView>

            {/* Action Buttons */}
            <ThemedView style={styles.buttonContainer}>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isLoading}
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                  >
                    <ThemedText style={styles.saveButtonText}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditing(false);
                      loadUserInformation(); // Reset form
                    }}
                    style={styles.cancelButton}
                  >
                    <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                >
                  <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
                </TouchableOpacity>
              )}
            </ThemedView>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
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
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noDataTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  noDataText: {
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
    gap: 8
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
  buttonContainer: {
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
});
