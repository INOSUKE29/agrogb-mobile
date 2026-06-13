import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { globalStyles, colors } from '../../styles/globalStyles';

export default function Button({ 
    title, 
    onPress, 
    type = 'primary', // primary, secondary, outline, danger
    icon,
    loading = false,
    disabled = false,
    style,
    textStyle 
}) {
    
    const getButtonStyle = () => {
        switch(type) {
            case 'secondary': return globalStyles.buttonSecondary;
            case 'outline': return globalStyles.buttonOutline;
            case 'danger': return globalStyles.buttonDanger;
            case 'primary':
            default:
                return globalStyles.buttonPrimary;
        }
    };
    
    const getTextStyle = () => {
        if(type === 'outline') return globalStyles.buttonTextOutline;
        return globalStyles.buttonText;
    };

    const getIndicatorColor = () => {
        if(type === 'outline') return colors.primary;
        return '#FFFFFF';
    };

    return (
        <TouchableOpacity 
            style={[
                getButtonStyle(), 
                disabled && { opacity: 0.5 },
                style
            ]} 
            onPress={onPress}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={getIndicatorColor()} />
            ) : (
                <>
                    {icon}
                    <Text style={[getTextStyle(), icon && { marginLeft: 8 }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}
