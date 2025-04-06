import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import SignUpScreen from '../app/login/signup';

const mockOnRegister = jest.fn();
jest.mock('../app/context/AuthContext', () => ({
  useAuth: () => ({
    onRegister: mockOnRegister,
  }),
}));

jest.mock('react-native-modal-datetime-picker', () => {
  return {
    __esModule: true,
    default: ({ onConfirm, isVisible }: { onConfirm: (date: Date) => void; isVisible: boolean }) => {
      if (isVisible) {
        onConfirm(new Date('1990-01-01'));
      }
      return null;
    },
  };
});

describe('SignUpScreen', () => {
  const mockPatientData = {
    userType: 'patient',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'Password123!',
    gender: 'male',
    birthday: '1990-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call onRegister when submitting the signup form', async () => {
    mockOnRegister.mockResolvedValueOnce({ status: 'ok', message: 'Patient User Created' });

    const { getByTestId, getByText } = render(<SignUpScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('test-mode'));
    });

    const birthdayInput = getByTestId('birthday-input');
    await act(async () => {
      fireEvent.press(birthdayInput);
    });

    await waitFor(() => {
      expect(getByTestId('birthday-input').props.value).toBe('1990-01-01');
    });

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    await waitFor(() => {
      expect(mockOnRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          userType: 'patient',
          firstName: mockPatientData.firstName,
          lastName: mockPatientData.lastName,
          email: mockPatientData.email,
          password: mockPatientData.password,
          gender: mockPatientData.gender,
          birthday: mockPatientData.birthday,
        }),
      );
    });
  });
});
