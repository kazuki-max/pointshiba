/**
 * ========================================
 * 2段階認証システム（TOTP - Time-based One-Time Password）
 * ========================================
 * 
 * Google Authenticator等の認証アプリに対応
 * 完全無料で動作（外部API不要）
 * 
 * 使用ライブラリ:
 * - otplib (TOTP生成・検証)
 * - qrcode (QRコード生成)
 */

// ========================================
// TwoFactorAuthシステム
// ========================================
const TwoFactorAuth = {
    
    /**
     * 2段階認証を初期化（新規設定）
     * @param {string} userId - ユーザーID
     * @param {string} username - ユーザー名
     * @returns {Promise<object>} - {secret, qrCodeUrl, backupCodes}
     */
    async initialize(userId, username) {
        try {
            // 既存の設定があるかチェック
            const existing = await this.getUserSecret(userId);
            if (existing && existing.enabled) {
                throw new Error('2段階認証は既に有効化されています');
            }
            
            // 新しい秘密鍵を生成
            const secret = this.generateSecret();
            
            // バックアップコードを生成（10個）
            const backupCodes = this.generateBackupCodes(10);
            
            // QRコード用のURL生成
            const appName = 'PointShiba';
            const otpauthUrl = `otpauth://totp/${appName}:${username}?secret=${secret}&issuer=${appName}`;
            
            // データベースに保存（まだ無効状態）
            const secretData = {
                user_id: userId,
                secret: secret,
                enabled: false,
                backup_codes: backupCodes,
                created_at_custom: Date.now(),
                last_used: null
            };
            
            // 既存データがあれば更新、なければ新規作成
            if (existing) {
                await fetch(`tables/two_factor_secrets/${existing.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(secretData)
                });
            } else {
                await fetch('tables/two_factor_secrets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(secretData)
                });
            }
            
            return {
                secret: secret,
                otpauthUrl: otpauthUrl,
                backupCodes: backupCodes
            };
            
        } catch (error) {
            console.error('2段階認証初期化エラー:', error);
            throw error;
        }
    },
    
    /**
     * 2段階認証を有効化（初回設定時のコード確認）
     * @param {string} userId - ユーザーID
     * @param {string} code - 6桁の認証コード
     * @returns {Promise<boolean>} - 有効化成功/失敗
     */
    async enable(userId, code) {
        try {
            const secretData = await this.getUserSecret(userId);
            if (!secretData) {
                throw new Error('2段階認証の初期化が必要です');
            }
            
            // コード検証
            const isValid = this.verifyToken(secretData.secret, code);
            if (!isValid) {
                throw new Error('認証コードが正しくありません');
            }
            
            // 有効化
            await fetch(`tables/two_factor_secrets/${secretData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: true,
                    last_used: Date.now()
                })
            });
            
            return true;
            
        } catch (error) {
            console.error('2段階認証有効化エラー:', error);
            throw error;
        }
    },
    
    /**
     * 2段階認証を無効化
     * @param {string} userId - ユーザーID
     * @param {string} code - 6桁の認証コード（本人確認用）
     * @returns {Promise<boolean>} - 無効化成功/失敗
     */
    async disable(userId, code) {
        try {
            const secretData = await this.getUserSecret(userId);
            if (!secretData || !secretData.enabled) {
                throw new Error('2段階認証は有効化されていません');
            }
            
            // コード検証
            const isValid = this.verifyToken(secretData.secret, code);
            if (!isValid) {
                throw new Error('認証コードが正しくありません');
            }
            
            // 無効化
            await fetch(`tables/two_factor_secrets/${secretData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: false
                })
            });
            
            return true;
            
        } catch (error) {
            console.error('2段階認証無効化エラー:', error);
            throw error;
        }
    },
    
    /**
     * ログイン時の2段階認証コード検証
     * @param {string} userId - ユーザーID
     * @param {string} code - 6桁の認証コードまたはバックアップコード
     * @returns {Promise<boolean>} - 検証成功/失敗
     */
    async verifyLogin(userId, code) {
        try {
            const secretData = await this.getUserSecret(userId);
            if (!secretData || !secretData.enabled) {
                // 2段階認証が無効の場合は検証不要
                return true;
            }
            
            // 通常の6桁コード検証
            if (code.length === 6 && /^\d+$/.test(code)) {
                const isValid = this.verifyToken(secretData.secret, code);
                if (isValid) {
                    // 最終使用日時を更新
                    await fetch(`tables/two_factor_secrets/${secretData.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            last_used: Date.now()
                        })
                    });
                    return true;
                }
            }
            
            // バックアップコード検証
            if (code.length === 8 && secretData.backup_codes) {
                const backupCodes = Array.isArray(secretData.backup_codes) 
                    ? secretData.backup_codes 
                    : JSON.parse(secretData.backup_codes || '[]');
                
                const index = backupCodes.indexOf(code);
                if (index !== -1) {
                    // バックアップコードは1回のみ使用可能
                    backupCodes.splice(index, 1);
                    
                    await fetch(`tables/two_factor_secrets/${secretData.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            backup_codes: backupCodes,
                            last_used: Date.now()
                        })
                    });
                    
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            console.error('2段階認証検証エラー:', error);
            return false;
        }
    },
    
    /**
     * ユーザーの2段階認証設定を取得
     * @param {string} userId - ユーザーID
     * @returns {Promise<object|null>} - 設定データまたはnull
     */
    async getUserSecret(userId) {
        try {
            const response = await fetch(`tables/two_factor_secrets?limit=1000`);
            const data = await response.json();
            
            const userSecret = data.data.find(s => s.user_id === userId);
            return userSecret || null;
            
        } catch (error) {
            console.error('シークレット取得エラー:', error);
            return null;
        }
    },
    
    /**
     * 2段階認証が有効かチェック
     * @param {string} userId - ユーザーID
     * @returns {Promise<boolean>} - 有効/無効
     */
    async isEnabled(userId) {
        const secretData = await this.getUserSecret(userId);
        return secretData && secretData.enabled === true;
    },
    
    // ========================================
    // TOTP コア機能（otplib使用）
    // ========================================
    
    /**
     * ランダムな秘密鍵を生成（Base32エンコード）
     * @returns {string} - 秘密鍵
     */
    generateSecret() {
        // otplibのauthenticatorを使用
        if (typeof otplib !== 'undefined' && otplib.authenticator) {
            return otplib.authenticator.generateSecret();
        }
        
        // フォールバック: 手動生成
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return secret;
    },
    
    /**
     * TOTPトークンを検証
     * @param {string} secret - 秘密鍵
     * @param {string} token - 6桁のトークン
     * @returns {boolean} - 検証結果
     */
    verifyToken(secret, token) {
        if (typeof otplib !== 'undefined' && otplib.authenticator) {
            try {
                return otplib.authenticator.verify({ token, secret });
            } catch (error) {
                console.error('トークン検証エラー:', error);
                return false;
            }
        }
        
        // フォールバック: デモモード
        console.warn('otplib未ロード - デモモード');
        return token === '123456'; // デモ用固定コード
    },
    
    /**
     * バックアップコードを生成
     * @param {number} count - 生成数
     * @returns {Array<string>} - バックアップコード配列
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // 8桁のランダムコード生成
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            codes.push(code.padEnd(8, '0'));
        }
        return codes;
    },
    
    /**
     * QRコードを生成してCanvas/DataURLで返す
     * @param {string} otpauthUrl - otpauth://で始まるURL
     * @param {HTMLElement} container - QRコードを表示する要素
     * @returns {Promise<void>}
     */
    async generateQRCode(otpauthUrl, container) {
        try {
            if (typeof QRCode !== 'undefined') {
                // qrcode.jsライブラリ使用
                container.innerHTML = '';
                await QRCode.toCanvas(container, otpauthUrl, {
                    width: 256,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
            } else {
                // フォールバック: テキスト表示
                container.innerHTML = `
                    <div class="bg-gray-800 p-4 rounded-lg text-center">
                        <p class="text-sm text-gray-400 mb-2">QRコードライブラリ未ロード</p>
                        <p class="text-xs text-gray-500 break-all">${otpauthUrl}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('QRコード生成エラー:', error);
            throw error;
        }
    }
};

// ========================================
// グローバル公開
// ========================================
window.TwoFactorAuth = TwoFactorAuth;

console.log('✅ 2段階認証システム (TwoFactorAuth) ロード完了');
