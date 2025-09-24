import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 24,
  },
  subtitleWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  emailCaption: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  centerBlock: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  helperText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#ffffff',
  },
  error: {
    color: '#dc3545',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  resendWrap: {
    marginTop: 28,
    alignItems: 'center',
  },
  resendCaption: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 6,
  },
  resendLink: {
    color: '#0d6efd',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  bottomArea: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});