const crypto = require('crypto');
const fs = require('fs');

console.log('🔐 生成 ErDashboard RSA 金鑰對...');

// 生成 2048 位 RSA 金鑰對
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// 儲存公鑰到 JavaScript 檔案（會放到公開 repo）
const publicKeyJS = `// ErDashboard 公鑰 - 用於驗證私鑰持有者身份
const PUBLIC_KEY = \`${publicKey}\`;

// 驗證函數
async function verifyPrivateKey(privateKeyPEM) {
    try {
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
`;

// 寫入公鑰檔案
fs.writeFileSync('js/crypto-auth.js', publicKeyJS);

// 儲存私鑰到安全位置（不會 commit 到 repo）
fs.writeFileSync('private-key.pem', privateKey);

console.log('✅ 金鑰對生成完成！');
console.log('📁 公鑰已儲存到: js/crypto-auth.js （會包含在 repo 中）');
console.log('🔐 私鑰已儲存到: private-key.pem （請保管好，不會 commit）');
console.log('');
console.log('🚨 請將 private-key.pem 安全保管，這是您存取 Dashboard 的唯一方式！');
console.log('💡 建議：複製 private-key.pem 內容到安全的密碼管理器中');