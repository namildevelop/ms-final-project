import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  inner: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 46,
  },
  form: {
    width: '100%',
    marginBottom: 12,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: '#ffffff',
    marginBottom: 10,
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 11,
    marginBottom: 10,
    paddingHorizontal: 2,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  loginButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: 12,
    marginBottom: 28,
  },
  forgotPasswordText: {
    color: '#6b7280',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  emailSignupButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  emailSignupText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  googleLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
  },
  googleIcon: {
    backgroundColor: '#4285f4',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  googleIconText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleLoginText: {
    color: '#111827',
    fontSize: 15,
  },
});

