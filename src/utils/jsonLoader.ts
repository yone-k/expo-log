import { DevPavilion } from '../types/devPavilion';

/**
 * 入力JSON形式のパビリオンデータ
 */
export type InputPavilionData = {
  readonly id: string;
  readonly name: string;
};

/**
 * 入力JSONファイルを読み込みバリデーションを行う
 * 開発環境でのみ使用される関数
 *
 * @param _filePath - 読み込み対象ファイルパス（実際の実装では使用しない）
 * @param data - モックまたは実際のJSONデータ
 * @returns バリデーション済みの入力データ配列
 */
export async function loadInputPavilions(
  _filePath: string,
  data: unknown
): Promise<InputPavilionData[]> {
  if (!Array.isArray(data)) {
    throw new Error('入力データは配列である必要があります');
  }

  // 各要素のバリデーション
  for (const item of data) {
    if (typeof item !== 'object' || item === null) {
      throw new Error('各要素はオブジェクトである必要があります');
    }

    const { id, name } = item as { id?: unknown; name?: unknown };

    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('各要素にはid（文字列）が必要です');
    }
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('各要素にはname（文字列）が必要です');
    }
  }

  return data as InputPavilionData[];
}

/**
 * 入力データをDevPavilion形式に変換する
 * 座標と半径は初期値null（未設定状態）として設定
 *
 * @param input - 入力データ配列
 * @returns DevPavilion配列
 */
export function convertToDevPavilions(input: InputPavilionData[]): DevPavilion[] {
  // ID重複チェック
  const ids = new Set<string>();
  for (const item of input) {
    if (ids.has(item.id)) {
      throw new Error(`重複するIDが見つかりました: ${item.id}`);
    }
    ids.add(item.id);
  }

  // 空の値チェック
  for (const item of input) {
    if (!item.id || item.id.trim() === '') {
      throw new Error('空のIDは許可されません');
    }
    if (!item.name || item.name.trim() === '') {
      throw new Error('空の名前は許可されません');
    }
  }

  return input.map(item => ({
    id: item.id,
    name: item.name,
    coordinate: null,
    hitboxRadius: null
  }));
}
