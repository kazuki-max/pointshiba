// ========================================
// PointMax 拡張機能モジュール
// ========================================

// ========================================
// 1. 友達紹介システム
// ========================================

const ReferralSystem = {
    // 紹介コード生成
    generateReferralCode(userId) {
        const prefix = 'PM';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = prefix;
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },
    
    // 紹介リンク生成
    generateReferralLink(code) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/mobile.html?ref=${code}`;
    },
    
    // 紹介を記録 ★UPDATED - 報酬アップ方式
    async recordReferral(referrerCode, newUserId) {
        try {
            // 紹介者を検索
            const usersResponse = await fetch(`tables/users?limit=1000`);
            const usersData = await usersResponse.json();
            const referrer = usersData.data.find(u => u.referral_code === referrerCode);
            
            if (!referrer) return null;
            
            // 新しい紹介人数とボーナス率を計算
            const newTotalReferrals = (referrer.total_referrals || 0) + 1;
            const newReferralBonus = Math.min(newTotalReferrals * 2, 10); // 1人=2%、最大10%
            
            // 紹介記録を作成
            const referral = {
                referrer_id: referrer.id,
                referred_id: newUserId,
                referral_code: referrerCode,
                bonus_earned: 500, // 一時的なウェルカムボーナス（別途）
                status: 'completed'
            };
            
            const response = await fetch('tables/referrals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(referral)
            });
            
            if (response.ok) {
                // 紹介者のボーナス率を更新 ★NEW
                await fetch(`tables/users/${referrer.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        total_referrals: newTotalReferrals,
                        referral_bonus_rate: newReferralBonus,
                        total_points: referrer.total_points + 500, // ウェルカムボーナス
                        available_points: referrer.available_points + 500
                    })
                });
                
                // 被紹介者にもボーナス
                await fetch(`tables/users/${newUserId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        total_points: 300,
                        available_points: 300
                    })
                });
                
                // 通知を送信 ★UPDATED
                let notificationMessage = `友達があなたの紹介で登録しました！\n💰 500pt獲得\n🎁 報酬が+${newReferralBonus}%にアップしました！`;
                if (newTotalReferrals >= 5) {
                    notificationMessage += '\n⭐ 最大ボーナス（10%）達成おめでとうございます！';
                }
                
                await NotificationSystem.create(referrer.id, {
                    title: '🎉 友達紹介ボーナス',
                    message: notificationMessage,
                    type: 'point',
                    icon: 'fa-users'
                });
                
                return await response.json();
            }
        } catch (error) {
            console.error('紹介記録失敗:', error);
            return null;
        }
    },
    
    // 紹介ランキング取得
    async getReferralRanking(limit = 10) {
        try {
            const response = await fetch(`tables/users?limit=1000`);
            const data = await response.json();
            return data.data
                .sort((a, b) => b.total_referrals - a.total_referrals)
                .slice(0, limit);
        } catch (error) {
            console.error('ランキング取得失敗:', error);
            return [];
        }
    }
};

// ========================================
// 2. 通知システム
// ========================================

const NotificationSystem = {
    // 通知作成
    async create(userId, notification) {
        try {
            const notificationData = {
                user_id: userId,
                title: notification.title,
                message: notification.message,
                type: notification.type || 'system',
                icon: notification.icon || 'fa-bell',
                link: notification.link || '',
                is_read: false
            };
            
            const response = await fetch('tables/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificationData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('通知作成失敗:', error);
            return null;
        }
    },
    
    // ユーザーの通知取得
    async getUserNotifications(userId, unreadOnly = false) {
        try {
            const response = await fetch(`tables/notifications?limit=100`);
            const data = await response.json();
            let notifications = data.data.filter(n => n.user_id === userId);
            
            if (unreadOnly) {
                notifications = notifications.filter(n => !n.is_read);
            }
            
            return notifications.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );
        } catch (error) {
            console.error('通知取得失敗:', error);
            return [];
        }
    },
    
    // 通知を既読にする
    async markAsRead(notificationId) {
        try {
            await fetch(`tables/notifications/${notificationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: true })
            });
        } catch (error) {
            console.error('既読更新失敗:', error);
        }
    },
    
    // 全ての通知を既読にする
    async markAllAsRead(userId) {
        const notifications = await this.getUserNotifications(userId, true);
        await Promise.all(notifications.map(n => this.markAsRead(n.id)));
    }
};

