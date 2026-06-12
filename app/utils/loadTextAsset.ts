import { Asset } from 'expo-asset';
import { readAsStringAsync } from 'expo-file-system/legacy';

/**
 * Reads a bundled .txt asset (required via `require('./file.txt')`).
 * Metro bundles .txt as an asset (see metro.config.js assetExts).
 */
export async function loadTextAsset(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('Text asset has no local URI');
  const text = await readAsStringAsync(asset.localUri);
  return text.trim();
}
