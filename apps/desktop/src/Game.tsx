import React, { useState } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { BufferAttribute, Vector3 } from 'three'
import { useKeyPress } from './useKeyPress'
import { LineSegments } from 'three'
import { extend, useLoader } from 'react-three-fiber'
import { LineBasicMaterial, BufferGeometry } from 'three'

// 1 unit of distance = 1 meter

function MeCharacter() {
  const [position, setPosition] = useState<Vector3>(new Vector3(0, 0.5, 0))

  const upPress = useKeyPress('w')
  const downPress = useKeyPress('s')
  const leftPress = useKeyPress('a')
  const rightPress = useKeyPress('d')

  useFrame(() => {
    if (upPress || downPress || leftPress || rightPress)
      console.log('ahaha move', { upPress, downPress, leftPress, rightPress })
    if (upPress) setPosition((position) => new Vector3(position.x, position.y + 1, position.z))
    if (downPress) setPosition((position) => new Vector3(position.x, position.y - 1, position.z))
    if (leftPress) setPosition((position) => new Vector3(position.x - 1, position.y, position.z))
    if (rightPress) setPosition((position) => new Vector3(position.x + 1, position.y, position.z))
  })

  return (
    <mesh position={position}>
      <sphereBufferGeometry attach="geometry" args={[0.5, 30, 30]} />
      <meshStandardMaterial attach="material" color="blue" />
    </mesh>
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeBufferGeometry attach="geometry" args={[100, 100]} />
      <CustomGridHelper />
    </mesh>
  )
}

export function Game() {
  return (
    <Canvas style={{ flexGrow: 1, backgroundColor: 'green' }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Ground />
      <MeCharacter />
    </Canvas>
  )
}
