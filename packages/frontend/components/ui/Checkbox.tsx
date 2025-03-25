import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../../styles/commonStyles";

interface CheckboxProps {
  checked: boolean;
  onChecked: (checked: boolean) => void;
  label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChecked, label }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onChecked(!checked)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checked]}>
        {checked && <View style={styles.inner} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: colors.primary,
  },
  inner: {
    width: 10,
    height: 10,
    backgroundColor: colors.background,
    borderRadius: 2,
  },
  label: {
    fontSize: 14,
    color: colors.text,
  },
});

export default Checkbox; 