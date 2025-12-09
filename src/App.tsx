import { SceneContext, useSceneProvider } from './hooks/useScene'
import { Toolbar } from './components/Toolbar'
import { AssetPanel } from './components/AssetPanel'
import { PropertyPanel } from './components/PropertyPanel'
import { Viewport } from './components/Viewport'

export function App() {
  const sceneValue = useSceneProvider()

  return (
    <SceneContext.Provider value={sceneValue}>
      <div class="app-container">
        <Toolbar />
        <div class="main-content">
          <AssetPanel />
          <Viewport />
          <PropertyPanel />
        </div>
      </div>
    </SceneContext.Provider>
  )
}
