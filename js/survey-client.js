// ========================================
// Survey Client JavaScript
// クライアント用アンケート投稿システム
// ========================================

// グローバル変数
let currentStep = 1;
let questions = [];
let questionIdCounter = 1;

// 料金計算定数
const PRICE_PER_QUESTION = 10; // 1問あたり¥10
const USER_RETURN_RATE = 0.5; // ユーザー還元率50%

// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // 初期質問を1つ追加
    addQuestion();
    
    // 今日の日付を開始日のデフォルトに設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    
    // 7日後を終了日のデフォルトに設定
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    document.getElementById('endDate').value = weekLater.toISOString().split('T')[0];
    
    // 初期シミュレーション計算
    calculateSimulation();
});

// ========================================
// 料金シミュレーター
// ========================================

window.calculateSimulation = function() {
    const questions = parseInt(document.getElementById('simQuestions').value) || 1;
    const responses = parseInt(document.getElementById('simResponses').value) || 10;
    
    // 料金計算
    const totalCost = questions * responses * PRICE_PER_QUESTION;
    const perResponse = questions * PRICE_PER_QUESTION;
    const userPoints = Math.floor(perResponse * USER_RETURN_RATE);
    
    // 表示更新
    document.getElementById('simTotal').textContent = `¥${totalCost.toLocaleString()}`;
    document.getElementById('simPerResponse').textContent = `¥${perResponse.toLocaleString()}`;
    document.getElementById('simUserPoints').textContent = `${userPoints}pt/回答`;
};

window.setSimulation = function(questions, responses) {
    document.getElementById('simQuestions').value = questions;
    document.getElementById('simResponses').value = responses;
    calculateSimulation();
    
    // フォームにスクロール
    document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
    
    showToast('条件を設定しました。フォームに進んでください。', 'success');
};

// ========================================
// ステップ管理
// ========================================

function goToStep(step) {
    // 現在のステップのバリデーション
    if (step > currentStep) {
        if (!validateStep(currentStep)) {
            return;
        }
    }
    
    // すべてのステップを非表示
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`step${i}`).classList.add('hidden');
    }
    
    // 指定されたステップを表示
    document.getElementById(`step${step}`).classList.remove('hidden');
    
    // ステップインジケーターを更新
    updateStepIndicator(step);
    
    // ステップ4の場合は確認内容を表示
    if (step === 4) {
        showConfirmation();
    }
    
    currentStep = step;
    
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepIndicator(step) {
    for (let i = 1; i <= 4; i++) {
        const indicator = document.getElementById(`step${i}Indicator`);
        if (!indicator) continue;
        
        const circle = indicator.querySelector('div');
        const text = indicator.querySelector('p');
        
        if (i <= step) {
            indicator.classList.add('active');
            circle.classList.remove('bg-gray-200');
            circle.classList.add('gradient-bg');
            circle.querySelector('span').classList.remove('text-gray-600');
            circle.querySelector('span').classList.add('text-white');
            text.classList.remove('text-gray-600');
            text.classList.add('font-medium');
        } else {
            indicator.classList.remove('active');
            circle.classList.remove('gradient-bg');
            circle.classList.add('bg-gray-200');
            circle.querySelector('span').classList.remove('text-white');
            circle.querySelector('span').classList.add('text-gray-600');
            text.classList.add('text-gray-600');
        }
    }
}

// ========================================
// バリデーション
// ========================================

function validateStep(step) {
    switch(step) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            return true;
    }
}

function validateStep1() {
    const company = document.getElementById('clientCompany').value.trim();
    const name = document.getElementById('clientName').value.trim();
    const email = document.getElementById('clientEmail').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    
    if (!company || !name || !email || !phone) {
        showToast('すべての必須項目を入力してください', 'error');
        return false;
    }
    
    // メールアドレスのバリデーション
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showToast('正しいメールアドレスを入力してください', 'error');
        return false;
    }
    
    return true;
}

