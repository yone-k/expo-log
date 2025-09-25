import { DevPavilion, validateDevPavilion } from '../types/devPavilion';
import type { Pavilion } from '../types/pavilion';

/**
 * サーバー保存結果の型定義
 */
export type SaveResult = {
  success: boolean;
  error?: string;
};

/**
 * DevPavilion配列を本番用のPavilion形式に変換する
 * 座標未設定(null)の場合はデフォルト座標(0,0)を設定
 *
 * @returns 本番用パビリオンデータ
 * @param devPavilion
 */
export function prepareOutputData(devPavilion: DevPavilion): Pavilion {
  if (!validateDevPavilion(devPavilion)) {
    throw new Error(`無効なパビリオンデータ: ${devPavilion.id}`);
  }

  if (devPavilion.coordinate === null) {
    throw new Error('座標が設定されていません');
  }

  return {
    id: devPavilion.id,
    name: devPavilion.name,
    coordinate: devPavilion.coordinate,
    hitboxRadius: devPavilion.hitboxRadius
  };
}

/**
 * パビリオンデータをサーバーに保存する
 * 開発専用API /__dev/api/pavilions にPOST送信
 *
 * @returns 保存結果
 * @param pavilion
 */
export async function saveToServer(pavilion: Pavilion): Promise<SaveResult> {
  try {
    const response = await fetch('/__dev/api/pavilions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pavilion)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `サーバーエラー (${response.status}): ${errorData.error || 'Unknown error'}`
      };
    }

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: `通信エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
