import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import commonStyles from "../../styles/commonStyles";

interface RecipientInfoInputProps {
  firstName: string;
  lastName: string;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  lastNameRef: React.RefObject<TextInput>;
  giftAmountRef: React.RefObject<TextInput>;
}

const RecipientInfoInput: React.FC<RecipientInfoInputProps> = ({
  firstName,
  lastName,
  setFirstName,
  setLastName,
  lastNameRef,
  giftAmountRef,
}) => {
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateFirstName = () => {
    setErrors((prev) => ({
      ...prev,
      firstName: firstName.trim() ? "" : "First name is required",
    }));
  };

  const validateLastName = () => {
    setErrors((prev) => ({
      ...prev,
      lastName: lastName.trim() ? "" : "Last name is required",
    }));
  };

  return (
    <>
      <View
        style={[
          commonStyles.inputContainer,
          focusedField === "firstName" && commonStyles.focusedBorder, // ✅ Apply focused border
        ]}
      >
        <TextInput
          style={commonStyles.inputField}
          placeholder="Enter Recipient First Name"
          placeholderTextColor={commonStyles.placeholderText.color}
          returnKeyType="next"
          onSubmitEditing={() => lastNameRef.current?.focus()}
          blurOnSubmit={false}
          value={firstName}
          onChangeText={setFirstName}
          onFocus={() => setFocusedField("firstName")}
          onBlur={() => {
            setFocusedField(null);
            validateFirstName();
          }}
        />
      </View>
      {errors.firstName ? <Text style={commonStyles.errorText}>{errors.firstName}</Text> : null}

      <View
        style={[
          commonStyles.inputContainer,
          focusedField === "lastName" && commonStyles.focusedBorder, // ✅ Apply focused border
        ]}
      >
        <TextInput
          ref={lastNameRef}
          style={commonStyles.inputField}
          placeholder="Enter Recipient Last Name"
          placeholderTextColor={commonStyles.placeholderText.color}
          returnKeyType="next"
          onSubmitEditing={() => giftAmountRef.current?.focus()}
          blurOnSubmit={false}
          value={lastName}
          onChangeText={setLastName}
          onFocus={() => setFocusedField("lastName")}
          onBlur={() => {
            setFocusedField(null);
            validateLastName();
          }}
        />
      </View>
      {errors.lastName ? <Text style={commonStyles.errorText}>{errors.lastName}</Text> : null}
    </>
  );
};

export default RecipientInfoInput;