function validateStep2() {
    const title = document.getElementById('surveyTitle').value.trim();
    const description = document.getElementById('surveyDescription').value.trim();
    const targetResponses = parseInt(document.getElementById('targetResponses').value);
    const pointsPerResponse = parseInt(document.getElementById('pointsPerResponse').value);
    const category = document.getElementById('surveyCategory').value;
    const estimatedTime = document.getElementById('estimatedTime').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!title || !description || !targetResponses || !pointsPerResponse || !category || !estimatedTime || !startDate || !endDate) {
        showToast('すべての必須項目を入力してください', 'error');
        return false;
    }
    
    if (targetResponses < 10) {
        showToast('目標回答数は10以上を設定してください', 'error');
        return false;
    }
    
    // 自動計算されたポイントと一致するかチェック
    const expectedPoints = Math.floor((questions.length * PRICE_PER_QUESTION) * USER_RETURN_RATE);
    if (pointsPerResponse < expectedPoints) {
        showToast(`質問数${questions.length}問の場合、最低${expectedPoints}pt必要です`, 'error');
        return false;
    }
    
    // 日付のバリデーション
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
        showToast('終了日は開始日より後の日付を設定してください', 'error');
        return false;
    }
    
    return true;
}

function validateStep3() {
    if (questions.length === 0) {
        showToast('少なくとも1つの質問を追加してください', 'error');
        return false;
    }
    
    if (questions.length > 30) {
        showToast('質問は最大30問までです', 'error');
        return false;
    }
    
    // 各質問のバリデーション
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        if (!q.question_text.trim()) {
            showToast(`質問${i + 1}の質問文を入力してください`, 'error');
            return false;
        }
        
        if (!q.question_type) {
            showToast(`質問${i + 1}の質問タイプを選択してください`, 'error');
            return false;
        }
        
        // 選択式の場合、選択肢チェック
        if ((q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && q.options.length < 2) {
            showToast(`質問${i + 1}は少なくとも2つの選択肢が必要です`, 'error');
            return false;
        }
    }
    
    return true;
}

// ========================================
// 質問管理
// ========================================

function addQuestion() {
    if (questions.length >= 100) {
        showToast('質問は最大100問までです', 'error');
        return;
    }
    
    const questionId = `question_${questionIdCounter++}`;
    const questionNumber = questions.length + 1;
    
    const questionData = {
        id: questionId,
        question_number: questionNumber,
        question_text: '',
        question_type: 'single_choice',
        options: [],
        is_required: true,
        min_rating: 1,
        max_rating: 5
    };
    
    questions.push(questionData);
    
    renderQuestion(questionData);
    
    // ポイントを自動更新
    updatePointsPerResponse();
}

function renderQuestion(questionData) {
    const questionsList = document.getElementById('questionsList');
    
    const questionHtml = `
        <div id="${questionData.id}" class="question-item bg-white p-6 rounded-lg shadow-sm">
            <div class="flex justify-between items-start mb-4">
                <h5 class="text-lg font-bold">質問 ${questionData.question_number}</h5>
                <button type="button" onclick="removeQuestion('${questionData.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">質問文 *</label>
                    <input type="text" id="${questionData.id}_text" value="${questionData.question_text}" onchange="updateQuestion('${questionData.id}', 'question_text', this.value)" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="質問を入力してください">
                </div>
                
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">質問タイプ *</label>
                        <select id="${questionData.id}_type" onchange="handleQuestionTypeChange('${questionData.id}', this.value)" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                            <option value="single_choice" ${questionData.question_type === 'single_choice' ? 'selected' : ''}>単一選択</option>
                            <option value="multiple_choice" ${questionData.question_type === 'multiple_choice' ? 'selected' : ''}>複数選択</option>
                            <option value="text" ${questionData.question_type === 'text' ? 'selected' : ''}>自由記述</option>
                            <option value="rating" ${questionData.question_type === 'rating' ? 'selected' : ''}>評価（星）</option>
                            <option value="yes_no" ${questionData.question_type === 'yes_no' ? 'selected' : ''}>Yes/No</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="flex items-center gap-2 pt-8">
                            <input type="checkbox" id="${questionData.id}_required" ${questionData.is_required ? 'checked' : ''} onchange="updateQuestion('${questionData.id}', 'is_required', this.checked)" class="w-5 h-5 rounded">
                            <span class="text-sm font-medium text-gray-700">必須回答</span>
                        </label>
                    </div>
                </div>
                
                <div id="${questionData.id}_options_container">
                    ${renderQuestionOptions(questionData)}
                </div>
            </div>
        </div>
    `;
    
    questionsList.insertAdjacentHTML('beforeend', questionHtml);
}

