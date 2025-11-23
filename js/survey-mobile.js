// ========================================
// モバイル版アンケートシステム
// ========================================

let internalQuestions = [];
let internalQuestionCounter = 1;
let currentSurveyForAnswer = null;
let surveyStartTime = null;

// ========================================
// 管理者用: タブ切り替え
// ========================================

window.switchSurveyTab = function(tabName) {
    // すべてのタブボタンを非アクティブ化
    document.querySelectorAll('.survey-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // すべてのタブコンテンツを非表示
    document.querySelectorAll('.survey-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // 選択されたタブをアクティブ化
    document.getElementById(`surveyTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
    
    // 選択されたタブコンテンツを表示
    if (tabName === 'create') {
        document.getElementById('surveyCreateTab').classList.remove('hidden');
        loadActiveSurveys();
    } else if (tabName === 'orders') {
        document.getElementById('surveyOrdersTab').classList.remove('hidden');
        loadSurveyOrders();
    } else if (tabName === 'results') {
        document.getElementById('surveyResultsTab').classList.remove('hidden');
        loadSurveyResultsSelect();
    }
};

// ========================================
// 自社アンケート作成
// ========================================

window.showCreateSurveyForm = function() {
    document.getElementById('createSurveyForm').classList.remove('hidden');
    
    // 日付のデフォルト値を設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('internalStartDate').value = today;
    
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    document.getElementById('internalEndDate').value = weekLater.toISOString().split('T')[0];
    
    // 初期質問を追加
    if (internalQuestions.length === 0) {
        addInternalQuestion();
    }
};

window.hideCreateSurveyForm = function() {
    document.getElementById('createSurveyForm').classList.add('hidden');
    internalQuestions = [];
    internalQuestionCounter = 1;
    document.getElementById('internalQuestionsList').innerHTML = '';
};

window.addInternalQuestion = function() {
    const questionId = `internal_q_${internalQuestionCounter++}`;
    const questionNumber = internalQuestions.length + 1;
    
    const questionData = {
        id: questionId,
        question_text: '',
        question_type: 'single_choice',
        options: ['選択肢1', '選択肢2'],
        is_required: true
    };
    
    internalQuestions.push(questionData);
    
    const questionHtml = `
        <div id="${questionId}" class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div class="flex justify-between items-center mb-3">
                <h5 class="font-bold">質問 ${questionNumber}</h5>
                <button type="button" onclick="removeInternalQuestion('${questionId}')" class="text-red-500 text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <input type="text" placeholder="質問文" 
                       onchange="updateInternalQuestion('${questionId}', 'question_text', this.value)"
                       class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                
                <select onchange="handleInternalQuestionTypeChange('${questionId}', this.value)"
                        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="single_choice">単一選択</option>
                    <option value="multiple_choice">複数選択</option>
                    <option value="text">自由記述</option>
                    <option value="rating">評価</option>
                    <option value="yes_no">Yes/No</option>
                </select>
                
                <div id="${questionId}_options">
                    <input type="text" value="選択肢1" 
                           onchange="updateInternalOption('${questionId}', 0, this.value)"
                           class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-2">
                    <input type="text" value="選択肢2" 
                           onchange="updateInternalOption('${questionId}', 1, this.value)"
                           class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('internalQuestionsList').insertAdjacentHTML('beforeend', questionHtml);
};

window.updateInternalQuestion = function(questionId, field, value) {
    const question = internalQuestions.find(q => q.id === questionId);
    if (question) {
        question[field] = value;
    }
};

window.updateInternalOption = function(questionId, index, value) {
    const question = internalQuestions.find(q => q.id === questionId);
    if (question) {
        question.options[index] = value;
    }
};

window.handleInternalQuestionTypeChange = function(questionId, newType) {
    const question = internalQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    question.question_type = newType;
    
    // 選択式以外の場合は選択肢をクリア
    if (newType !== 'single_choice' && newType !== 'multiple_choice') {
        question.options = [];
        document.getElementById(`${questionId}_options`).innerHTML = '';
    }
};

window.removeInternalQuestion = function(questionId) {
    const index = internalQuestions.findIndex(q => q.id === questionId);
    if (index !== -1) {
        internalQuestions.splice(index, 1);
    }
    document.getElementById(questionId).remove();
};

window.saveInternalSurvey = async function() {
    const title = document.getElementById('internalSurveyTitle').value.trim();
    const description = document.getElementById('internalSurveyDescription').value.trim();
    const targetResponses = parseInt(document.getElementById('internalTargetResponses').value);
    const pointsPerResponse = parseInt(document.getElementById('internalPointsPerResponse').value);
    const estimatedTime = document.getElementById('internalEstimatedTime').value;
    const category = document.getElementById('internalCategory').value;
    const startDate = document.getElementById('internalStartDate').value;
    const endDate = document.getElementById('internalEndDate').value;
    
    if (!title || !description || !targetResponses || !pointsPerResponse) {
        showToast('必須項目を入力してください', 'error');
        return;
    }
    
    if (internalQuestions.length === 0) {
        showToast('少なくとも1つの質問を追加してください', 'error');
        return;
    }
    
    // 認証設定を取得 ★NEW
    const requiresEmailVerification = document.getElementById('internalRequiresEmailVerification').checked;
    const requiresPhoneVerification = document.getElementById('internalRequiresPhoneVerification').checked;
    
    const surveyData = {
        title,
        description,
        target_responses: targetResponses,
        points_per_response: pointsPerResponse,
        estimated_time: estimatedTime,
        category,
        start_date: startDate,
        end_date: endDate,
        current_responses: 0,
        image_url: 'https://images.unsplash.com/photo-1586282391129-76a6df230234?w=800&h=600&fit=crop',
        requires_email_verification: requiresEmailVerification,
        requires_phone_verification: requiresPhoneVerification
    };
    
    const questions = internalQuestions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        is_required: q.is_required,
        min_rating: 1,
        max_rating: 5
    }));
    
    const result = await SurveySystem.createInternalSurvey(surveyData, questions);
    
    if (result.success) {
        showToast('アンケートを作成しました！', 'success');
        hideCreateSurveyForm();
        loadActiveSurveys();
    } else {
        showToast('作成に失敗しました', 'error');
    }
};