// ========================================
// 3. お気に入りシステム
// ========================================

const FavoriteSystem = {
    // お気に入り追加
    async add(userId, caseId) {
        try {
            const favorite = {
                user_id: userId,
                case_id: caseId
            };
            
            const response = await fetch('tables/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(favorite)
            });
            
            return await response.json();
        } catch (error) {
            console.error('お気に入り追加失敗:', error);
            return null;
        }
    },
    
    // お気に入り削除
    async remove(userId, caseId) {
        try {
            const response = await fetch(`tables/favorites?limit=1000`);
            const data = await response.json();
            const favorite = data.data.find(f => 
                f.user_id === userId && f.case_id === caseId
            );
            
            if (favorite) {
                await fetch(`tables/favorites/${favorite.id}`, {
                    method: 'DELETE'
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('お気に入り削除失敗:', error);
            return false;
        }
    },
    
    // お気に入りチェック
    async isFavorite(userId, caseId) {
        try {
            const response = await fetch(`tables/favorites?limit=1000`);
            const data = await response.json();
            return data.data.some(f => 
                f.user_id === userId && f.case_id === caseId
            );
        } catch (error) {
            console.error('お気に入りチェック失敗:', error);
            return false;
        }
    },
    
    // ユーザーのお気に入り一覧
    async getUserFavorites(userId) {
        try {
            const response = await fetch(`tables/favorites?limit=1000`);
            const data = await response.json();
            return data.data.filter(f => f.user_id === userId);
        } catch (error) {
            console.error('お気に入り取得失敗:', error);
            return [];
        }
    }
};

// ========================================
// 4. レビューシステム
// ========================================

const ReviewSystem = {
    // レビュー投稿
    async post(userId, caseId, rating, comment) {
        try {
            const review = {
                user_id: userId,
                case_id: caseId,
                rating: rating,
                comment: comment,
                helpful_count: 0
            };
            
            const response = await fetch('tables/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(review)
            });
            
            return await response.json();
        } catch (error) {
            console.error('レビュー投稿失敗:', error);
            return null;
        }
    },
    
    // 案件のレビュー取得
    async getCaseReviews(caseId) {
        try {
            const response = await fetch(`tables/reviews?limit=1000`);
            const data = await response.json();
            return data.data
                .filter(r => r.case_id === caseId)
                .sort((a, b) => b.helpful_count - a.helpful_count);
        } catch (error) {
            console.error('レビュー取得失敗:', error);
            return [];
        }
    },
    
    // 平均評価取得
    async getAverageRating(caseId) {
        const reviews = await this.getCaseReviews(caseId);
        if (reviews.length === 0) return 0;
        
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / reviews.length).toFixed(1);
    },
    
    // 参考になったを追加
    async addHelpful(reviewId) {
        try {
            const response = await fetch(`tables/reviews?limit=1000`);
            const data = await response.json();
            const review = data.data.find(r => r.id === reviewId);
            
            if (review) {
                await fetch(`tables/reviews/${reviewId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        helpful_count: review.helpful_count + 1
                    })
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('参考になった追加失敗:', error);
            return false;
        }
    }
};

// ========================================
// 5. キャンペーンシステム
// ========================================

const CampaignSystem = {
    // アクティブなキャンペーン取得
    async getActiveCampaigns() {
        try {
            const response = await fetch(`tables/campaigns?limit=100`);
            const data = await response.json();
            const now = new Date();
            
            return data.data.filter(c => {
                if (!c.is_active) return false;
                const start = new Date(c.start_date);
                const end = new Date(c.end_date);
                return now >= start && now <= end;
            });
        } catch (error) {
            console.error('キャンペーン取得失敗:', error);
            return [];
        }
    },
    
    // カテゴリー別キャンペーン適用
    async applyBoost(category, basePoints) {
        const campaigns = await this.getActiveCampaigns();
        const categoryBoost = campaigns.find(c => 
            c.type === 'point_boost' && c.target_category === category
        );
        
        if (categoryBoost) {
            return Math.floor(basePoints * categoryBoost.boost_multiplier);
        }
        
        return basePoints;
    },
    
    // キャンペーン作成
    async create(campaignData) {
        try {
            const response = await fetch('tables/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('キャンペーン作成失敗:', error);
            return null;
        }
    }
};

// ========================================
// 6. クーポンシステム
// ========================================

const CouponSystem = {
    // クーポン使用
    async use(userId, code) {
        try {
            const response = await fetch(`tables/coupons?limit=1000`);
            const data = await response.json();
            const coupon = data.data.find(c => 
                c.code === code && c.is_active
            );
            
            if (!coupon) {
                return { success: false, message: '無効なクーポンコードです' };
            }
            
            // 有効期限チェック
            if (new Date(coupon.expiry_date) < new Date()) {
                return { success: false, message: 'クーポンの有効期限が切れています' };
            }
            
            // 使用上限チェック
            if (coupon.used_count >= coupon.usage_limit) {
                return { success: false, message: 'クーポンの使用上限に達しています' };
            }
            
            // 使用カウント更新
            await fetch(`tables/coupons/${coupon.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    used_count: coupon.used_count + 1
                })
            });
            
            // ユーザーにポイント付与
            const userResponse = await fetch(`tables/users?limit=1000`);
            const userData = await userResponse.json();
            const user = userData.data.find(u => u.id === userId);
            
            if (user) {
                await fetch(`tables/users/${userId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        total_points: user.total_points + coupon.bonus_points,
                        available_points: user.available_points + coupon.bonus_points
                    })
                });
                
                // 通知
                await NotificationSystem.create(userId, {
                    title: 'クーポン使用',
                    message: `クーポン「${code}」で${coupon.bonus_points}pt獲得！`,
                    type: 'point',
                    icon: 'fa-ticket-alt'
                });
                
                return { 
                    success: true, 
                    message: `${coupon.bonus_points}ポイント獲得しました！`,
                    points: coupon.bonus_points
                };
            }
            
            return { success: false, message: 'ユーザーが見つかりません' };
        } catch (error) {
            console.error('クーポン使用失敗:', error);
            return { success: false, message: 'エラーが発生しました' };
        }
    },
    
    // クーポン作成
    async create(couponData) {
        try {
            const response = await fetch('tables/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(couponData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('クーポン作成失敗:', error);
            return null;
        }
    }
};

// ========================================
// 7. ガチャシステム
// ========================================

const GachaSystem = {
    prizes: [
        { points: 10, rarity: 'common', probability: 0.4 },
        { points: 50, rarity: 'common', probability: 0.3 },
        { points: 100, rarity: 'rare', probability: 0.15 },
        { points: 500, rarity: 'epic', probability: 0.1 },
        { points: 1000, rarity: 'epic', probability: 0.04 },
        { points: 5000, rarity: 'legendary', probability: 0.01 }
    ],
    
    // ガチャを引く
    async play(userId, gachaType = 'daily') {
        try {
            // ランダムで景品決定
            const random = Math.random();
            let cumulative = 0;
            let prize = this.prizes[0];
            
            for (const p of this.prizes) {
                cumulative += p.probability;
                if (random <= cumulative) {
                    prize = p;
                    break;
                }
            }
            
            // ガチャ履歴記録
            const history = {
                user_id: userId,
                gacha_type: gachaType,
                prize_points: prize.points,
                rarity: prize.rarity
            };
            
            await fetch('tables/gacha_history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(history)
            });
            
            // ユーザーにポイント付与
            const userResponse = await fetch(`tables/users?limit=1000`);
            const userData = await userResponse.json();
            const user = userData.data.find(u => u.id === userId);
            
            if (user) {
                await fetch(`tables/users/${userId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        total_points: user.total_points + prize.points,
                        available_points: user.available_points + prize.points
                    })
                });
            }
            
            return prize;
        } catch (error) {
            console.error('ガチャ失敗:', error);
            return null;
        }
    },
    
    // 今日のガチャ回数チェック
    async canPlayToday(userId) {
        try {
            const response = await fetch(`tables/gacha_history?limit=1000`);
            const data = await response.json();
            const today = new Date().toISOString().split('T')[0];
            
            const todayPlays = data.data.filter(g => 
                g.user_id === userId && 
                g.created_at && 
                g.created_at.startsWith(today)
            );
            
            return todayPlays.length < 3; // 1日3回まで
        } catch (error) {
            console.error('ガチャ回数チェック失敗:', error);
            return false;
        }
    }
};

