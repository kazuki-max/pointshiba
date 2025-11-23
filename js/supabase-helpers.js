/**
 * ============================================
 * Supabase ヘルパー関数
 * ============================================
 * 
 * データベース操作を簡単に行うための関数群
 */

class SupabaseHelper {
    constructor() {
        this.client = window.supabaseClient;
    }

    // ========================================
    // ユーザー関連
    // ========================================

    /**
     * 新規ユーザー登録
     */
    async createUser(userData) {
        try {
            const { data, error } = await this.client
                .from('users')
                .insert([userData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ ユーザー登録エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * メールアドレスまたはユーザー名でユーザーを取得
     */
    async getUserByEmailOrUsername(identifier) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .or(`email.eq.${identifier},username.eq.${identifier}`)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ ユーザー取得エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ユーザーIDでユーザー情報取得
     */
    async getUserById(userId) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ ユーザー取得エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ユーザー情報更新
     */
    async updateUser(userId, updates) {
        try {
            updates.updated_at = new Date().toISOString();
            
            const { data, error } = await this.client
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ ユーザー更新エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ポイント加算
     */
    async addPoints(userId, points, type, source, description) {
        try {
            // ユーザーのポイント更新
            const { data: userData, error: userError } = await this.client
                .rpc('add_user_points', {
                    user_id: userId,
                    points_to_add: points
                });

            if (userError) throw userError;

            // ポイント履歴に記録
            const { data: historyData, error: historyError } = await this.client
                .from('points_history')
                .insert([{
                    user_id: userId,
                    points: points,
                    type: type,
                    source: source,
                    description: description
                }])
                .select()
                .single();

            if (historyError) throw historyError;

            return { success: true, data: { user: userData, history: historyData } };
        } catch (error) {
            console.error('❌ ポイント加算エラー:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // 案件関連
    // ========================================

    /**
     * 全案件取得
     */
    async getAllCases(filters = {}) {
        try {
            let query = this.client
                .from('cases')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            // カテゴリフィルター
            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            // ステータスフィルター
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ 案件取得エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 案件詳細取得
     */
    async getCaseById(caseId) {
        try {
            const { data, error } = await this.client
                .from('cases')
                .select('*')
                .eq('id', caseId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ 案件詳細取得エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 新規案件作成（管理者用）
     */
    async createCase(caseData) {
        try {
            const { data, error } = await this.client
                .from('cases')
                .insert([caseData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ 案件作成エラー:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // アンケート関連
    // ========================================

    /**
     * 全アンケート取得
     */
    async getAllSurveys() {
        try {
            const { data, error } = await this.client
                .from('surveys')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ アンケート取得エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * アンケート回答送信
     */
    async submitSurveyResponse(surveyId, userId, answers) {
        try {
            const { data, error } = await this.client
                .from('survey_responses')
                .insert([{
                    survey_id: surveyId,
                    user_id: userId,
                    answers: answers
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ アンケート回答エラー:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // 通知関連
    // ========================================

    /**
     * ユーザーの通知取得
     */
    async getUserNotifications(userId, limit = 20) {
        try {
            const { data, error } = await this.client
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ 通知取得エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 通知を既読にする
     */
    async markNotificationAsRead(notificationId) {
        try {
            const { data, error } = await this.client
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ 通知既読エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 新規通知作成
     */
    async createNotification(notificationData) {
        try {
            const { data, error } = await this.client
                .from('notifications')
                .insert([notificationData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ 通知作成エラー:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // 紹介関連
    // ========================================

    /**
     * 紹介コードで紹介者を取得
     */
    async getReferrerByCode(referralCode) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('id, username, referral_code')
                .eq('referral_code', referralCode)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ 紹介者取得エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 紹介記録作成
     */
    async createReferral(referrerId, referredId) {
        try {
            const { data, error } = await this.client
                .from('referrals')
                .insert([{
                    referrer_id: referrerId,
                    referred_id: referredId,
                    status: 'pending'
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ 紹介記録エラー:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // ログイン履歴関連
    // ========================================

    /**
     * ログイン履歴記録
     */
    async createLoginHistory(userId, ipAddress, userAgent, status = 'success') {
        try {
            const { data, error } = await this.client
                .from('login_history')
                .insert([{
                    user_id: userId,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    status: status
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ ログイン履歴エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ユーザーのログイン履歴取得
     */
    async getLoginHistory(userId, limit = 10) {
        try {
            const { data, error } = await this.client
                .from('login_history')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ ログイン履歴取得エラー:', error);
            return { success: false, error: error.message };
        }
    }
}

// グローバル変数として設定
window.supabaseHelper = new SupabaseHelper();

console.log('✅ Supabaseヘルパー関数読み込み完了');
