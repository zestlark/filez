export const getUserKey = (): string => {
    let userKey = localStorage.getItem('userKey');
    if (!userKey) {
        userKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('userKey', userKey);
    }
    return userKey;
};

export const getUserHash = async (): Promise<string> => {
    const userKey = getUserKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(userKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Sync version of getUserHash for simple checks where async might be overkill,
 * using a simpler string hash if crypto subtle is not immediately needed.
 * For true security in a web app, async SHA-256 is better, but vue components 
 * often need synchronous props or computed values.
 */
export const getUserHashSync = (): string => {
    const userKey = getUserKey();
    let hash = 0;
    for (let i = 0; i < userKey.length; i++) {
        const char = userKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(16);
};
