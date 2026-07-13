import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';

export const CustomTextInput = ({ iconName, label, containerStyle, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Container style={containerStyle}>
      {label && <Label>{label}</Label>}
      <InputWrapper isFocused={isFocused}>
        {iconName && <Icon isFocused={isFocused} name={iconName} />}
        <StyledInput
          onFocus={() => {
            setIsFocused(true);
            if (props.onFocus) props.onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            if (props.onBlur) props.onBlur();
          }}
          placeholderTextColor={props.placeholderTextColor || '#757575'}
          {...props}
        />
      </InputWrapper>
    </Container>
  );
};

const Container = styled.View`
  margin-bottom: 16px;
  width: 100%;
`;

const Label = styled.Text`
  font-size: 12px;
  font-weight: 700;
  color: #757575;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InputWrapper = styled.View`
  background-color: #FFFFFF;
  border-width: 1px;
  border-color: ${props => (props.isFocused ? '#10B981' : '#D1D1D6')};
  border-radius: 12px;
  padding: 14px;
  flex-direction: row;
  align-items: center;
`;

const Icon = styled(Ionicons)`
  font-size: 20px;
  color: ${props => (props.isFocused ? '#10B981' : '#757575')};
  margin-right: 12px;
`;

const StyledInput = styled.TextInput`
  flex: 1;
  font-size: 16px;
  color: #1C1C1E;
`;
