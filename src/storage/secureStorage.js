import AsyncStorage from "@react-native-async-storage/async-storage";

export const save = async (key, value) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const get = async (key) => {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

export const remove = async (key) => {
    await AsyncStorage.removeItem(key);
};
