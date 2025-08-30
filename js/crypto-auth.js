// ErDashboard 公鑰 - 用於驗證私鑰持有者身份
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiEPz01Y2soBbEYDBHvni
EbCUrE7cc16IMgDLTA6JLqDPmRVuVEf8mUChjggo8mJQ1Y9PeuR5u4IaruLtf6yc
wTUOY0k0Xl7jTlG/hK7OEUXe9cm80fRoUbdqe2IOs2gs4SgJ0VaeaGHXLHIl9KXH
6LkN0wC2ptHgP67XMnZ9PGdhTmU0Cujc2zXrnLgKafJdAMvgzgRK34rozJjOAcjZ
xdguCV5LYUzJK6hook+gAFe5FthvfJod/IGSJc6c3FDC25QQtldU1R6HsVfo9qhK
sv1mBQymPpxd/Pm/5VTxvF+QXpWOeiPSsMfMwEUOYUr02jWJ62BcnyGMKbW68h0k
EwIDAQAB
-----END PUBLIC KEY-----
`;

// Web Crypto API 驗證函數（瀏覽器版本）
async function verifyPrivateKeyWebCrypto(privateKeyPEM) {
    try {
        const testMessage = 'ErDashboard-Auth-Test-' + Date.now();
        const encoder = new TextEncoder();
        const data = encoder.encode(testMessage);
        
        // 匯入私鑰
        const privateKey = await window.crypto.subtle.importKey(
            'pkcs8',
            pemToArrayBuffer(privateKeyPEM),
            {
                name: 'RSASSA-PKCS1-v1_5',
                hash: 'SHA-256'
            },
            false,
            ['sign']
        );
        
        // 用私鑰簽名
        const signature = await window.crypto.subtle.sign(
            'RSASSA-PKCS1-v1_5',
            privateKey,
            data
        );
        
        // 匯入公鑰
        const publicKey = await window.crypto.subtle.importKey(
            'spki',
            pemToArrayBuffer(PUBLIC_KEY),
            {
                name: 'RSASSA-PKCS1-v1_5',
                hash: 'SHA-256'
            },
            false,
            ['verify']
        );
        
        // 用公鑰驗證簽名
        const isValid = await window.crypto.subtle.verify(
            'RSASSA-PKCS1-v1_5',
            publicKey,
            signature,
            data
        );
        
        return isValid;
    } catch (error) {
        console.error('Key verification failed:', error);
        return false;
    }
}

// PEM 格式轉 ArrayBuffer
function pemToArrayBuffer(pem) {
    const b64 = pem
        .replace(/-----BEGIN [^-]+-----/, '')
        .replace(/-----END [^-]+-----/, '')
        .replace(/[\r\n\s]/g, '');
    
    const binaryString = atob(b64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Node.js 版本的驗證函數（用於腳本）
async function verifyPrivateKey(privateKeyPEM) {
    try {
        const crypto = require('crypto');
        const testMessage = 'ErDashboard-Auth-Test-' + Date.now();
        
        // 用私鑰簽名
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(testMessage);
        const signature = sign.sign(privateKeyPEM, 'base64');
        
        // 用公鑰驗證
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(testMessage);
        return verify.verify(PUBLIC_KEY, signature, 'base64');
    } catch (error) {
        console.error('Key verification failed:', error);
        return false;
    }
}

// 導出驗證函數
if (typeof window !== 'undefined') {
    window.verifyPrivateKey = verifyPrivateKey;
} else if (typeof module !== 'undefined') {
    module.exports = { verifyPrivateKey, PUBLIC_KEY };
}
