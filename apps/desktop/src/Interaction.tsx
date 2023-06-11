import { ReactNode, createContext, useContext, useEffect, useRef } from 'react'

type InteractionCtx = {
  setKeyInteractions: (handlerMap: Record<string, () => void>) => () => void
  setRepeaterInteractions: (handlerMap: Record<string, () => void>) => () => void
}
const InteractionContext = createContext<null | InteractionCtx>(null)

export function InteractionProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<Record<string, () => void>>({})
  const repeatHandlersRef = useRef<Record<string, () => void>>({})
  const repeatHandlersState = useRef<Record<string, { down: boolean; downCount: number }>>({})

  function downHandler({ code }: { code: string }) {
    if (repeatHandlersRef.current[code]) {
      repeatHandlersState.current[code] = { down: true, downCount: 0 }
    }
  }
  function upHandler({ code }: { code: string }) {
    if (repeatHandlersRef.current[code]) {
      const state = repeatHandlersState.current[code]
      delete repeatHandlersState.current[code]
      const handler = repeatHandlersRef.current[code]
      if (!handler) return
      if (!state || state.downCount === 0) {
        handler()
        return
      }
    } else if (handlersRef.current[code]) handlersRef.current[code]()
    else {
      console.log('unhandled ' + code)
    }
  }
  useEffect(() => {
    let ticks = setInterval(() => {
      Object.entries(repeatHandlersState.current).forEach(([code, state]) => {
        if (!state.down) return
        state.downCount++
        repeatHandlersRef.current[code]?.()
      })
    }, 100)

    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)

    return () => {
      clearInterval(ticks)
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
    }
  }, [])
  return (
    <InteractionContext.Provider
      value={{
        setRepeaterInteractions: (handlerMap) => {
          Object.entries(handlerMap).forEach(([keyCode, handle]) => {
            if (repeatHandlersRef.current[keyCode])
              throw new Error('keyCode ' + keyCode + ' is being watched twice!')
            repeatHandlersRef.current[keyCode] = handle
          })
          return () => {
            Object.entries(handlerMap).forEach(([keyCode, handle]) => {
              if (repeatHandlersRef.current[keyCode] === handle) {
                delete repeatHandlersRef.current[keyCode]
              }
            })
          }
        },
        setKeyInteractions: (handlerMap) => {
          Object.entries(handlerMap).forEach(([keyCode, handle]) => {
            if (handlersRef.current[keyCode])
              throw new Error('keyCode ' + keyCode + ' is being watched twice!')
            handlersRef.current[keyCode] = handle
          })
          return () => {
            Object.entries(handlerMap).forEach(([keyCode, handle]) => {
              if (handlersRef.current[keyCode] === handle) {
                delete handlersRef.current[keyCode]
              }
            })
          }
        },
      }}
    >
      {children}
    </InteractionContext.Provider>
  )
}

function useInteractionContext() {
  const ctx = useContext(InteractionContext)
  if (!ctx) throw new Error('Must useInteractionContext within a InteractionProvider')
  return ctx
}
export function useKeyInteractions(handlerMap: Record<string, () => void>) {
  const ctx = useInteractionContext()
  useEffect(() => {
    return ctx.setKeyInteractions(handlerMap)
  }, [ctx, handlerMap])
}

export function useDirections(handler: (x: -1 | 0 | 1, y: -1 | 0 | 1) => void) {
  const ctx = useInteractionContext()
  useEffect(() => {
    return ctx.setRepeaterInteractions({
      KeyW: () => handler(0, 1),
      KeyS: () => handler(0, -1),
      KeyA: () => handler(-1, 0),
      KeyD: () => handler(1, 0),
    })
  }, [ctx, handler])
}
