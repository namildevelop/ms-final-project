import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
  },
  checkboxContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  checkboxText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  linkText: {
    color: '#2563EB',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  signupButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  signupButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
});

