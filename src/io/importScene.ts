import JSZip from 'jszip'
import { AssetLoader, LoadedAsset } from '../scene/AssetLoader'

interface AssetConfig {
  id: string
  name: string
  mainFile: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
}

interface SceneConfig {
  version: number
  assets: AssetConfig[]
}

export async function importScene(
  zipFile: File,
  assetLoader: AssetLoader
): Promise<LoadedAsset[]> {
  const zip = await JSZip.loadAsync(zipFile)

  // Read scene config
  const configFile = zip.file('scene.json')
  if (!configFile) {
    throw new Error('Invalid scene file: missing scene.json')
  }

  const configText = await configFile.async('text')
  const config: SceneConfig = JSON.parse(configText)

  const loadedAssets: LoadedAsset[] = []

  for (const assetConfig of config.assets) {
    // Collect all files for this asset
    const files = new Map<string, File>()
    const assetPath = `assets/${assetConfig.name}/`

    zip.forEach((relativePath, file) => {
      if (relativePath.startsWith(assetPath) && !file.dir) {
        const filePath = relativePath.slice(assetPath.length)
        // We need to get the file content and create a File object
        files.set(filePath, null as unknown as File) // Placeholder, will be filled below
      }
    })

    // Actually load the file contents
    const filePromises: Promise<void>[] = []
    zip.forEach((relativePath, zipEntry) => {
      if (relativePath.startsWith(assetPath) && !zipEntry.dir) {
        const filePath = relativePath.slice(assetPath.length)
        const promise = zipEntry.async('blob').then((blob) => {
          const fileName = filePath.split('/').pop() || filePath
          const file = new File([blob], fileName, { type: getMimeType(fileName) })
          files.set(filePath, file)
        })
        filePromises.push(promise)
      }
    })

    await Promise.all(filePromises)

    // Load the asset
    const asset = await assetLoader.loadFromFiles(files, assetConfig.name)
    if (asset) {
      // Apply saved transform
      asset.object.position.set(
        assetConfig.position.x,
        assetConfig.position.y,
        assetConfig.position.z
      )
      asset.object.rotation.set(
        assetConfig.rotation.x,
        assetConfig.rotation.y,
        assetConfig.rotation.z
      )
      asset.object.scale.set(
        assetConfig.scale.x,
        assetConfig.scale.y,
        assetConfig.scale.z
      )
      loadedAssets.push(asset)
    }
  }

  return loadedAssets
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    gltf: 'model/gltf+json',
    glb: 'model/gltf-binary',
    bin: 'application/octet-stream',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}
