import { fireEvent, render } from '@testing-library/react-native';
import ListItem from '../components/ListItem';

jest.mock('@expo/vector-icons');

describe('ListItem', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with basic props', () => {
    const { getByText } = render(<ListItem title="Test Item" description="Test Description" details="Test Details" />);
    expect(getByText('Test Item')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
    expect(getByText('Test Details')).toBeTruthy();
  });

  it('renders with status', () => {
    const { getByText } = render(<ListItem title="Test Item" status={{ text: 'Active', style: 'success' }} />);
    expect(getByText('Active')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(<ListItem title="Test Item" onPress={mockOnPress} />);
    fireEvent.press(getByText('Test Item'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders with time information', () => {
    const { getByText } = render(<ListItem title="Test Item" time={{ text: '2:30 PM' }} />);
    expect(getByText('2:30 PM')).toBeTruthy();
  });
});