function renderQuestionOptions(questionData) {
    if (questionData.question_type === 'single_choice' || questionData.question_type === 'multiple_choice') {
        let optionsHtml = '<div class="space-y-2">';
        optionsHtml += '<label class="block text-sm font-medium text-gray-700 mb-2">選択肢 *</label>';
        
        questionData.options.forEach((option, index) => {
            optionsHtml += `
                <div class="flex gap-2">
                    <input type="text" value="${option}" onchange="updateOption('${questionData.id}', ${index}, this.value)" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="選択肢 ${index + 1}">
                    <button type="button" onclick="removeOption('${questionData.id}', ${index})" class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        
        optionsHtml += `
            <button type="button" onclick="addOption('${questionData.id}')" class="text-purple-600 text-sm font-medium hover:underline">
                <i class="fas fa-plus mr-1"></i> 選択肢を追加
            </button>
        </div>`;
        
        return optionsHtml;
    } else if (questionData.question_type === 'rating') {
        return `
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">最小評価</label>
                    <input type="number" value="${questionData.min_rating}" onchange="updateQuestion('${questionData.id}', 'min_rating', parseInt(this.value))" min="1" max="5" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">最大評価</label>
                    <input type="number" value="${questionData.max_rating}" onchange="updateQuestion('${questionData.id}', 'max_rating', parseInt(this.value))" min="1" max="10" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                </div>
            </div>
        `;
    }
    
    return '';
}

function handleQuestionTypeChange(questionId, newType) {
    const questionData = questions.find(q => q.id === questionId);
    if (!questionData) return;
    
    questionData.question_type = newType;
    
    // 選択肢をクリア/初期化
    if (newType === 'single_choice' || newType === 'multiple_choice') {
        if (questionData.options.length === 0) {
            questionData.options = ['選択肢1', '選択肢2'];
        }
    } else {
        questionData.options = [];
    }
    
    // オプションコンテナを再レンダリング
    const container = document.getElementById(`${questionId}_options_container`);
    container.innerHTML = renderQuestionOptions(questionData);
}

function updateQuestion(questionId, field, value) {
    const questionData = questions.find(q => q.id === questionId);
    if (questionData) {
        questionData[field] = value;
    }
}

function addOption(questionId) {
    const questionData = questions.find(q => q.id === questionId);
    if (!questionData) return;
    
    questionData.options.push(`選択肢${questionData.options.length + 1}`);
    
    // オプションコンテナを再レンダリング
    const container = document.getElementById(`${questionId}_options_container`);
    container.innerHTML = renderQuestionOptions(questionData);
}

function updateOption(questionId, index, value) {
    const questionData = questions.find(q => q.id === questionId);
    if (questionData) {
        questionData.options[index] = value;
    }
}

function removeOption(questionId, index) {
    const questionData = questions.find(q => q.id === questionId);
    if (!questionData) return;
    
    if (questionData.options.length <= 2) {
        showToast('選択肢は最低2つ必要です', 'error');
        return;
    }
    
    questionData.options.splice(index, 1);
    
    // オプションコンテナを再レンダリング
    const container = document.getElementById(`${questionId}_options_container`);
    container.innerHTML = renderQuestionOptions(questionData);
}

function removeQuestion(questionId) {
    if (!confirm('この質問を削除しますか？')) return;
    
    // 配列から削除
    const index = questions.findIndex(q => q.id === questionId);
    if (index !== -1) {
        questions.splice(index, 1);
    }
    
    // DOM から削除
    document.getElementById(questionId).remove();
    
    // 質問番号を再割り当て
    questions.forEach((q, i) => {
        q.question_number = i + 1;
    });
    
    // すべての質問を再レンダリング
    reRenderAllQuestions();
    
    // ポイントを自動更新
    updatePointsPerResponse();
}

// ポイント自動計算
function updatePointsPerResponse() {
    const questionCount = questions.length;
    const pointsPerResponse = Math.floor((questionCount * PRICE_PER_QUESTION) * USER_RETURN_RATE);
    
    const pointsInput = document.getElementById('pointsPerResponse');
    if (pointsInput) {
        pointsInput.value = pointsPerResponse;
    }
}

function reRenderAllQuestions() {
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = '';
    
    questions.forEach(q => {
        renderQuestion(q);
    });
}

// ========================================
// 画像アップロード
// ========================================

function handleSurveyImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
        showToast('画像サイズは5MB以下にしてください', 'error');
        event.target.value = '';
        return;
    }
    
    // ファイル形式チェック
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        showToast('JPEG、PNG、GIF形式の画像をアップロードしてください', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('surveyImageData').value = e.target.result;
        document.getElementById('surveyImagePreviewImg').src = e.target.result;
        document.getElementById('surveyImagePreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function clearSurveyImage() {
    document.getElementById('surveyImageFile').value = '';
    document.getElementById('surveyImageData').value = '';
    document.getElementById('surveyImagePreview').classList.add('hidden');
}

// ========================================
// 確認画面
// ========================================

function showConfirmation() {
    const container = document.getElementById('confirmationContent');
    
    // 基本情報
    const company = document.getElementById('clientCompany').value;
    const name = document.getElementById('clientName').value;
    const email = document.getElementById('clientEmail').value;
    const phone = document.getElementById('clientPhone').value;
    
    // アンケート詳細
    const title = document.getElementById('surveyTitle').value;
    const description = document.getElementById('surveyDescription').value;
    const targetResponses = parseInt(document.getElementById('targetResponses').value);
    const pointsPerResponse = parseInt(document.getElementById('pointsPerResponse').value);
    const category = document.getElementById('surveyCategory').value;
    const estimatedTime = document.getElementById('estimatedTime').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // 料金計算
    const questionCount = questions.length;
    const totalCost = questionCount * targetResponses * PRICE_PER_QUESTION;
    const perResponseCost = questionCount * PRICE_PER_QUESTION;
    
    const confirmationHtml = `
        <div class="space-y-6">
            <!-- 基本情報 -->
            <div class="bg-gray-50 p-6 rounded-lg">
                <h5 class="font-bold mb-4 text-lg">基本情報</h5>
                <div class="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="text-gray-600">企業名</p>
                        <p class="font-medium">${company}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">ご担当者名</p>
                        <p class="font-medium">${name}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">メールアドレス</p>
                        <p class="font-medium">${email}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">電話番号</p>
                        <p class="font-medium">${phone}</p>
                    </div>
                </div>
            </div>
            
            <!-- アンケート情報 -->
            <div class="bg-gray-50 p-6 rounded-lg">
                <h5 class="font-bold mb-4 text-lg">アンケート情報</h5>
                <div class="space-y-3 text-sm">
                    <div>
                        <p class="text-gray-600">タイトル</p>
                        <p class="font-medium">${title}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">説明</p>
                        <p class="font-medium">${description}</p>
                    </div>
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <p class="text-gray-600">カテゴリー</p>
                            <p class="font-medium">${category}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">所要時間</p>
                            <p class="font-medium">${estimatedTime}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">1回答あたり</p>
                            <p class="font-medium">${pointsPerResponse}pt</p>
                        </div>
                    </div>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-gray-600">開始日</p>
                            <p class="font-medium">${startDate}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">終了日</p>
                            <p class="font-medium">${endDate}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 質問一覧 -->
            <div class="bg-gray-50 p-6 rounded-lg">
                <h5 class="font-bold mb-4 text-lg">質問一覧（${questions.length}問）</h5>
                <div class="space-y-3 text-sm">
                    ${questions.map((q, i) => `
                        <div class="bg-white p-4 rounded-lg">
                            <p class="font-medium mb-2">Q${i + 1}. ${q.question_text}</p>
                            <p class="text-gray-600 text-xs">タイプ: ${getQuestionTypeLabel(q.question_type)} ${q.is_required ? '(必須)' : '(任意)'}</p>
                            ${q.options.length > 0 ? `<p class="text-gray-600 text-xs mt-1">選択肢: ${q.options.join(', ')}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- 料金情報 -->
            <div class="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                <h5 class="font-bold mb-4 text-lg">料金情報</h5>
                <div class="space-y-4 text-sm mb-6">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">質問数</span>
                        <span class="font-bold text-lg">${questionCount}問</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">目標回答数</span>
                        <span class="font-bold text-lg">${targetResponses}回答</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">1回答あたり</span>
                        <span class="font-bold text-lg">¥${perResponseCost.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">ユーザー獲得ポイント</span>
                        <span class="font-bold text-lg text-green-600">${pointsPerResponse}pt</span>
                    </div>
                </div>
                <div class="pt-6 border-t border-purple-200">
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm text-gray-600 mb-2">計算式</p>
                        <p class="text-xs text-gray-600 mb-3">
                            ${questionCount}問 × ${targetResponses}回答 × ¥10 = ¥${totalCost.toLocaleString()}
                        </p>
                        <div class="flex justify-between items-center">
                            <p class="text-gray-700 font-medium">お支払い総額</p>
                            <p class="text-4xl font-black text-purple-600">¥${totalCost.toLocaleString()}</p>
                        </div>
                    </div>
                    <p class="text-xs text-gray-600 mt-3">
                        ※ 税抜価格です。別途消費税が加算されます。<br>
                        ※ お支払い総額の50%がユーザーにポイント還元されます。
                    </p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = confirmationHtml;
}

function getQuestionTypeLabel(type) {
    const labels = {
        'single_choice': '単一選択',
        'multiple_choice': '複数選択',
        'text': '自由記述',
        'rating': '評価',
        'yes_no': 'Yes/No'
    };
    return labels[type] || type;
}

function getPlanLabel(plan) {
    const labels = {
        'basic': 'ベーシック',
        'standard': 'スタンダード',
        'premium': 'プレミアム',
        'enterprise': 'エンタープライズ'
    };
    return labels[plan] || plan;
}

// ========================================
// 送信処理
// ========================================

async function submitSurveyOrder() {
    // 利用規約の同意チェック
    if (!document.getElementById('agreeTerms').checked) {
        showToast('利用規約とプライバシーポリシーに同意してください', 'error');
        return;
    }
    
    // すべてのバリデーション
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
        showToast('入力内容に不備があります', 'error');
        return;
    }
    
    // データを収集
    const questionCount = questions.length;
    const targetResponses = parseInt(document.getElementById('targetResponses').value);
    const totalCost = calculateTotalCost();
    
    const orderData = {
        client_name: document.getElementById('clientName').value.trim(),
        client_email: document.getElementById('clientEmail').value.trim(),
        client_company: document.getElementById('clientCompany').value.trim(),
        client_phone: document.getElementById('clientPhone').value.trim(),
        plan_type: `custom_${questionCount}q_${targetResponses}r`, // カスタムプラン識別子
        target_responses: targetResponses,
        total_cost: totalCost,
        payment_status: 'pending',
        payment_method: '',
        survey_title: document.getElementById('surveyTitle').value.trim(),
        survey_id: '',
        status: 'pending',
        notes: `質問数: ${questionCount}問、1回答あたり: ¥${questionCount * PRICE_PER_QUESTION}`
    };
    
    const surveyData = {
        title: document.getElementById('surveyTitle').value.trim(),
        description: document.getElementById('surveyDescription').value.trim(),
        client_name: orderData.client_name,
        client_email: orderData.client_email,
        client_company: orderData.client_company,
        survey_type: 'client',
        target_responses: orderData.target_responses,
        current_responses: 0,
        points_per_response: parseInt(document.getElementById('pointsPerResponse').value),
        estimated_time: document.getElementById('estimatedTime').value,
        status: 'draft',
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        order_id: '',
        payment_status: 'pending',
        total_cost: orderData.total_cost,
        category: document.getElementById('surveyCategory').value,
        tags: [],
        image_url: document.getElementById('surveyImageData').value || 'https://images.unsplash.com/photo-1586282391129-76a6df230234?w=800&h=600&fit=crop'
    };
    
    try {
        // 注文を作成
        const orderResponse = await fetch('tables/survey_orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (!orderResponse.ok) {
            throw new Error('注文の作成に失敗しました');
        }
        
        const order = await orderResponse.json();
        
        // アンケートを作成
        surveyData.order_id = order.id;
        
        const surveyResponse = await fetch('tables/surveys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(surveyData)
        });
        
        if (!surveyResponse.ok) {
            throw new Error('アンケートの作成に失敗しました');
        }
        
        const survey = await surveyResponse.json();
        
        // 注文にアンケートIDを紐付け
        await fetch(`tables/survey_orders/${order.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ survey_id: survey.id })
        });
        
        // 質問を作成
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const questionData = {
                survey_id: survey.id,
                question_number: i + 1,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options,
                is_required: q.is_required,
                min_rating: q.min_rating || 1,
                max_rating: q.max_rating || 5
            };
            
            await fetch('tables/survey_questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData)
            });
        }
        
        // 成功メッセージ
        showSuccessModal(order.id, surveyData.client_email);
        
    } catch (error) {
        console.error('Error submitting survey order:', error);
        showToast('送信中にエラーが発生しました。もう一度お試しください。', 'error');
    }
}

function calculateTotalCost() {
    const questionCount = questions.length;
    const targetResponses = parseInt(document.getElementById('targetResponses').value) || 0;
    
    // 料金 = 質問数 × 回答数 × ¥10
    return questionCount * targetResponses * PRICE_PER_QUESTION;
}

function showSuccessModal(orderId, email) {
    const modal = `
        <div id="successModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl p-8 max-w-lg w-full text-center">
                <div class="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-check text-4xl text-white"></i>
                </div>
                <h3 class="text-3xl font-black mb-4">送信完了！</h3>
                <p class="text-gray-600 mb-6">
                    アンケート依頼を受け付けました。<br>
                    24時間以内に担当者より<br>
                    <strong class="text-purple-600">${email}</strong><br>
                    宛にご連絡させていただきます。
                </p>
                <div class="bg-gray-50 p-4 rounded-lg mb-6">
                    <p class="text-sm text-gray-600 mb-2">注文ID</p>
                    <p class="font-mono font-bold text-lg">${orderId}</p>
                </div>
                <p class="text-sm text-gray-600 mb-6">
                    お見積りとお支払い方法をメールでご案内いたします。<br>
                    ご不明な点がございましたら、お気軽にお問い合わせください。
                </p>
                <button onclick="window.location.href='mobile.html'" class="gradient-bg text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity">
                    トップページへ
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// ========================================
// プラン選択
// ========================================

function selectPlan(planType) {
    document.getElementById('planType').value = planType;
    
    // フォームにスクロール
    document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
    
    showToast(`${getPlanLabel(planType)}プランを選択しました`, 'success');
}

// ========================================
// トースト通知
// ========================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    toastMessage.textContent = message;
    
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle text-2xl text-green-500';
    } else {
        toastIcon.className = 'fas fa-exclamation-circle text-2xl text-red-500';
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

console.log('✅ Survey Client System Loaded');