// ========================================
// アクティブなアンケート一覧
// ========================================

async function loadActiveSurveys() {
    const surveys = await SurveySystem.getActiveSurveys();
    const container = document.getElementById('activeSurveysList');
    
    if (surveys.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-poll text-4xl mb-3"></i>
                <p class="text-sm">アクティブなアンケートがありません</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = surveys.map(survey => {
        // 認証要件バッジ ★NEW
        const requirementBadges = [];
        if (survey.requires_email_verification) {
            requirementBadges.push('<span class="text-xs px-2 py-1 rounded-full bg-green-600/50 border border-green-500"><i class="fas fa-envelope mr-1"></i>メール認証必須</span>');
        }
        if (survey.requires_phone_verification) {
            requirementBadges.push('<span class="text-xs px-2 py-1 rounded-full bg-blue-600/50 border border-blue-500"><i class="fas fa-mobile-alt mr-1"></i>電話認証必須</span>');
        }
        
        return `
        <div class="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold">${survey.title}</h4>
                <span class="text-xs px-2 py-1 rounded-full ${survey.survey_type === 'internal' ? 'bg-purple-600' : 'bg-blue-600'}">
                    ${survey.survey_type === 'internal' ? '自社' : 'クライアント'}
                </span>
            </div>
            <p class="text-sm text-gray-400 mb-3">${survey.description}</p>
            ${requirementBadges.length > 0 ? `<div class="flex flex-wrap gap-2 mb-3">${requirementBadges.join('')}</div>` : ''}
            <div class="flex justify-between items-center text-xs text-gray-500">
                <span><i class="fas fa-users mr-1"></i> ${survey.current_responses}/${survey.target_responses}回答</span>
                <span><i class="fas fa-coins mr-1"></i> ${survey.points_per_response}pt</span>
            </div>
        </div>
        `;
    }).join('');
}

// ========================================
// 依頼管理
// ========================================

async function loadSurveyOrders() {
    const orders = await SurveySystem.getSurveyOrders();
    const container = document.getElementById('surveyOrdersList');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-inbox text-4xl mb-3"></i>
                <p class="text-sm">依頼がありません</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h4 class="font-bold">${order.survey_title}</h4>
                    <p class="text-xs text-gray-400">${order.client_company}</p>
                </div>
                <span class="text-xs px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}">
                    ${getOrderStatusLabel(order.status)}
                </span>
            </div>
            <div class="text-sm text-gray-400 mb-3">
                <p>目標回答数: ${order.target_responses}</p>
                <p>費用: ¥${order.total_cost.toLocaleString()}</p>
            </div>
            ${order.status === 'pending' ? `
                <button onclick="approveSurveyOrder('${order.id}')" class="w-full bg-green-600 py-2 rounded-lg text-sm font-bold">
                    承認して公開
                </button>
            ` : ''}
        </div>
    `).join('');
}

function getOrderStatusColor(status) {
    const colors = {
        'pending': 'bg-yellow-600',
        'approved': 'bg-green-600',
        'active': 'bg-blue-600',
        'completed': 'bg-gray-600',
        'cancelled': 'bg-red-600'
    };
    return colors[status] || 'bg-gray-600';
}

function getOrderStatusLabel(status) {
    const labels = {
        'pending': '承認待ち',
        'approved': '承認済み',
        'active': '実施中',
        'completed': '完了',
        'cancelled': 'キャンセル'
    };
    return labels[status] || status;
}

window.approveSurveyOrder = async function(orderId) {
    if (!confirm('この依頼を承認してアンケートを公開しますか？')) return;
    
    const result = await SurveySystem.approveSurveyOrder(orderId);
    
    if (result.success) {
        showToast('アンケートを公開しました', 'success');
        loadSurveyOrders();
    } else {
        showToast('公開に失敗しました', 'error');
    }
};

// ========================================
// 結果分析
// ========================================

async function loadSurveyResultsSelect() {
    const surveys = await SurveySystem.getActiveSurveys();
    const select = document.getElementById('surveyResultSelect');
    
    select.innerHTML = '<option value="">選択してください</option>' + 
        surveys.map(s => `<option value="${s.id}">${s.title} (${s.current_responses}回答)</option>`).join('');
}

window.loadSurveyResults = async function(surveyId) {
    if (!surveyId) return;
    
    const results = await SurveySystem.getSurveyResults(surveyId);
    const container = document.getElementById('surveyResultsContent');
    
    if (results.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">まだ回答がありません</p>';
        return;
    }
    
    container.innerHTML = results.map((result, index) => `
        <div class="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <h4 class="font-bold mb-3">Q${index + 1}. ${result.question.question_text}</h4>
            <p class="text-xs text-gray-400 mb-3">回答数: ${result.responseCount}</p>
            ${renderQuestionAnalysis(result.question, result.analysis)}
        </div>
    `).join('');
};

function renderQuestionAnalysis(question, analysis) {
    if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
        return Object.entries(analysis).map(([option, count]) => `
            <div class="mb-2">
                <div class="flex justify-between text-sm mb-1">
                    <span>${option}</span>
                    <span class="font-bold">${count}票</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-purple-600 h-2 rounded-full" style="width: ${(count / Math.max(...Object.values(analysis)) * 100)}%"></div>
                </div>
            </div>
        `).join('');
    } else if (question.question_type === 'rating') {
        return `
            <div class="text-center">
                <p class="text-3xl font-black text-purple-400 mb-2">${analysis.average}</p>
                <p class="text-sm text-gray-400">平均評価 (${analysis.count}件)</p>
            </div>
        `;
    } else if (question.question_type === 'yes_no') {
        return `
            <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                    <p class="text-2xl font-bold text-green-400">${analysis.yes}</p>
                    <p class="text-sm text-gray-400">Yes</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold text-red-400">${analysis.no}</p>
                    <p class="text-sm text-gray-400">No</p>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="space-y-2 max-h-64 overflow-y-auto">
                ${analysis.responses.slice(0, 10).map(r => `
                    <div class="bg-gray-900/50 p-2 rounded text-sm">${r}</div>
                `).join('')}
                ${analysis.responses.length > 10 ? `<p class="text-xs text-gray-500 text-center">...他${analysis.responses.length - 10}件</p>` : ''}
            </div>
        `;
    }
}

// ========================================
// ユーザー向け: アンケート回答
// ========================================

window.openSurveyModal = async function(surveyId) {
    if (!MobileApp.isLoggedIn) {
        showLoginPrompt();
        return;
    }
    
    // 回答済みチェック
    const hasCompleted = await SurveySystem.hasUserCompleted(surveyId, MobileApp.currentUser.id);
    if (hasCompleted) {
        showToast('このアンケートは回答済みです', 'error');
        return;
    }
    
    const { survey, questions } = await SurveySystem.getSurveyDetails(surveyId);
    
    if (!survey) {
        showToast('アンケートが見つかりません', 'error');
        return;
    }
    
    // 認証チェック ★NEW
    if (survey.requires_email_verification && !MobileApp.currentUser.email_verified) {
        const confirmed = confirm(
            'このアンケートはメールアドレス認証が必要です。\n\n' +
            '認証画面に移動しますか？'
        );
        if (confirmed) {
            showScreen('emailVerificationScreen');
        }
        return;
    }
    
    if (survey.requires_phone_verification && !MobileApp.currentUser.phone_verified) {
        showToast('このアンケートは電話番号認証が必要です（近日公開予定）', 'error');
        return;
    }
    
    currentSurveyForAnswer = { survey, questions };
    surveyStartTime = Date.now();
    
    showSurveyAnswerModal(survey, questions);
};

function showSurveyAnswerModal(survey, questions) {
    const modal = document.getElementById('surveyAnswerModal');
    if (!modal) {
        // モーダルが存在しない場合は作成
        createSurveyAnswerModal();
    }
    
    const title = document.getElementById('surveyAnswerTitle');
    const content = document.getElementById('surveyAnswerContent');
    
    title.textContent = survey.title;
    
    content.innerHTML = `
        <div class="mb-6">
            <p class="text-gray-300 mb-4">${survey.description}</p>
            <div class="flex gap-4 text-sm text-gray-400">
                <span><i class="fas fa-clock mr-1"></i> ${survey.estimated_time}</span>
                <span><i class="fas fa-coins mr-1"></i> ${survey.points_per_response}pt獲得</span>
            </div>
        </div>
        
        <form id="surveyAnswerForm" class="space-y-6">
            ${questions.map((q, index) => renderAnswerQuestion(q, index)).join('')}
            
            <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-xl font-bold text-lg">
                <i class="fas fa-paper-plane mr-2"></i>
                回答を送信
            </button>
        </form>
    `;
    
    document.getElementById('surveyAnswerModal').classList.add('active');
    
    // フォーム送信イベント
    document.getElementById('surveyAnswerForm').addEventListener('submit', submitSurveyAnswer);
}

function renderAnswerQuestion(question, index) {
    let optionsHtml = '';
    
    if (question.question_type === 'single_choice') {
        optionsHtml = question.options.map((option, i) => `
            <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
                <input type="radio" name="q_${question.id}" value="${option}" ${question.is_required ? 'required' : ''} class="w-5 h-5">
                <span>${option}</span>
            </label>
        `).join('');
    } else if (question.question_type === 'multiple_choice') {
        optionsHtml = question.options.map((option, i) => `
            <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
                <input type="checkbox" name="q_${question.id}" value="${option}" class="w-5 h-5">
                <span>${option}</span>
            </label>
        `).join('');
    } else if (question.question_type === 'text') {
        optionsHtml = `
            <textarea name="q_${question.id}" rows="4" ${question.is_required ? 'required' : ''} 
                      class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                      placeholder="ご回答をご記入ください"></textarea>
        `;
    } else if (question.question_type === 'rating') {
        optionsHtml = `
            <div class="flex gap-2 justify-center text-3xl">
                ${[1, 2, 3, 4, 5].map(rating => `
                    <label class="cursor-pointer">
                        <input type="radio" name="q_${question.id}" value="${rating}" ${question.is_required ? 'required' : ''} class="hidden rating-input">
                        <i class="fas fa-star text-gray-600 hover:text-yellow-400 transition-colors rating-star"></i>
                    </label>
                `).join('')}
            </div>
        `;
    } else if (question.question_type === 'yes_no') {
        optionsHtml = `
            <div class="grid grid-cols-2 gap-4">
                <label class="flex items-center justify-center gap-2 p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
                    <input type="radio" name="q_${question.id}" value="yes" ${question.is_required ? 'required' : ''} class="w-5 h-5">
                    <span class="font-bold">Yes</span>
                </label>
                <label class="flex items-center justify-center gap-2 p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
                    <input type="radio" name="q_${question.id}" value="no" ${question.is_required ? 'required' : ''} class="w-5 h-5">
                    <span class="font-bold">No</span>
                </label>
            </div>
        `;
    }
    
    return `
        <div class="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
            <h4 class="font-bold mb-3">
                Q${index + 1}. ${question.question_text}
                ${question.is_required ? '<span class="text-red-500 text-sm ml-1">*</span>' : ''}
            </h4>
            ${optionsHtml}
        </div>
    `;
}

function createSurveyAnswerModal() {
    const modalHtml = `
        <div id="surveyAnswerModal" class="modal">
            <div class="modal-content survey-modal-content">
                <div class="flex justify-between items-center mb-6">
                    <h3 id="surveyAnswerTitle" class="text-2xl font-bold"></h3>
                    <button onclick="closeSurveyAnswerModal()" class="text-2xl">&times;</button>
                </div>
                <div id="surveyAnswerContent"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.closeSurveyAnswerModal = function() {
    document.getElementById('surveyAnswerModal').classList.remove('active');
    currentSurveyForAnswer = null;
    surveyStartTime = null;
};

async function submitSurveyAnswer(e) {
    e.preventDefault();
    
    if (!currentSurveyForAnswer) return;
    
    const { survey, questions } = currentSurveyForAnswer;
    const formData = new FormData(e.target);
    
    const answers = questions.map(question => {
        const fieldName = `q_${question.id}`;
        let answer = {
            question_id: question.id,
            answer_text: '',
            answer_options: [],
            answer_rating: 0
        };
        
        if (question.question_type === 'single_choice' || question.question_type === 'yes_no') {
            answer.answer_text = formData.get(fieldName) || '';
            answer.answer_options = [answer.answer_text];
        } else if (question.question_type === 'multiple_choice') {
            answer.answer_options = formData.getAll(fieldName);
            answer.answer_text = answer.answer_options.join(', ');
        } else if (question.question_type === 'text') {
            answer.answer_text = formData.get(fieldName) || '';
        } else if (question.question_type === 'rating') {
            answer.answer_rating = parseInt(formData.get(fieldName) || 0);
        }
        
        return answer;
    });
    
    const result = await SurveySystem.submitSurveyResponse(survey.id, MobileApp.currentUser.id, answers);
    
    if (result.success) {
        // ポイントを付与
        MobileApp.currentUser.available_points += result.points;
        MobileApp.currentUser.total_points += result.points;
        
        await fetch(`tables/users/${MobileApp.currentUser.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                available_points: MobileApp.currentUser.available_points,
                total_points: MobileApp.currentUser.total_points
            })
        });
        
        // ポイント履歴を追加
        await fetch('tables/point_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: MobileApp.currentUser.id,
                points: result.points,
                type: 'survey',
                description: `アンケート回答: ${survey.title}`,
                status: 'completed'
            })
        });
        
        let message = `${result.points}ポイント獲得しました！`;
        if (result.bonusRate && result.bonusRate > 0) {
            message += ` (+${result.bonusRate}%ボーナス適用)`;
        }
        showToast(message, 'success');
        closeSurveyAnswerModal();
        updateUserDisplay();
        
        // アンケート一覧を更新
        renderSurveyCases();
    } else {
        showToast('送信に失敗しました', 'error');
    }
}

// 星評価のクリックイベント
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('rating-star')) {
        const input = e.target.previousElementSibling;
        if (input && input.classList.contains('rating-input')) {
            input.checked = true;
            
            // すべての星をリセット
            const parent = input.closest('.flex');
            if (parent) {
                parent.querySelectorAll('.rating-star').forEach(star => {
                    star.classList.remove('text-yellow-400');
                    star.classList.add('text-gray-600');
                });
                
                // 選択された星までをハイライト
                const rating = parseInt(input.value);
                const stars = parent.querySelectorAll('.rating-star');
                for (let i = 0; i < rating; i++) {
                    stars[i].classList.remove('text-gray-600');
                    stars[i].classList.add('text-yellow-400');
                }
            }
        }
    }
});

console.log('✅ Survey Mobile System Loaded');
