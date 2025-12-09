import { useRef, useEffect } from 'preact/hooks'
import { useScene } from '../hooks/useScene'
import { TransformMode } from '../scene/SelectionManager'
import { exportScene } from '../io/exportScene'
import { importScene } from '../io/importScene'

export function Toolbar() {
  const { transformMode, setTransformMode, assets, addAsset, assetLoader } = useScene()
  const folderInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const modes: { mode: TransformMode; label: string; key: string }[] = [
    { mode: 'translate', label: 'Move', key: 'G' },
    { mode: 'rotate', label: 'Rotate', key: 'R' },
    { mode: 'scale', label: 'Scale', key: 'S' },
  ]

  // Set webkitdirectory attribute imperatively (JSX doesn't handle it well)
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '')
      folderInputRef.current.setAttribute('directory', '')
    }
  }, [])

  const handleAddAsset = () => {
    folderInputRef.current?.click()
  }

  const handleFolderSelect = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const fileList = input.files
    if (!fileList || !assetLoader) return

    const files = new Map<string, File>()
    let folderName = ''

    for (const file of Array.from(fileList)) {
      // webkitRelativePath gives us the folder structure
      const path = file.webkitRelativePath
      files.set(path, file)

      if (!folderName && path) {
        folderName = path.split('/')[0]
      }
    }

    if (files.size > 0) {
      const asset = await assetLoader.loadFromFiles(files, folderName)
      if (asset) {
        addAsset(asset)
      }
    }

    // Reset input so same folder can be selected again
    input.value = ''
  }

  const handleExport = async () => {
    if (assets.length === 0) return
    await exportScene(assets)
  }

  const handleImport = () => {
    importInputRef.current?.click()
  }

  const handleImportSelect = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !assetLoader) return

    const loadedAssets = await importScene(file, assetLoader)
    for (const asset of loadedAssets) {
      addAsset(asset)
    }

    input.value = ''
  }

  return (
    <div class="toolbar">
      <span class="toolbar-title">Compose Environments</span>

      <div class="toolbar-group">
        {modes.map(({ mode, label, key }) => (
          <button
            key={mode}
            class={`toolbar-btn ${transformMode === mode ? 'active' : ''}`}
            onClick={() => setTransformMode(mode)}
            title={`${label} (${key})`}
          >
            {label}
          </button>
        ))}
      </div>

      <div class="toolbar-group">
        <button class="toolbar-btn" onClick={handleAddAsset}>
          Add Asset
        </button>
        <button class="toolbar-btn" onClick={handleImport}>
          Import
        </button>
        <button
          class="toolbar-btn toolbar-btn-primary"
          onClick={handleExport}
          disabled={assets.length === 0}
        >
          Export
        </button>
      </div>

      <input
        ref={folderInputRef}
        type="file"
        class="hidden-input"
        onChange={handleFolderSelect}
      />
      <input
        ref={importInputRef}
        type="file"
        class="hidden-input"
        accept=".zip"
        onChange={handleImportSelect}
      />
    </div>
  )
}
