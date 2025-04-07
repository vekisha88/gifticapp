import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../ui/ThemeContext';
import TabBar from '../ui/TabBar';
import Dashboard from './Dashboard';
import CreateGift, { GiftDetails as GiftDetailsType } from './CreateGift';
import Assets from '../ui/Assets';
import Gifts from '../ui/Gifts';
import Profile from './Profile';
import ClaimGift from './ClaimGift';
import RecoveryPhraseModal from './RecoveryPhraseModal';
import GiftDetails from './GiftDetails';
import AssetDetails from './AssetDetails';
import { spacing } from '../ui/styles';
import { giftService, userService } from '../../services';
import { handleApiError } from '../../utils/errorHandling';

// Define app screens
export type AppScreen = 'dashboard' | 'createGift' | 'assets' | 'gifts' | 'profile' | 'assetDetails' | 'giftDetails' | 'editProfile' | 'security' | 'notifications' | 'help' | 'about' | 'paymentScreen' | 'claimGift' | 'recoveryPhrase';

// Define main tabs for the app
const tabs = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'assets', label: 'Assets', icon: 'chart' },
  { key: 'gifts', label: 'Gifts', icon: 'gift' },
  { key: 'profile', label: 'Profile', icon: 'profile' },
];

// Sample cryptocurrency data
const cryptoData = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: 'bitcoin',
    price: 60123.45,
    change: 124,
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'ethereum',
    price: 1845.67,
    change: 95,
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    icon: 'https://cryptologos.cc/logos/solana-sol-logo.svg',
    price: 102.34,
    change: 86,
  },
];

interface AppContentProps {
  onLogout: () => void;
}

