import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

type StatusStyle = 'success' | 'warning' | 'error';
type IconName = keyof typeof Ionicons.glyphMap;

interface ListItemProps {
  title: string;
  description?: string;
  details?: string;
  status?: {
    text: string;
    style?: StatusStyle;
  };
  time?: {
    icon?: IconName;
    text: string;
  };
  notification?: {
    icon?: IconName;
    text: string;
    color?: string;
  };
  verification?: {
    icon?: IconName;
    text: string;
    color?: string;
  };
  onPress?: () => void;
  actionButtons?: Array<{
    icon: IconName;
    color: string;
    onPress: () => void;
    disabled?: boolean;
  }>;
}

const ListItem: React.FC<ListItemProps> = ({
  title,
  description,
  details,
  status,
  time,
  notification,
  verification,
  onPress,
  actionButtons,
}) => {
  const getStatusStyle = (style?: StatusStyle): StyleProp<ViewStyle> => {
    switch (style) {
      case 'success':
        return styles.statussuccess;
      case 'warning':
        return styles.statuswarning;
      case 'error':
        return styles.statuserror;
      default:
        return styles.statussuccess;
    }
  };

  const getStatusTextStyle = (style?: StatusStyle): StyleProp<TextStyle>[] => {
    const textStyles: StyleProp<TextStyle>[] = [styles.statusText];
    if (style === 'error') textStyles.push(styles.statusTextError);
    if (style === 'warning') textStyles.push(styles.statusTextWarning);
    return textStyles;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.content} onPress={onPress}>
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.headerRight}>
              {status && (
                <View style={[styles.statusBadge, getStatusStyle(status.style)]}>
                  <Text style={getStatusTextStyle(status.style)}>{status.text}</Text>
                </View>
              )}
              {actionButtons && (
                <View style={styles.actionButtons}>
                  {actionButtons.map((button, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={button.onPress}
                      style={[styles.actionButton, button.disabled && styles.disabledButton]}
                    >
                      <Ionicons name={button.icon} size={20} color={button.disabled ? '#999' : button.color} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
          {details && <Text style={styles.details}>{details}</Text>}
          <View style={styles.metaContainer}>
            {time && (
              <View style={styles.metaItem}>
                <Ionicons name={time.icon || 'time-outline'} size={14} color="#666" />
                <Text style={styles.metaText}>{time.text}</Text>
              </View>
            )}
            {notification && (
              <View style={styles.metaItem}>
                <Ionicons name={notification.icon || 'notifications-outline'} size={14} color="#666" />
                <Text style={styles.metaText}>{notification.text}</Text>
              </View>
            )}
            {verification && (
              <View style={styles.metaItem}>
                <Ionicons name={verification.icon || 'checkmark-circle'} size={14} color="#666" />
                <Text style={styles.metaText}>{verification.text}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  mainContent: {
    padding: 16,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  } as ViewStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 12,
  } as TextStyle,
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
  } as ViewStyle,
  statussuccess: {
    backgroundColor: '#E8F5E9',
  } as ViewStyle,
  statuswarning: {
    backgroundColor: '#FFF3E0',
  } as ViewStyle,
  statuserror: {
    backgroundColor: '#FFEBEE',
  } as ViewStyle,
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    textTransform: 'capitalize',
  } as TextStyle,
  statusTextWarning: {
    color: '#F57C00',
  } as TextStyle,
  statusTextError: {
    color: '#C62828',
  } as TextStyle,
  description: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  } as TextStyle,
  details: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  } as TextStyle,
  metaContainer: {
    marginTop: 4,
    gap: 8,
  } as ViewStyle,
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  metaText: {
    fontSize: 13,
    color: '#666',
  } as TextStyle,
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  } as ViewStyle,
  actionButton: {
    padding: 8,
  } as ViewStyle,
  disabledButton: {
    opacity: 0.5,
  } as ViewStyle,
});

export default ListItem;
