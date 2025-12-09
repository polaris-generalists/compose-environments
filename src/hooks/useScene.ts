import { createContext } from 'preact'
import { useContext, useState, useCallback } from 'preact/hooks'
import { SceneManager } from '../scene/SceneManager'
import { SelectionManager, TransformMode } from '../scene/SelectionManager'
import { AssetLoader, LoadedAsset } from '../scene/AssetLoader'

export interface SceneState {
  sceneManager: SceneManager | null
  selectionManager: SelectionManager | null
  assetLoader: AssetLoader | null
  assets: LoadedAsset[]
  selectedAsset: LoadedAsset | null
  transformMode: TransformMode
}

export interface SceneActions {
  initScene: (container: HTMLElement) => void
  addAsset: (asset: LoadedAsset) => void
  removeAsset: (id: string) => void
  selectAsset: (asset: LoadedAsset | null) => void
  setTransformMode: (mode: TransformMode) => void
  updateAssetTransform: (id: string, position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }, scale: { x: number; y: number; z: number }) => void
  toggleAssetGravity: (id: string) => void
}

export interface SceneContextValue extends SceneState, SceneActions {}

export const SceneContext = createContext<SceneContextValue | null>(null)

export function useSceneProvider(): SceneContextValue {
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null)
  const [selectionManager, setSelectionManager] = useState<SelectionManager | null>(null)
  const [assetLoader] = useState(() => new AssetLoader())
  const [assets, setAssets] = useState<LoadedAsset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<LoadedAsset | null>(null)
  const [transformMode, setTransformModeState] = useState<TransformMode>('translate')

  const initScene = useCallback((container: HTMLElement) => {
    const sm = new SceneManager(container)
    setSceneManager(sm)

    const sel = new SelectionManager(sm.scene, sm.camera, sm.renderer, sm.controls)
    sel.setOnSelectionChange((asset) => {
      setSelectedAsset(asset)
    })
    setSelectionManager(sel)
  }, [])

  const addAsset = useCallback((asset: LoadedAsset) => {
    if (sceneManager) {
      sceneManager.scene.add(asset.object)
      setAssets((prev) => {
        const newAssets = [...prev, asset]
        selectionManager?.setAssets(newAssets)
        return newAssets
      })
    }
  }, [sceneManager, selectionManager])

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => {
      const asset = prev.find((a) => a.id === id)
      if (asset && sceneManager) {
        sceneManager.scene.remove(asset.object)
        if (selectedAsset?.id === id) {
          selectionManager?.select(null)
        }
      }
      const newAssets = prev.filter((a) => a.id !== id)
      selectionManager?.setAssets(newAssets)
      return newAssets
    })
  }, [sceneManager, selectionManager, selectedAsset])

  const selectAsset = useCallback((asset: LoadedAsset | null) => {
    selectionManager?.select(asset)
  }, [selectionManager])

  const setTransformMode = useCallback((mode: TransformMode) => {
    setTransformModeState(mode)
    selectionManager?.setMode(mode)
  }, [selectionManager])

  const updateAssetTransform = useCallback((
    id: string,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
    scale: { x: number; y: number; z: number }
  ) => {
    const asset = assets.find((a) => a.id === id)
    if (asset) {
      asset.object.position.set(position.x, position.y, position.z)
      asset.object.rotation.set(
        rotation.x * (Math.PI / 180),
        rotation.y * (Math.PI / 180),
        rotation.z * (Math.PI / 180)
      )
      asset.object.scale.set(scale.x, scale.y, scale.z)
    }
  }, [assets])

  const toggleAssetGravity = useCallback((id: string) => {
    setAssets((prev) => {
      return prev.map((asset) => {
        if (asset.id === id) {
          return { ...asset, disableGravity: !asset.disableGravity }
        }
        return asset
      })
    })
  }, [])

  return {
    sceneManager,
    selectionManager,
    assetLoader,
    assets,
    selectedAsset,
    transformMode,
    initScene,
    addAsset,
    removeAsset,
    selectAsset,
    setTransformMode,
    updateAssetTransform,
    toggleAssetGravity,
  }
}

export function useScene(): SceneContextValue {
  const context = useContext(SceneContext)
  if (!context) {
    throw new Error('useScene must be used within SceneContext.Provider')
  }
  return context
}
