import React, { useState } from 'react'
import { Canvas } from 'react-three-fiber'
import { BufferAttribute, Vector3 } from 'three'
import { useKeyPress } from './useKeyPress'
import { LineSegments } from 'three'
import { extend } from 'react-three-fiber'
import { LineBasicMaterial, BufferGeometry } from 'three'
import { PerspectiveCamera, Text } from '@react-three/drei'

// 1 unit of distance = 1 meter

function MeCharacter() {
  const [position, setPosition] = useState<Vector3>(new Vector3(0, 0.5, 0))

  function moveUp(count = 1) {
    setPosition((position) => new Vector3(position.x, position.y + count, position.z))
  }
  function moveDown(count = 1) {
    setPosition((position) => new Vector3(position.x, position.y - count, position.z))
  }
  function moveLeft(count = 1) {
    setPosition((position) => new Vector3(position.x - count, position.y, position.z))
  }
  function moveRight(count = 1) {
    setPosition((position) => new Vector3(position.x + count, position.y, position.z))
  }
  useKeyPress('w', moveUp, 5)
  useKeyPress('s', moveDown, 5)
  useKeyPress('a', moveLeft, 5)
  useKeyPress('d', moveRight, 5)

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

function HelloWorldText() {
  return (
    <Text
      position={[0, 5, 0.5]}
      rotation={[0, 0, 0]}
      fontSize={3}
      color="#227871"
      textAlign="center"
    >
      Brainplay{'\n'}Coming Soon
    </Text>
  )
}

export function Game() {
  return (
    <Canvas style={{ flexGrow: 1 }}>
      <ambientLight intensity={0.5} />
      <Ground />

      <MeCharacter />
      <HelloWorldText />
    </Canvas>
  )
}
