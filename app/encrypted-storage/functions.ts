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
        // Defensive: handle unexpected stored values
        if (!session || session === "null" || session === "undefined") {
            return null;
        }

        try {
            const parsed = JSON.parse(session);
            return {
                accessToken: parsed.accessToken,
                refreshToken: parsed.refreshToken,
                email: parsed.email,
                isVerified: parsed.isVerified,
            };
        } catch (parseError) {
            console.error("Failed to parse stored user_session:", parseError, "raw:", session);
            return null;
        }
    } catch (error) {
        console.error("Error retrieving user session:", error);
        return null;
    }
}

export async function refreshAccessToken(): Promise<string> {
    const session = await retrieveUserSession();

    if (!session?.refreshToken) {
        throw new Error("No refresh token available");
    }
    const res = await fetch(`https://www.usquery.com/api/auth/token/refresh/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            refresh: session.refreshToken,
        }),
    });

    if (!res.ok) {
        throw new Error("Refresh token expired or invalid");
    }

    const data = await res.json();
    if (data.refresh) {
        await EncryptedStorage.setItem(
            "user_session",
            JSON.stringify({
                ...session,
                accessToken: data.access,
                refreshToken: data.refresh,
            })
        );
    }
    return data.access;
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