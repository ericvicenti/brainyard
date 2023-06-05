import { writeFile, unlink } from 'fs-extra'

export type WriteFileAction = {
  path: string
  value: string
}

export type DeleteFileAction = {
  path: string
}

const actions = {
  async WriteFile({ path, value }: WriteFileAction) {
    await writeFile(path, value)
    return { path, yes: 1 }
  },
  async DeleteFile({ path }: DeleteFileAction) {
    await unlink(path)
    return { path }
  },
} as const

export type ActionType = keyof typeof actions
export type ServerActionResponse<V extends ActionType> = ReturnType<(typeof actions)[V]>
export type ServerActionRequest<V extends ActionType> = Parameters<(typeof actions)[V]>[0] & {
  type: V
}

export async function ServerDispatch<A extends ActionType>(action: ServerActionRequest<A>) {
  const { type, ...payload } = action
  if (actions[type]) {
    const actionFn = actions[type]
    // @ts-ignore
    return (await actionFn(payload)) || null
  }
  throw new Error('Unknown action')
}
