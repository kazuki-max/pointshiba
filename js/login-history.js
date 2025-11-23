/**
 * ========================================
 * ログイン履歴管理システム
 * ========================================
 * 
 * ログイン試行の記録・表示・分析機能
 * セキュリティアラート・異常検知機能
 * 
 * 完全無料で動作（無料IPアドレスAPI使用）
 */

// ========================================
// LoginHistoryシステム
// ========================================
const LoginHistory = {
    
    /**
     * ログイン試行を記録
     * @param {string} userId - ユーザーID
     * @param {boolean} success - ログイン成功/失敗
     * @param {string} loginMethod - ログイン方法
     * @param {boolean} twoFactorUsed - 2段階認証使用したか
     * @returns {Promise<object>} - 記録されたログイン履歴
     */
    async record(userId, success, loginMethod = 'password', twoFactorUsed = false) {
        try {
            // デバイス情報を取得
            const deviceInfo = this.getDeviceInfo();
            
            // IPアドレスと位置情報を取得（非同期）
            const ipData = await this.getIPAddress();
            
            // 異常なログインかチェック
            const isSuspicious = await this.detectSuspiciousActivity(userId, deviceInfo, ipData);
            
            // ログイン履歴を作成
            const historyData = {
                user_id: userId,
                login_time: Date.now(),
                ip_address: ipData.ip || 'Unknown',
                device_info: deviceInfo.device,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                location: ipData.location || 'Unknown',
                login_method: loginMethod,
                success: success,
                two_factor_used: twoFactorUsed,
                is_suspicious: isSuspicious
            };
            
            // データベースに保存
            const response = await fetch('tables/login_history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(historyData)
            });
            
            const savedHistory = await response.json();
            
            // 異常なログインの場合、通知を送信
            if (isSuspicious && success && typeof NotificationSystem !== 'undefined') {
                await NotificationSystem.create(userId, {
                    title: '⚠️ 異常なログインを検知',
                    message: `新しいデバイスまたは場所からのログインが検出されました。\n場所: ${ipData.location}\nデバイス: ${deviceInfo.device}`,
                    type: 'system',
                    icon: 'fa-shield-alt'
                });
            }
            
            return savedHistory;
            
        } catch (error) {
            console.error('ログイン履歴記録エラー:', error);
            throw error;
        }
    },
    
    /**
     * ユーザーのログイン履歴を取得
     * @param {string} userId - ユーザーID
     * @param {number} limit - 取得件数（デフォルト50件）
     * @returns {Promise<Array>} - ログイン履歴配列
     */
    async getHistory(userId, limit = 50) {
        try {
            const response = await fetch(`tables/login_history?limit=1000`);
            const data = await response.json();
            
            // ユーザーの履歴のみフィルター & 日時降順ソート
            const userHistory = data.data
                .filter(h => h.user_id === userId)
                .sort((a, b) => b.login_time - a.login_time)
                .slice(0, limit);
            
            return userHistory;
            
        } catch (error) {
            console.error('ログイン履歴取得エラー:', error);
            return [];
        }
    },
    
    /**
     * ログイン履歴をHTML形式でフォーマット
     * @param {Array} history - ログイン履歴配列
     * @returns {string} - HTML文字列
     */
    formatHistoryHTML(history) {
        if (!history || history.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-history text-4xl mb-3 opacity-50"></i>
                    <p>ログイン履歴がありません</p>
                </div>
            `;
        }
        
        return history.map(item => {
            const date = new Date(item.login_time);
            const dateStr = date.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // 成功/失敗のアイコンと色
            const statusIcon = item.success 
                ? '<i class="fas fa-check-circle text-green-400"></i>' 
                : '<i class="fas fa-times-circle text-red-400"></i>';
            
            const statusText = item.success ? '' : ' (失敗)';
            
            // 異常検知の警告
            const suspiciousWarning = item.is_suspicious 
                ? '<span class="ml-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded">⚠️ 異常検知</span>' 
                : '';
            
            // ログイン方法のアイコン
            const methodIcons = {
                password: '<i class="fas fa-key"></i>',
                google: '<i class="fab fa-google"></i>',
                facebook: '<i class="fab fa-facebook"></i>',
                twitter: '<i class="fab fa-twitter"></i>',
                line: '<i class="fab fa-line"></i>'
            };
            const methodIcon = methodIcons[item.login_method] || '<i class="fas fa-sign-in-alt"></i>';
            
            // 2段階認証バッジ
            const twoFactorBadge = item.two_factor_used 
                ? '<span class="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded"><i class="fas fa-shield-alt"></i> 2FA</span>' 
                : '';
            
            return `
                <div class="bg-gray-800 rounded-lg p-4 mb-3 border ${item.is_suspicious ? 'border-yellow-500' : 'border-gray-700'}">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2">
                            ${statusIcon}
                            <span class="font-semibold text-white">${dateStr}${statusText}</span>
                            ${suspiciousWarning}
                        </div>
                        <div class="flex items-center gap-2">
                            ${methodIcon}
                            ${twoFactorBadge}
                        </div>
                    </div>
                    <div class="text-sm text-gray-400 space-y-1 ml-7">
                        <div><i class="fas fa-mobile-alt w-4"></i> ${item.device_info} · ${item.browser}</div>
                        <div><i class="fas fa-desktop w-4"></i> ${item.os}</div>
                        <div><i class="fas fa-map-marker-alt w-4"></i> ${item.location}</div>
                        <div><i class="fas fa-network-wired w-4"></i> IP: ${item.ip_address}</div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // ========================================
    // デバイス・環境情報取得
    // ========================================
    
    /**
     * デバイス情報を取得
     * @returns {object} - {device, browser, os}
     */
    getDeviceInfo() {
        const ua = navigator.userAgent;
        
        // デバイス種別
        let device = 'PC';
        if (/iPhone|iPod/.test(ua)) device = 'iPhone';
        else if (/iPad/.test(ua)) device = 'iPad';
        else if (/Android/.test(ua)) {
            device = /Mobile/.test(ua) ? 'Android Phone' : 'Android Tablet';
        } else if (/Mac/.test(ua)) device = 'Mac';
        else if (/Windows/.test(ua)) device = 'Windows PC';
        else if (/Linux/.test(ua)) device = 'Linux PC';
        
        // ブラウザ
        let browser = 'Unknown';
        if (/Edg\//.test(ua)) browser = 'Edge';
        else if (/Chrome/.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome';
        else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
        else if (/Firefox/.test(ua)) browser = 'Firefox';
        else if (/MSIE|Trident/.test(ua)) browser = 'Internet Explorer';
        
        // OS
        let os = 'Unknown';
        if (/iPhone|iPad|iPod/.test(ua)) {
            const match = ua.match(/OS (\d+)_/);
            os = match ? `iOS ${match[1]}` : 'iOS';
        } else if (/Android/.test(ua)) {
            const match = ua.match(/Android (\d+\.?\d*)/);
            os = match ? `Android ${match[1]}` : 'Android';
        } else if (/Mac/.test(ua)) {
            os = 'macOS';
        } else if (/Windows NT 10/.test(ua)) {
            os = 'Windows 10/11';
        } else if (/Windows/.test(ua)) {
            os = 'Windows';
        } else if (/Linux/.test(ua)) {
            os = 'Linux';
        }
        
        return { device, browser, os };
    },
    
    /**
     * IPアドレスと位置情報を取得（無料API使用）
     * @returns {Promise<object>} - {ip, location}
     */
    async getIPAddress() {
        try {
            // IPアドレス取得（ipify - 完全無料）
            const ipResponse = await fetch('https://api.ipify.org?format=json', {
                timeout: 3000
            });
            const ipData = await ipResponse.json();
            const ip = ipData.ip;
            
            // 位置情報取得（ip-api.com - 月間45リクエストまで無料、それ以降も非商用なら無料）
            try {
                const locationResponse = await fetch(`http://ip-api.com/json/${ip}?lang=ja`, {
                    timeout: 3000
                });
                const locationData = await locationResponse.json();
                
                if (locationData.status === 'success') {
                    const location = `${locationData.country || ''}${locationData.city ? ' · ' + locationData.city : ''}`;
                    return { ip, location: location || 'Unknown' };
                }
            } catch (locError) {
                console.warn('位置情報取得失敗:', locError);
            }
            
            return { ip, location: 'Unknown' };
            
        } catch (error) {
            console.error('IPアドレス取得エラー:', error);
            return { ip: 'Unknown', location: 'Unknown' };
        }
    },
    
    // ========================================
    // セキュリティ分析
    // ========================================
    
    /**
     * 異常なログイン活動を検知
     * @param {string} userId - ユーザーID
     * @param {object} deviceInfo - デバイス情報
     * @param {object} ipData - IPアドレスデータ
     * @returns {Promise<boolean>} - 異常あり/なし
     */
    async detectSuspiciousActivity(userId, deviceInfo, ipData) {
        try {
            // 過去のログイン履歴を取得（最新10件）
            const history = await this.getHistory(userId, 10);
            
            if (history.length === 0) {
                // 初回ログインは異常なし
                return false;
            }
            
            // 最近の成功したログインのみ抽出
            const recentSuccessful = history.filter(h => h.success);
            
            if (recentSuccessful.length === 0) {
                return false;
            }
            
            // 異常検知条件
            let suspiciousScore = 0;
            
            // 1. 新しいIPアドレス
            const knownIPs = [...new Set(recentSuccessful.map(h => h.ip_address))];
            if (!knownIPs.includes(ipData.ip)) {
                suspiciousScore += 2;
            }
            
            // 2. 新しい国・都市
            const knownLocations = [...new Set(recentSuccessful.map(h => h.location))];
            if (!knownLocations.includes(ipData.location)) {
                suspiciousScore += 1;
            }
            
            // 3. 新しいデバイス
            const knownDevices = [...new Set(recentSuccessful.map(h => h.device_info))];
            if (!knownDevices.includes(deviceInfo.device)) {
                suspiciousScore += 1;
            }
            
            // 4. 短時間に異なる場所からのログイン
            const lastLogin = recentSuccessful[0];
            const timeDiff = Date.now() - lastLogin.login_time;
            if (timeDiff < 60 * 60 * 1000 && lastLogin.location !== ipData.location) {
                // 1時間以内に異なる場所
                suspiciousScore += 3;
            }
            
            // スコア3以上で異常と判定
            return suspiciousScore >= 3;
            
        } catch (error) {
            console.error('異常検知エラー:', error);
            return false;
        }
    },
    
    /**
     * ログイン統計を取得
     * @param {string} userId - ユーザーID
     * @returns {Promise<object>} - 統計情報
     */
    async getStatistics(userId) {
        try {
            const history = await this.getHistory(userId, 100);
            
            const totalLogins = history.length;
            const successfulLogins = history.filter(h => h.success).length;
            const failedLogins = totalLogins - successfulLogins;
            const twoFactorLogins = history.filter(h => h.two_factor_used).length;
            const suspiciousLogins = history.filter(h => h.is_suspicious).length;
            
            // 使用デバイス
            const devices = [...new Set(history.map(h => h.device_info))];
            
            // 使用ブラウザ
            const browsers = [...new Set(history.map(h => h.browser))];
            
            // ログイン方法の内訳
            const methods = {};
            history.forEach(h => {
                methods[h.login_method] = (methods[h.login_method] || 0) + 1;
            });
            
            return {
                totalLogins,
                successfulLogins,
                failedLogins,
                twoFactorLogins,
                suspiciousLogins,
                devices,
                browsers,
                methods
            };
            
        } catch (error) {
            console.error('統計取得エラー:', error);
            return null;
        }
    }
};

// ========================================
// グローバル公開
// ========================================
window.LoginHistory = LoginHistory;

console.log('✅ ログイン履歴システム (LoginHistory) ロード完了');
