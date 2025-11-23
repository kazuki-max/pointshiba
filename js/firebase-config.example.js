// ========================================
// Firebase 設定ファイル（サンプル）
// ========================================
//
// 【重要】このファイルをコピーして firebase-config.js を作成してください
// 
// 手順:
// 1. このファイルを js/firebase-config.js にコピー
// 2. 以下の YOUR_XXX を実際の値に置き換える
// 3. Firebase Console から取得した設定情報を使用
//
// Firebase Console: https://console.firebase.google.com/
// プロジェクト設定 → 全般 → マイアプリ → SDK の設定と構成
//
// ========================================

// Firebase 設定情報
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                          // 例: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  authDomain: "your-project.firebaseapp.com",      // 例: "pointshiba-12345.firebaseapp.com"
  projectId: "your-project",                       // 例: "pointshiba-12345"
  storageBucket: "your-project.appspot.com",       // 例: "pointshiba-12345.appspot.com"
  messagingSenderId: "123456789012",               // 例: "987654321098"
  appId: "1:123456789012:web:abcdef123456"         // 例: "1:987654321098:web:abc123def456"
};

// Firebase 初期化
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase 初期化成功');
    
    // Firebase Authentication インスタンス
    window.firebaseAuth = firebase.auth();
    
    // 日本語設定
    firebaseAuth.languageCode = 'ja';
    
    // reCAPTCHA 設定（電話番号認証用）
    window.recaptchaVerifier = null;
    
  } catch (error) {
    console.error('❌ Firebase 初期化エラー:', error);
  }
} else {
  console.warn('⚠️ Firebase SDK が読み込まれていません');
}
