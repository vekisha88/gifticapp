import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Clipboard,
} from 'react-native';
import { useTheme } from '../ui/ThemeContext';
import { borderRadius, spacing, typography } from '../ui/styles';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface RecoveryPhraseModalProps {
  visible: boolean;
  mnemonic: string;
  unlockMessage?: string;
  onClose: (confirmed: boolean) => void;
}

const RecoveryPhraseModal: React.FC<RecoveryPhraseModalProps> = ({
  visible,
  mnemonic,
  unlockMessage,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Convert mnemonic phrase to array of words
  const mnemonicWords = mnemonic.split(' ');
  
  // Handle clipboard copy
  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setString(mnemonic);
      setIsCopied(true);
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy recovery phrase to clipboard.');
    }
  };
  
  // Handle "I've saved it" toggle
  const handleConfirmToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Important',
        'By confirming, you acknowledge that you have saved this recovery phrase securely. If you lose this phrase, you will permanently lose access to your wallet and funds.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsConfirmed(false),
          },
          {
            text: 'I Understand',
            onPress: () => setIsConfirmed(true),
          },
        ]
      );
    } else {
      setIsConfirmed(false);
    }
  };
  
  // Close modal with confirmation
  const handleConfirmAndClose = () => {
    if (!isConfirmed) {
      Alert.alert(
        'Warning',
        'You must confirm that you have saved your recovery phrase securely before continuing.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    onClose(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => onClose(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Wallet Recovery Phrase
            </Text>
            <TouchableOpacity onPress={() => onClose(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={[styles.warningText, { color: colors.warning }]}>
              IMPORTANT: This recovery phrase gives full access to your wallet and funds. Never share it with anyone!
            </Text>
            
            <Card style={[styles.phraseCard, { backgroundColor: isDark ? colors.card : '#f9fafb' }]}>
              <View style={styles.phraseContainer}>
                {mnemonicWords.map((word, index) => (
                  <View key={index} style={styles.wordItem}>
                    <Text style={[styles.wordNumber, { color: colors.textSecondary }]}>
                      {index + 1}.
                    </Text>
                    <Text style={[styles.word, { color: colors.text }]}>
                      {word}
                    </Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity 
                style={[styles.copyButton, { backgroundColor: colors.primary + '20' }]}
                onPress={handleCopyToClipboard}
              >
                <MaterialIcons 
                  name={isCopied ? "check" : "content-copy"} 
                  size={18} 
                  color={colors.primary} 
                />
                <Text style={[styles.copyButtonText, { color: colors.primary }]}>
                  {isCopied ? 'Copied!' : 'Copy to clipboard'}
                </Text>
              </TouchableOpacity>
            </Card>
            
            {unlockMessage && (
              <View style={[styles.infoCard, { backgroundColor: colors.info + '20' }]}>
                <MaterialIcons name="info" size={20} color={colors.info} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {unlockMessage}
                </Text>
              </View>
            )}
            
            <View style={styles.confirmContainer}>
              <Text style={[styles.confirmText, { color: colors.text }]}>
                I have securely saved my recovery phrase
              </Text>
              <Switch
                value={isConfirmed}
                onValueChange={handleConfirmToggle}
                trackColor={{ false: colors.border, true: colors.primary + '70' }}
                thumbColor={isConfirmed ? colors.primary : colors.text}
              />
            </View>
            
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Write this phrase on paper and store it in a secure location. Screenshot is also an option but less secure.
            </Text>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              onPress={() => onClose(false)}
              variant="outline"
              style={{ marginRight: spacing.small }}
            />
            <Button
              title="I've Saved It"
              onPress={handleConfirmAndClose}
              variant="primary"
              disabled={!isConfirmed}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.medium,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  modalTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
  },
  warningText: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
  phraseCard: {
    marginBottom: spacing.medium,
  },
  phraseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: spacing.small,
  },
  wordItem: {
    flexDirection: 'row',
    width: '50%',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.small,
  },
  wordNumber: {
    fontSize: typography.fontSize.small,
    width: 24,
  },
  word: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.small,
    borderRadius: borderRadius.small,
    marginTop: spacing.small,
  },
  copyButtonText: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  infoText: {
    fontSize: typography.fontSize.small,
    marginLeft: spacing.small,
    flex: 1,
  },
  confirmContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  confirmText: {
    fontSize: typography.fontSize.medium,
    fontWeight: '500',
  },
  instructionText: {
    fontSize: typography.fontSize.small,
    marginBottom: spacing.large,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.medium,
  },
});

export default RecoveryPhraseModal; 