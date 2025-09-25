import App from '../App';
import { DevPavilionEditorPage } from '../pages/DevPavilionEditorPage';

const isDevMode = import.meta.env.DEV;

/**
 * シンプルなクライアントサイドルーティング
 * 開発環境でのみ開発ツールページを提供
 */
export function AppRouter() {
  const path = window.location.pathname;

  // 開発環境でのみ開発ツールページを提供
  if (isDevMode && path === '/__dev/pavilions-editor') {
    return <DevPavilionEditorPage />;
  }

  // 本番環境で開発ツールパスにアクセスされた場合、メインアプリにリダイレクト
  if (!isDevMode && path.startsWith('/__dev/')) {
    // リダイレクト処理
    window.location.replace('/');
    return null;
  }

  // デフォルトはメインアプリ
  return <App />;
}
