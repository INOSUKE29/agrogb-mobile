export const validatePassword = (password) => {
    return password.length >= 6;
};

export const validateUser = (user) => {
    return user && user.length >= 3;
};
