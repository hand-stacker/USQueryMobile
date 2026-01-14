import EncryptedStorage from 'react-native-encrypted-storage';

export async function storeUserSession(email: string, accessToken: string, refreshToken: string, isVerified: boolean) {
    try {
        await EncryptedStorage.setItem(
            "user_session",
            JSON.stringify({
                accessToken : accessToken,
                refreshToken: refreshToken,
                email : email,
                // isVerified is only stored for users convenience, not for auth purposes
                // if false, app redirects to verification screen after login
                isVerified: isVerified,
            })
        );
    } catch (error) {
        console.error("Error storing user session:", error);
    }
}

export async function retrieveUserSession() {
    try {   
        const session = await EncryptedStorage.getItem("user_session");
    
        if (session !== null) {
            const parsed = JSON.parse(session);
            return {
                accessToken: parsed.accessToken,
                email: parsed.email,
                isVerified: parsed.isVerified,
            };
        }
        return null;
    } catch (error) {
        console.error("Error retrieving user session:", error);
    }
}
export async function removeUserSession() {
    try {
        await EncryptedStorage.removeItem("user_session");
    } catch (error) {
        console.error("Error removing user session:", error);
    }
}

export async function clearAllStorage() {
    try {
        await EncryptedStorage.clear();
    } catch (error) {
        console.error("Error clearing storage:", error);
    }
}

export async function updateAccessToken(newAccessToken: string) {
    try {
        const raw = await EncryptedStorage.getItem("user_session");
        if (raw) {
            const session = JSON.parse(raw);
            session.accessToken = newAccessToken;
            await EncryptedStorage.setItem(
                "user_session",
                JSON.stringify(session)
            );
        }
    } catch (error) {
        console.error("Error updating access token:", error);
    }
}

export async function updateVerificationStatus(isVerified: boolean) {
    try {
        const raw = await EncryptedStorage.getItem("user_session");
        if (raw) {
            const session = JSON.parse(raw);
            session.isVerified = isVerified;
            await EncryptedStorage.setItem(
                "user_session",
                JSON.stringify(session)
            );
        }
    } catch (error) {
        console.error("Error updating verification status:", error);
    }
}