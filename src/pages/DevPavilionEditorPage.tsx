import { DevPavilionEditor } from '../components/DevPavilionEditor';

/**
 * 開発専用パビリオン編集ページ
 * /__dev/pavilions-editor ルートでのみアクセス可能
 */
export function DevPavilionEditorPage() {
  return (
    <div>
      <header style={{ padding: '10px', background: '#1976d2', color: 'white' }}>
        <h1>EXPO LOG - 開発用パビリオン座標設定ツール</h1>
        <p>このツールは開発環境でのみ利用可能です。</p>
      </header>
      <main>
        <DevPavilionEditor />
      </main>
    </div>
  );
}