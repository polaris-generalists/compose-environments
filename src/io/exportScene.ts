import JSZip from 'jszip'
import { LoadedAsset } from '../scene/AssetLoader'

export async function exportScene(assets: LoadedAsset[]): Promise<void> {
  const zip = new JSZip()
  const assetsFolder = zip.folder('assets')

  // Build USD scene file content
  let usdContent = `#usda 1.0
(
    defaultPrim = "World"
    metersPerUnit = 1
    upAxis = "Z"
)

def Xform "World"
{
`

  for (const asset of assets) {
    // Get transform values (convert Y-up back to Z-up for USD)
    const pos = asset.object.position
    const rot = asset.object.rotation
    const scl = asset.object.scale

    // Convert rotation from radians to degrees
    const rotDegX = (rot.x * 180) / Math.PI
    const rotDegY = (rot.y * 180) / Math.PI
    const rotDegZ = (rot.z * 180) / Math.PI

    // Sanitize asset name for USD (no spaces, special chars)
    const usdName = asset.name.replace(/[^a-zA-Z0-9_]/g, '_')

    // Find the main file's relative path in the assets folder
    const mainFileName = asset.mainFile.split('/').pop() || asset.mainFile

    // Add reference to the asset in USD
    // Convert from Three.js (Y-up) to USD (Z-up, Y-left):
    // Three.js: X=right, Y=up, Z=forward
    // USD:      X=forward, Y=left, Z=up
    // Mapping: USD_X = Three_X, USD_Y = -Three_Z, USD_Z = Three_Y
    usdContent += `
    def Xform "${usdName}" (
        prepend references = @./assets/${asset.name}/${mainFileName}@
    )
    {
        double3 xformOp:translate = (${pos.x}, ${-pos.z}, ${pos.y})
        float3 xformOp:rotateXYZ = (${rotDegX}, ${-rotDegZ}, ${rotDegY})
        float3 xformOp:scale = (${scl.x}, ${scl.z}, ${scl.y})
        uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:rotateXYZ", "xformOp:scale"]
    }
`

    // Add asset files to zip
    if (assetsFolder) {
      const assetSubfolder = assetsFolder.folder(asset.name)
      if (assetSubfolder) {
        for (const [path, file] of asset.files) {
          // Preserve folder structure within asset, remove top-level folder name
          const relativePath = path.includes('/') ? path.split('/').slice(1).join('/') : path
          assetSubfolder.file(relativePath, file)
        }
      }
    }
  }

  usdContent += `}
`

  // Add the main USD scene file
  zip.file('scene.usda', usdContent)

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, 'scene.zip')
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