// ========================================
// 8. ランキングシステム
// ========================================

const RankingSystem = {
    // ポイントランキング取得
    async getPointsRanking(period = 'all', limit = 100) {
        try {
            const response = await fetch(`tables/users?limit=1000`);
            const data = await response.json();
            
            let users = data.data;
            
            // 期間フィルター（簡易版 - 実装時は履歴から集計）
            if (period === 'weekly' || period === 'monthly') {
                // 実装: point_historyから期間集計
                // 現在は全期間で代用
            }
            
            return users
                .sort((a, b) => b.total_points - a.total_points)
                .slice(0, limit)
                .map((user, index) => ({
                    rank: index + 1,
                    user: user,
                    points: user.total_points
                }));
        } catch (error) {
            console.error('ランキング取得失敗:', error);
            return [];
        }
    },
    
    // ユーザーの順位取得
    async getUserRank(userId) {
        const ranking = await this.getPointsRanking('all', 1000);
        const userRank = ranking.find(r => r.user.id === userId);
        return userRank ? userRank.rank : null;
    }
};

// ========================================
// 9. 検索システム
// ========================================

// ========================================
// 9. アンケートシステム
// ========================================

const SurveySystem = {
    // アクティブなアンケート一覧を取得
    async getActiveSurveys() {
        try {
            const response = await fetch('tables/surveys?limit=100');
            const data = await response.json();
            
            const now = new Date();
            return data.data.filter(survey => {
                if (survey.status !== 'active') return false;
                
                const startDate = new Date(survey.start_date);
                const endDate = new Date(survey.end_date);
                
                return now >= startDate && now <= endDate && survey.current_responses < survey.target_responses;
            });
        } catch (error) {
            console.error('Error fetching surveys:', error);
            return [];
        }
    },
    
    // アンケート詳細を取得（質問含む）
    async getSurveyDetails(surveyId) {
        try {
            const surveyResponse = await fetch(`tables/surveys/${surveyId}`);
            const survey = await surveyResponse.json();
            
            const questionsResponse = await fetch(`tables/survey_questions?limit=100`);
            const questionsData = await questionsResponse.json();
            const questions = questionsData.data
                .filter(q => q.survey_id === surveyId)
                .sort((a, b) => a.question_number - b.question_number);
            
            return { survey, questions };
        } catch (error) {
            console.error('Error fetching survey details:', error);
            return null;
        }
    },
    
    // ユーザーが回答済みか確認
    async hasUserCompleted(surveyId, userId) {
        try {
            const response = await fetch('tables/survey_completions?limit=1000');
            const data = await response.json();
            
            return data.data.some(c => c.survey_id === surveyId && c.user_id === userId);
        } catch (error) {
            console.error('Error checking completion:', error);
            return false;
        }
    },
    
    // アンケート回答を保存
    async submitSurveyResponse(surveyId, userId, answers) {
        try {
            // 各質問の回答を保存
            for (const answer of answers) {
                const responseData = {
                    survey_id: surveyId,
                    user_id: userId,
                    question_id: answer.question_id,
                    answer_text: answer.answer_text || '',
                    answer_options: answer.answer_options || [],
                    answer_rating: answer.answer_rating || 0,
                    responded_at: new Date().toISOString()
                };
                
                await fetch('tables/survey_responses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(responseData)
                });
            }
            
            // 完了記録を作成
            const surveyResponse = await fetch(`tables/surveys/${surveyId}`);
            const survey = await surveyResponse.json();
            
            // ユーザーのボーナス率を取得 ★UPDATED
            const userResponse = await fetch(`tables/users/${userId}`);
            const user = await userResponse.json();
            const profileBonus = user.profile_bonus_rate || 0;
            const referralBonus = user.referral_bonus_rate || 0;
            const bonusRate = profileBonus + referralBonus;
            const bonusMultiplier = 1 + (bonusRate / 100);
            
            // ボーナス適用後のポイント
            const basePoints = survey.points_per_response;
            const earnedPoints = Math.floor(basePoints * bonusMultiplier);
            
            const completionData = {
                survey_id: surveyId,
                user_id: userId,
                points_earned: earnedPoints,
                completed_at: new Date().toISOString(),
                completion_time_seconds: 0
            };
            
            await fetch('tables/survey_completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(completionData)
            });
            
            // アンケートの回答数を更新
            await fetch(`tables/surveys/${surveyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    current_responses: survey.current_responses + 1 
                })
            });
            
            return { success: true, points: earnedPoints, bonusRate };
        } catch (error) {
            console.error('Error submitting survey:', error);
            return { success: false, error: error.message };
        }
    },
    
    // アンケート結果を取得（管理者用）
    async getSurveyResults(surveyId) {
        try {
            const responsesResponse = await fetch('tables/survey_responses?limit=10000');
            const responsesData = await responsesResponse.json();
            const responses = responsesData.data.filter(r => r.survey_id === surveyId);
            
            const questionsResponse = await fetch('tables/survey_questions?limit=100');
            const questionsData = await questionsResponse.json();
            const questions = questionsData.data
                .filter(q => q.survey_id === surveyId)
                .sort((a, b) => a.question_number - b.question_number);
            
            // 質問ごとに集計
            const results = questions.map(question => {
                const questionResponses = responses.filter(r => r.question_id === question.id);
                
                let analysis = {};
                
                if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
                    // 選択肢ごとの集計
                    analysis = {};
                    question.options.forEach(option => {
                        analysis[option] = questionResponses.filter(r => 
                            r.answer_options.includes(option)
                        ).length;
                    });
                } else if (question.question_type === 'rating') {
                    // 平均評価
                    const ratings = questionResponses.map(r => r.answer_rating).filter(r => r > 0);
                    analysis = {
                        average: ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 0,
                        count: ratings.length
                    };
                } else if (question.question_type === 'yes_no') {
                    // Yes/Noの集計
                    const yes = questionResponses.filter(r => r.answer_text.toLowerCase() === 'yes').length;
                    const no = questionResponses.filter(r => r.answer_text.toLowerCase() === 'no').length;
                    analysis = { yes, no };
                } else {
                    // テキスト回答
                    analysis = {
                        responses: questionResponses.map(r => r.answer_text)
                    };
                }
                
                return {
                    question,
                    responseCount: questionResponses.length,
                    analysis
                };
            });
            
            return results;
        } catch (error) {
            console.error('Error fetching survey results:', error);
            return [];
        }
    },
    
    // 自社アンケートを作成
    async createInternalSurvey(surveyData, questions) {
        try {
            // アンケートを作成
            const internalSurveyData = {
                ...surveyData,
                survey_type: 'internal',
                client_name: 'ポイしば',
                client_email: 'survey@pointshiba.jp',
                client_company: 'ポイしば運営',
                payment_status: 'paid',
                status: 'active'
            };
            
            const surveyResponse = await fetch('tables/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(internalSurveyData)
            });
            
            if (!surveyResponse.ok) {
                throw new Error('アンケートの作成に失敗しました');
            }
            
            const survey = await surveyResponse.json();
            
            // 質問を作成
            for (let i = 0; i < questions.length; i++) {
                const questionData = {
                    survey_id: survey.id,
                    question_number: i + 1,
                    ...questions[i]
                };
                
                await fetch('tables/survey_questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(questionData)
                });
            }
            
            return { success: true, survey };
        } catch (error) {
            console.error('Error creating survey:', error);
            return { success: false, error: error.message };
        }
    },
    
    // アンケート注文一覧を取得（管理者用）
    async getSurveyOrders(status = null) {
        try {
            const response = await fetch('tables/survey_orders?limit=100');
            const data = await response.json();
            
            if (status) {
                return data.data.filter(o => o.status === status);
            }
            
            return data.data;
        } catch (error) {
            console.error('Error fetching survey orders:', error);
            return [];
        }
    },
    
    // 注文を承認してアンケートを公開
    async approveSurveyOrder(orderId) {
        try {
            // 注文を取得
            const orderResponse = await fetch(`tables/survey_orders/${orderId}`);
            const order = await orderResponse.json();
            
            // 注文ステータスを更新
            await fetch(`tables/survey_orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'approved',
                    payment_status: 'paid'
                })
            });
            
            // アンケートをアクティブ化 ★UPDATED
            if (order.survey_id) {
                // クライアント直接アンケートは認証必須 ★NEW
                await fetch(`tables/surveys/${order.survey_id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        status: 'active',
                        payment_status: 'paid',
                        requires_email_verification: true,
                        requires_phone_verification: true
                    })
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error approving survey order:', error);
            return { success: false, error: error.message };
        }
    }
};

// ========================================
// 10. 検索システム
// ========================================

const SearchSystem = {
    // 案件検索
    async search(query, filters = {}) {
        try {
            const response = await fetch(`tables/cases?limit=1000`);
            const data = await response.json();
            let cases = data.data;
            
            // キーワード検索
            if (query) {
                const lowerQuery = query.toLowerCase();
                cases = cases.filter(c => 
                    c.title.toLowerCase().includes(lowerQuery) ||
                    c.description.toLowerCase().includes(lowerQuery)
                );
            }
            
            // カテゴリーフィルター
            if (filters.categories && filters.categories.length > 0) {
                cases = cases.filter(c => filters.categories.includes(c.category));
            }
            
            // ポイント範囲フィルター
            if (filters.minPoints) {
                cases = cases.filter(c => c.points >= filters.minPoints);
            }
            if (filters.maxPoints) {
                cases = cases.filter(c => c.points <= filters.maxPoints);
            }
            
            // 難易度フィルター
            if (filters.difficulty) {
                cases = cases.filter(c => c.difficulty === filters.difficulty);
            }
            
            // ソート
            if (filters.sort) {
                switch (filters.sort) {
                    case 'points_desc':
                        cases.sort((a, b) => b.points - a.points);
                        break;
                    case 'points_asc':
                        cases.sort((a, b) => a.points - b.points);
                        break;
                    case 'popular':
                        cases.sort((a, b) => b.completion_count - a.completion_count);
                        break;
                    case 'new':
                        cases = cases.filter(c => c.is_new);
                        break;
                }
            }
            
            return cases;
        } catch (error) {
            console.error('検索失敗:', error);
            return [];
        }
    }
};

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ReferralSystem,
        NotificationSystem,
        FavoriteSystem,
        ReviewSystem,
        CampaignSystem,
        CouponSystem,
        GachaSystem,
        RankingSystem,
        SearchSystem,
        SurveySystem
    };
}
