import React, { ReactNode, useEffect, useReducer, useState } from 'react'
import { Canvas } from 'react-three-fiber'
import { BufferAttribute, Vector3 } from 'three'
import { LineSegments } from 'three'
import { extend } from 'react-three-fiber'
import { LineBasicMaterial, BufferGeometry } from 'three'
import { PerspectiveCamera, Text } from '@react-three/drei'
import { OverlayProvider } from './Overlay'
import { InteractionProvider, useDirections } from './Interaction'
import { ServerConnection, useServerConnection } from './Connection'

// 1 unit of distance = 1 meter

type MoveAction = {
  type: 'move'
  vector: Vector3
}

type JumpAction = {
  type: 'jump'
  vector: Vector3
}

function usePosition() {
  const [position, dispatchPosition] = useReducer(
    (state: Vector3, action: MoveAction | JumpAction) => {
      if (action.type === 'move')
        return new Vector3(
          state.x + action.vector.x,
          state.y + action.vector.y,
          state.z + action.vector.z
        )
      else if (action.type === 'jump') return action.vector
      else return state
    },
    new Vector3(0, 0.5, 0)
  )
  useDirections((x, y) => {
    dispatchPosition({ type: 'move', vector: new Vector3(x, y, 0) })
  })
  return position
}

function MeCharacter() {
  const position = usePosition()

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[position.x, position.y, 500]}
        fov={3}
        near={0.1}
        far={1000}
      />
      <mesh position={position}>
        <sphereBufferGeometry attach="geometry" args={[0.5, 30, 30]} />
        <meshStandardMaterial attach="material" color="#506da3" />
      </mesh>
    </>
  )
}

extend({ LineSegments })

const CustomGridHelper = ({ size = 100, divisions = 100, color = 'gray' }) => {
  const material = new LineBasicMaterial({ color })
  const points = []

  for (let i = -size / 2; i <= size / 2; i += size / divisions) {
    points.push(-size / 2, 0, i, size / 2, 0, i)
    points.push(i, 0, -size / 2, i, 0, size / 2)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(points), 3))

  return <lineSegments geometry={geometry} material={material} />
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, Math.PI / 4, 0]} position={[0, 0, 0]}>
      <CustomGridHelper />
    </mesh>
  )
}

function FloorText({ children }: { children: ReactNode }) {
  return (
    <Text
      font="http://localhost:3000/font/inter-400.woff"
      position={[0, 5, 0.5]}
      rotation={[0, 0, 0]}
      fontSize={3}
      color="#227871"
      textAlign="center"
    >
      {children}
    </Text>
  )
}

function WelcomeText() {
  return <FloorText>Brainplay{'\n'}Coming Soon</FloorText>
}

function useRoom(server: ServerConnection, roomId: string) {
  let [state, setState] = useState(undefined)
  useEffect(() => {
    return server.subscribe(
      `Room:${roomId}`,
      setState // always provide a stable function reference to subscribe
    )
  }, [server, roomId])
  return {
    state,
  }
}

function Room({ id, server }: { id: string; server: string }) {
  const connection = useServerConnection(server)
  const room = useRoom(connection, id)

  return (
    <Canvas style={{ flexGrow: 1 }}>
      <ambientLight intensity={0.5} />
      <Ground />
      {/* <FloorText>{JSON.stringify(room.state)}</FloorText> */}
      <MeCharacter />
      <WelcomeText />
    </Canvas>
  )
}

export function Brainyard({ server }: { server: string }) {
  return (
    <InteractionProvider>
      <OverlayProvider>
        <Room id="HomeRoom" server={server} />
      </OverlayProvider>
    </InteractionProvider>
  )
}
