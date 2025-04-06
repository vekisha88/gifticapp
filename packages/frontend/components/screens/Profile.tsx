import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { useTheme } from '../ui/ThemeContext';
import { borderRadius, spacing, typography } from '../ui/styles';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { MaterialIcons } from '@expo/vector-icons';
import { User } from '../../services';

interface ProfileProps {
  user?: User;
  onEditProfile: () => void;
  onLogout: () => void;
  onThemeChange: (isDark: boolean) => void;
  onSecurity: () => void;
  onNotifications: () => void;
  onHelp: () => void;
  onAbout: () => void;
}

const Profile: React.FC<ProfileProps> = ({
  user = { id: '0', name: 'John Doe', email: 'john.doe@example.com' },
  onEditProfile,
  onLogout,
  onThemeChange,
  onSecurity,
  onNotifications,
  onHelp,
  onAbout,
}) => {
  const { colors, isDark, setTheme } = useTheme();
  
  // Toggle theme
  const handleDarkModeToggle = (value: boolean) => {
    const newTheme = value ? 'dark' : 'light';
    setTheme(newTheme);
    onThemeChange(value);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
            {user.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name || 'User'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user.email}
            </Text>
          </View>
        </View>
        <Button
          title="Edit Profile"
          onPress={onEditProfile}
          variant="outline"
          size="small"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleDarkModeToggle(!isDark)}
          >
            <View style={styles.settingLeft}>
              <MaterialIcons name="dark-mode" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#767577', true: `${colors.primary}80` }}
              thumbColor={isDark ? colors.primary : '#f4f3f4'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={onSecurity}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="security" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Security</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={onNotifications}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="notifications" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Notifications
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>

        <Card style={styles.card}>
          <TouchableOpacity style={styles.settingItem} onPress={onHelp}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="help" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Help Center</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={onAbout}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="info" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>About</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.logoutSection}>
        <Button
          title="Logout"
          onPress={onLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.large,
    paddingVertical: spacing.medium,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    justifyContent: 'center',
  },
  userName: {
    ...typography.h2,
    marginBottom: spacing.tiny,
  },
  userEmail: {
    ...typography.body,
  },
  section: {
    marginBottom: spacing.large,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.small,
    marginLeft: spacing.small,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    ...typography.body,
    marginLeft: spacing.medium,
  },
  logoutSection: {
    marginBottom: spacing.extraLarge,
  },
  logoutButton: {
    marginTop: spacing.small,
  },
});

export default Profile; 