const AppContent: React.FC<AppContentProps> = ({ onLogout }) => {
  const { colors, isDark, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [giftDetails, setGiftDetails] = useState<GiftDetailsType | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Payment screen data
  const [paymentData, setPaymentData] = useState<{
    giftCode: string;
    walletAddress: string;
    giftAmount: number;
    currency: string;
  } | null>(null);

  // Recovery phrase modal state
  const [recoveryPhraseData, setRecoveryPhraseData] = useState<{
    visible: boolean;
    mnemonic: string;
    unlockMessage?: string;
    giftCode: string;
    walletAddress: string;
  } | null>(null);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await userService.getCurrentUser();
        if (userData) {
          setUserProfile(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  const handleTabPress = (tabKey: string) => {
    setActiveTab(tabKey);
    
    // Map tab keys to screens
    switch (tabKey) {
      case 'home':
        setCurrentScreen('dashboard');
        break;
      case 'assets':
        setCurrentScreen('assets');
        break;
      case 'gifts':
        setCurrentScreen('gifts');
        break;
      case 'profile':
        setCurrentScreen('profile');
        break;
    }
  };

  const handleSendGift = () => {
    // Navigate to gift creation screen
    setCurrentScreen('createGift');
  };

  const handleClaimGift = () => {
    // Navigate to claim gift screen
    setCurrentScreen('claimGift');
  };

  const handleAssetPress = (assetId: string) => {
    // Navigate to asset details
    setSelectedAssetId(assetId);
    setCurrentScreen('assetDetails');
  };

  const handleGiftPress = (giftId: string) => {
    // Navigate to gift details
    setSelectedGiftId(giftId);
    setCurrentScreen('giftDetails');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
    setActiveTab('home');
  };

  const handleBackToAssets = () => {
    setCurrentScreen('assets');
    setActiveTab('assets');
  };

  const handleBackToGifts = () => {
    setCurrentScreen('gifts');
    setActiveTab('gifts');
  };

  const handleBackToProfile = () => {
    setCurrentScreen('profile');
    setActiveTab('profile');
  };

  const handleCreateGiftContinue = async (details: GiftDetailsType) => {
    try {
      if (!userProfile?.email) {
        Alert.alert('Error', 'User email not found. Please try again.');
        return;
      }
      
      // Format gift details for API
      const formattedDetails = giftService.formatGiftDetailsForAPI(details, userProfile.email);
      
      // Create gift via API
      const response = await giftService.createGift(formattedDetails);
      
      if (response.success && response.giftCode && response.walletAddress) {
        // Save gift details
        setGiftDetails(details);
        
        // Set payment data for payment screen
        setPaymentData({
          giftCode: response.giftCode,
          walletAddress: response.walletAddress,
          giftAmount: parseFloat(details.amount),
          currency: details.cryptocurrency,
        });
        
        // Navigate to payment screen
        setCurrentScreen('paymentScreen');
      } else {
        Alert.alert('Error', response.error || 'Failed to create gift. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', handleApiError(error, 'Failed to create gift. Please try again.'));
    }
  };

  const handlePaymentComplete = () => {
    // Navigate back to dashboard
    setCurrentScreen('dashboard');
    setActiveTab('home');
    
    // Show success message
    Alert.alert('Gift Created', 'Your gift has been created successfully!');
    
    // Reset payment data
    setPaymentData(null);
    setGiftDetails(null);
  };

  const handleThemeChange = (isDarkMode: boolean) => {
    // Update theme preference
    setTheme(isDarkMode ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      await userService.logout();
      onLogout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Payment screen component
  const PaymentScreen = () => {
    if (!paymentData) return null;
    
    const { giftCode, walletAddress, giftAmount, currency } = paymentData;
    
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Payment</Text>
        </View>
        
        <View style={styles.paymentContent}>
          <Text style={[styles.paymentInstructions, { color: colors.text }]}>
            Please send {giftAmount} {currency} to the following address:
          </Text>
          
          <View style={[styles.walletAddressContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.walletAddress, { color: colors.text }]}>{walletAddress}</Text>
          </View>
          
          <Text style={[styles.paymentNote, { color: colors.textSecondary }]}>
            Your gift code is: {giftCode}
          </Text>
          
          <Text style={[styles.paymentWarning, { color: colors.warning }]}>
            Important: Send exactly {giftAmount} {currency}. Payment will be automatically detected.
          </Text>
          
          <View style={styles.paymentButtonsContainer}>
            <button onClick={handleBackToDashboard} style={{ marginRight: spacing.medium }}>
              Back
            </button>
            <button onClick={handlePaymentComplete}>
              I've Made the Payment
            </button>
          </View>
        </View>
      </View>
    );
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard
            cryptoData={cryptoData}
            onSendGift={handleSendGift}
            onClaimGift={handleClaimGift}
            onAssetPress={handleAssetPress}
            onGiftPress={handleGiftPress}
          />
        );
      case 'createGift':
        return (
          <CreateGift
            onBack={handleBackToDashboard}
            onContinue={handleCreateGiftContinue}
          />
        );
      case 'assets':
        return (
          <Assets
            onAssetPress={handleAssetPress}
          />
        );
      case 'gifts':
        return (
          <Gifts
            onGiftPress={handleGiftPress}
          />
        );
      case 'profile':
        return (
          <Profile
            user={userProfile}
            onEditProfile={() => setCurrentScreen('editProfile')}
            onLogout={handleLogout}
            onThemeChange={handleThemeChange}
            onSecurity={() => setCurrentScreen('security')}
            onNotifications={() => setCurrentScreen('notifications')}
            onHelp={() => setCurrentScreen('help')}
            onAbout={() => setCurrentScreen('about')}
          />
        );
      case 'assetDetails':
        return (
          <AssetDetails
            assetId={selectedAssetId}
            onBack={handleBackToAssets}
          />
        );
      case 'giftDetails':
        return (
          <GiftDetails
            giftId={selectedGiftId}
            onBack={handleBackToGifts}
          />
        );
      case 'paymentScreen':
        return (
          <PaymentScreen />
        );
      case 'claimGift':
        return (
          <ClaimGift
            onBack={handleBackToDashboard}
            onSuccess={(data) => {
              if (data?.mnemonic && data?.giftCode && data?.walletAddress) {
                setRecoveryPhraseData({
                  visible: true,
                  mnemonic: data.mnemonic,
                  unlockMessage: data.unlockMessage,
                  giftCode: data.giftCode,
                  walletAddress: data.walletAddress
                });
              }
            }}
          />
        );
      default:
        return (
          <Dashboard
            cryptoData={cryptoData}
            onSendGift={handleSendGift}
            onClaimGift={handleClaimGift}
            onAssetPress={handleAssetPress}
            onGiftPress={handleGiftPress}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderScreen()}
      
      {/* Show tab bar only for main tabs */}
      {['dashboard', 'assets', 'gifts', 'profile'].includes(currentScreen) && (
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      )}
      
      {/* Recovery Phrase Modal */}
      {recoveryPhraseData && recoveryPhraseData.visible && (
        <RecoveryPhraseModal
          visible={recoveryPhraseData.visible}
          mnemonic={recoveryPhraseData.mnemonic}
          unlockMessage={recoveryPhraseData.unlockMessage}
          onClose={() => {
            setRecoveryPhraseData(null);
            handleBackToDashboard();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  paymentContent: {
    padding: spacing.large,
    alignItems: 'center',
  },
  paymentInstructions: {
    fontSize: 18,
    marginBottom: spacing.large,
    textAlign: 'center',
  },
  walletAddressContainer: {
    padding: spacing.medium,
    borderRadius: 12,
    width: '100%',
    marginBottom: spacing.large,
  },
  walletAddress: {
    fontSize: 16,
    textAlign: 'center',
  },
  paymentNote: {
    fontSize: 14,
    marginBottom: spacing.medium,
  },
  paymentWarning: {
    fontSize: 14,
    marginBottom: spacing.large,
    textAlign: 'center',
  },
  paymentButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.medium,
  },
});

export default AppContent; 