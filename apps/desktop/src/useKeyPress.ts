import { MutableRefObject, useEffect, useRef } from 'react'

// Custom hook to track the state of a key press
export const useKeyPress = (
  targetKey: string,
  handler: (count: number) => void,
  maxSpeed: number // in m/s
) => {
  let interval: MutableRefObject<NodeJS.Timeout | number | null> = useRef(null)

  // Event handlers for key up and key down
  const downHandler = ({ key }: { key: string }) => {
    if (key === targetKey) {
      handler(1)
      interval.current = setInterval(handler, 1000 / maxSpeed)
    }
  }

  const upHandler = ({ key }: { key: string }) => {
    if (key === targetKey && interval) {
      clearInterval(interval.current || undefined)
      interval.current = null
    }
  }

  // Bind and unbind events
  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)

    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
      if (interval) {
        clearInterval(interval.current || undefined)
      }
    }
  }, []) // Empty array ensures effect is only run on mount and unmount
}
