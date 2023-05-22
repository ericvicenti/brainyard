Lets make a 3d game with react three fiber.

- character is a blue sphere
- wasd moves the character, one key press moves one meter
- the ground plane has grey lines on every meter, forming a grid

---

- we are using typescript and yarn
- this is a next.js app where the game lives on pages/index (home page)
- I have fixed a few things but there are 2 main problems right now
  - the game is only 150px tall, it should fill the full height of the screen (currently salmon colored)
  - up/down keys moves the ball toward camera and away from camera, should move up and down on the screen
- please take your time explain as you go, and self-reflect on your answers
- be curt and frank with me
- use your self-reflection to decide on what _interesting_ comments to make. For example explain how the game board works (what is "1 meter" in this virtual world)
- The current game.tsx file is:

```
import React, { useState } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { Vector3 } from 'three'
import { useKeyPress } from './useKeyPress'

function MeCharacter() {
  const [position, setPosition] = useState<Vector3>(new Vector3(0, 0.5, 0))

  const upPress = useKeyPress('w')
  const downPress = useKeyPress('s')
  const leftPress = useKeyPress('a')
  const rightPress = useKeyPress('d')

  useFrame(() => {
    if (upPress) setPosition(new Vector3(position.x, position.y, position.z - 1))
    if (downPress) setPosition(new Vector3(position.x, position.y, position.z + 1))
    if (leftPress) setPosition(new Vector3(position.x - 1, position.y, position.z))
    if (rightPress) setPosition(new Vector3(position.x + 1, position.y, position.z))
  })

  return (
    <mesh position={position}>
      <sphereBufferGeometry attach="geometry" args={[0.5, 30, 30]} />
      <meshStandardMaterial attach="material" color="blue" />
    </mesh>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeBufferGeometry attach="geometry" args={[100, 100]} />
      <meshStandardMaterial attach="material" color="white" wireframe />
      <gridHelper args={[100, 100]} />
    </mesh>
  )
}

export function Game() {
  return (
    <Canvas style={{ display: 'flex', flexGrow: 1, alignSelf: 'stretch' }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Ground />
      <MeCharacter />
    </Canvas>
  )
}
```

---

ok we are using a ui framework tamagui, it is quite new and we are using a stack component to write the container

```
<XStack backgroundColor={'salmon'} minHeight="100vh" display="flex">
    <Game />
</XStack>
```

in the web browser I can see that the salmon color takes the full height.

oh I added a bg color to the <Canvas> and it takes the full height! so that means the issue is within the Game component. Also I notice the grid looks strange because the lines emminating from the center point are the wrong color, the line moving left from the center point is white, while the lines going up down and right are black. can you fix that please?

---
