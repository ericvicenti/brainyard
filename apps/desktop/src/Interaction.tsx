import { ReactNode, createContext, useContext, useEffect, useRef } from 'react'

type InteractionCtx = {
  setKeyInteractions: (handlerMap: Record<string, () => void>) => () => void
}
const InteractionContext = createContext<null | InteractionCtx>(null)

export function InteractionProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<Record<string, () => void>>({})
  function downHandler() {}
  function upHandler({ code }: { code: string }) {
    if (handlersRef.current[code]) handlersRef.current[code]()
    else {
      console.log('unhandled ' + code)
    }
  }
  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)

    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
    }
  }, [])
  return (
    <InteractionContext.Provider
      value={{
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
