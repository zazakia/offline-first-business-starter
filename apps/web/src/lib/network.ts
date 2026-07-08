/**
 * ─── Network Utilities ───────────────────────────────────────
 * Online/offline detection and network quality monitoring.
 */

export type NetworkQuality = 'offline' | 'slow' | 'medium' | 'fast'

export interface NetworkState {
  online: boolean
  quality: NetworkQuality
  type?: string
  downlink?: number
  rtt?: number
}

const listeners = new Set<(state: NetworkState) => void>()

let currentState: NetworkState = {
  online: navigator.onLine,
  quality: getQuality(),
  type: getConnectionType(),
  downlink: getDownlink(),
  rtt: getRtt(),
}

function getQuality(): NetworkQuality {
  if (!navigator.onLine) return 'offline'
  const downlink = getDownlink()
  if (downlink == null) return 'fast'
  if (downlink < 0.5) return 'slow'
  if (downlink < 2) return 'medium'
  return 'fast'
}

function getConnectionType(): string | undefined {
  const conn = (navigator as any).connection
  return conn?.type ?? conn?.effectiveType ?? undefined
}

function getDownlink(): number | undefined {
  const conn = (navigator as any).connection
  return conn?.downlink ?? undefined
}

function getRtt(): number | undefined {
  const conn = (navigator as any).connection
  return conn?.rtt ?? undefined
}

function updateState() {
  currentState = {
    online: navigator.onLine,
    quality: getQuality(),
    type: getConnectionType(),
    downlink: getDownlink(),
    rtt: getRtt(),
  }
  listeners.forEach((cb) => cb(currentState))
}

// Bind network events
window.addEventListener('online', updateState)
window.addEventListener('offline', updateState)

const connection = (navigator as any).connection
if (connection) {
  connection.addEventListener('change', updateState)
}

/**
 * Subscribe to network state changes.
 * Returns unsubscribe function.
 */
export function onNetworkChange(cb: (state: NetworkState) => void): () => void {
  listeners.add(cb)
  // Immediately call with current state
  cb(currentState)
  return () => {
    listeners.delete(cb)
  }
}

/**
 * Get current network state synchronously.
 */
export function getNetworkState(): NetworkState {
  return { ...currentState }
}

/**
 * Wait for network to be online (for retry logic).
 */
export function waitForOnline(timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for network'))
    }, timeoutMs)

    const unsub = onNetworkChange((state) => {
      if (state.online) {
        clearTimeout(timeout)
        unsub()
        resolve()
      }
    })
  })
}
