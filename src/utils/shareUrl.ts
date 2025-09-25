import type { Pavilion, VisitedState } from '../types/pavilion';

/**
 * パビリオンIDで昇順ソート済みのパビリオンリストを取得する
 * @param pavilions パビリオン情報の配列
 * @returns ID昇順でソートされたパビリオン配列
 */
function getSortedPavilions(pavilions: readonly Pavilion[]): Pavilion[] {
  return [...pavilions].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * 訪問状態をパビリオンID昇順でビット列に変換する
 * @param visitedState 訪問状態オブジェクト
 * @param pavilions パビリオン情報の配列
 * @returns ビット列文字列 (例: "101")
 */
export function createBitString(visitedState: VisitedState, pavilions: readonly Pavilion[]): string {
  const sortedPavilions = getSortedPavilions(pavilions);

  // 各パビリオンの訪問状態をビットに変換（未訪問も明示的にfalseとして扱う）
  return sortedPavilions
    .map(pavilion => (visitedState[pavilion.id] ? '1' : '0'))
    .join('');
}

/**
 * ビット列をパビリオンID昇順で訪問状態オブジェクトに変換する
 * @param bitString ビット列文字列
 * @param pavilions パビリオン情報の配列
 * @returns 訪問状態オブジェクト
 * @throws Error ビット列の長さがパビリオン数と一致しない場合
 */
export function parseBitString(bitString: string, pavilions: readonly Pavilion[]): VisitedState {
  if (bitString.length !== pavilions.length) {
    throw new Error('ビット列の長さがパビリオン数と一致しません');
  }

  const sortedPavilions = getSortedPavilions(pavilions);
  const visitedState: VisitedState = {};

  sortedPavilions.forEach((pavilion, index) => {
    visitedState[pavilion.id] = bitString[index] === '1';
  });

  return visitedState;
}

/**
 * バイト配列をBase64URL形式に変換する
 * @param bytes バイト配列
 * @returns Base64URLエンコードされた文字列
 */
function bytesToBase64URL(bytes: number[]): string {
  const base64 = btoa(String.fromCharCode(...bytes));

  // Base64をBase64URLに変換（RFC 4648準拠）
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * ビット列を8ビット単位のバイト配列に変換する
 * @param bitString ビット列文字列
 * @returns バイト配列
 */
function bitStringToBytes(bitString: string): number[] {
  const bytes: number[] = [];

  for (let i = 0; i < bitString.length; i += 8) {
    const chunk = bitString.slice(i, i + 8).padEnd(8, '0');
    bytes.push(parseInt(chunk, 2));
  }

  return bytes;
}

/**
 * ビット列をBase64URLエンコードする
 * 元のビット列長を保持するため、最初の2バイトに長さ情報を埋め込む
 * @param bitString ビット列文字列
 * @returns Base64URLエンコードされた文字列
 */
export function encodeBase64URL(bitString: string): string {
  if (bitString === '') {
    return '';
  }

  // 元のビット列の長さを最初の2バイト（16ビット）に記録
  const originalLength = bitString.length;
  const lengthBytes = [
    (originalLength >> 8) & 0xFF,
    originalLength & 0xFF
  ];

  // ビット列をバイト配列に変換
  const dataBytes = bitStringToBytes(bitString);

  // 長さ情報とデータを結合してBase64URLエンコード
  return bytesToBase64URL([...lengthBytes, ...dataBytes]);
}

/**
 * Base64URL文字列の有効性を検証する
 * @param base64UrlString 検証対象の文字列
 * @throws Error Base64URL形式でない場合
 */
function validateBase64URL(base64UrlString: string): void {
  // Base64URL文字セットの検証（RFC 4648準拠）
  if (!/^[A-Za-z0-9_-]*$/.test(base64UrlString)) {
    throw new Error('不正なBase64URL文字列です');
  }
}

/**
 * Base64URL文字列を標準Base64に変換してデコードする
 * @param base64UrlString Base64URL文字列
 * @returns デコードされたバイナリ文字列
 */
function base64URLToString(base64UrlString: string): string {
  // Base64URLをBase64に変換
  let base64 = base64UrlString
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // パディングを追加
  const padding = base64.length % 4;
  if (padding !== 0) {
    base64 += '='.repeat(4 - padding);
  }

  return atob(base64);
}

/**
 * バイナリ文字列からビット列を生成する
 * @param binaryString バイナリ文字列
 * @param startIndex 開始インデックス（長さ情報をスキップ）
 * @returns ビット列文字列
 */
function binaryStringToBitString(binaryString: string, startIndex: number): string {
  let bitString = '';
  for (let i = startIndex; i < binaryString.length; i++) {
    const byte = binaryString.charCodeAt(i);
    bitString += byte.toString(2).padStart(8, '0');
  }
  return bitString;
}

/**
 * Base64URL文字列をビット列にデコードする
 * 最初の2バイトから元のビット列長を復元し、適切な長さでトリミングする
 * @param base64UrlString Base64URLエンコードされた文字列
 * @returns ビット列文字列
 * @throws Error 不正なBase64URL文字列またはフォーマットエラーの場合
 */
export function decodeBase64URL(base64UrlString: string): string {
  if (base64UrlString === '') {
    return '';
  }

  validateBase64URL(base64UrlString);

  try {
    const decoded = base64URLToString(base64UrlString);

    if (decoded.length < 2) {
      throw new Error('不正なBase64URL文字列です');
    }

    // 最初の2バイトから元の長さを復元
    const lengthHigh = decoded.charCodeAt(0);
    const lengthLow = decoded.charCodeAt(1);
    const originalLength = (lengthHigh << 8) | lengthLow;

    // データ部分をビット列に変換
    const bitString = binaryStringToBitString(decoded, 2);

    // 元の長さでトリム
    return bitString.slice(0, originalLength);
  } catch (error) {
    const wrappedError = new Error('不正なBase64URL文字列です');
    (wrappedError as Error & { cause?: unknown }).cause = error;
    throw wrappedError;
  }
}

/**
 * 訪問状態を共有URL用文字列にエンコードする
 * パビリオンリストから訪問状態のビット列を生成し、Base64URLエンコードする
 * @param visitedState 訪問状態オブジェクト
 * @param pavilions パビリオン情報の配列
 * @returns Base64URLエンコードされた文字列
 */
export function encodeVisitedStateToUrl(visitedState: VisitedState, pavilions: readonly Pavilion[]): string {
  const bitString = createBitString(visitedState, pavilions);
  return encodeBase64URL(bitString);
}

/**
 * 共有URL文字列から訪問状態を復元する
 * Base64URLデコード後、パビリオンリストと照合して訪問状態オブジェクトを構築
 * @param encodedString Base64URLエンコードされた文字列
 * @param pavilions パビリオン情報の配列
 * @returns 訪問状態オブジェクト
 * @throws Error 不正な文字列またはパビリオン数との不整合の場合
 */
export function decodeVisitedStateFromUrl(encodedString: string, pavilions: readonly Pavilion[]): VisitedState {
  const bitString = decodeBase64URL(encodedString);

  // パビリオン数に合わせてビット列を調整（エンコード時の最大長制限に対応）
  const expectedLength = pavilions.length;
  const adjustedBitString = bitString.slice(0, expectedLength);

  return parseBitString(adjustedBitString, pavilions);
}
