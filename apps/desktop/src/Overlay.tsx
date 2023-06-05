import { FC, ReactNode, useCallback, useMemo, useState } from 'react'
import { Button, Text, XStack } from '@my/ui'
import { HelpCircle, MessageCircle, Sigma, PlusCircle, MinusCircle } from '@tamagui/lucide-icons'
import { useKeyInteractions } from './Interaction'
import { dispatch } from './Connection'

const HUD_BAR_HEIGHT = 100
const HUD_PADDING = 8
const HUD_BUTTON_SIZE = HUD_BAR_HEIGHT - 2 * HUD_PADDING

type Iconish = FC<{ size: number }>

type InventoryButton = {
  type: 'button'
  onPress: () => void
  icon: Iconish
  label: string
}

type InventoryGroup = {
  type: 'group'
  icon: Iconish
  label: string
  children: InventoryContent
}

type InventoryContent = (InventoryGroup | InventoryButton)[]

function useInventory(): InventoryContent {
  return [
    {
      type: 'button',
      onPress: () => {
        dispatch({
          type: 'WriteFile',
          path: '/Users/ericvicenti/.brainyard',
          value: 'Server Data',
        }).catch((e) => {
          alert('!')
          console.error(e)
        })
      },
      label: 'Help',
      icon: HelpCircle,
    },
    {
      type: 'button',
      onPress: () => {
        alert('message')
      },
      label: 'Text',
      icon: MessageCircle,
    },
    {
      type: 'group',
      label: 'More..',
      icon: Sigma,
      children: [
        {
          type: 'button',
          onPress: () => {
            alert('1')
          },
          label: 'minus',
          icon: MinusCircle,
        },

        {
          type: 'group',
          label: 'More..',
          icon: Sigma,
          children: [
            {
              type: 'button',
              onPress: () => {
                alert('11')
              },
              label: 'minus',
              icon: MinusCircle,
            },
            {
              type: 'button',
              onPress: () => {
                alert('22')
              },
              label: 'plus',
              icon: PlusCircle,
            },
          ],
        },
        {
          type: 'button',
          onPress: () => {
            alert('2')
          },
          label: 'plus',
          icon: PlusCircle,
        },
      ],
    },
  ]
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const inventory = useInventory()
  const [openInventory, setOpenInventory] = useState<number[]>([])
  const canEscape = openInventory.length > 0
  const onDigit = useCallback(
    (digit: number) => {
      const selectIndex = digit - 1
      let walkToActiveInventoryChildren = inventory
      openInventory.forEach((inventoryIndex) => {
        const nextChild = walkToActiveInventoryChildren[inventoryIndex]
        if (!nextChild) throw new Error('Cannot open nothing!')
        if (nextChild.type === 'group') {
          walkToActiveInventoryChildren = nextChild.children
        } else {
          throw new Error('Cannot find this inventory context')
        }
      })
      const selectedInventory = walkToActiveInventoryChildren[selectIndex]
      if (selectedInventory.type === 'group') setOpenInventory((inv) => [...inv, selectIndex])
      else {
        selectedInventory.onPress()
      }
    },
    [openInventory, inventory]
  )

  const onEscape = useCallback(() => {
    setOpenInventory((inv) => inv.slice(0, -1))
  }, [])
  useKeyInteractions(
    useMemo(() => {
      const keyHandlers: Record<string, () => void> = {
        Digit1: () => onDigit(1),
        Digit2: () => onDigit(2),
        Digit3: () => onDigit(3),
      }
      if (canEscape) {
        keyHandlers.Escape = onEscape
      }
      return keyHandlers
    }, [onDigit, onEscape, canEscape])
  )
  let activeIndex = openInventory[0]

  let inventoryRows = [
    <InventoryRow
      items={inventory}
      key="root"
      depth={0}
      activeIndex={activeIndex}
      isFocused={openInventory.length === 0}
      onOpenChild={(child) => {
        setOpenInventory([child])
      }}
    />,
  ]
  let walkToActiveInventoryChildren = inventory
  openInventory.forEach((inventoryIndex, depth) => {
    const childGroup = walkToActiveInventoryChildren[inventoryIndex]
    if (childGroup.type !== 'group') return
    walkToActiveInventoryChildren = childGroup.children
    inventoryRows.push(
      <InventoryRow
        items={childGroup.children}
        key={depth}
        depth={depth + 1}
        isFocused={openInventory.length === depth + 1}
        activeIndex={openInventory[depth + 1]}
        onOpenChild={(child) => {
          setOpenInventory([...openInventory.slice(0, depth + 1), child])
        }}
      />
    )
  })
  return (
    <>
      {children}
      {inventoryRows}
    </>
  )
}

function InventoryRow({
  items,
  depth,
  activeIndex,
  onOpenChild,
  isFocused,
}: {
  items: InventoryContent
  depth: number
  activeIndex?: number
  onOpenChild: (childIndex: number) => void
  isFocused: boolean
}) {
  return (
    <XStack
      position="absolute"
      left={0}
      bottom={depth * HUD_BAR_HEIGHT}
      right={0}
      height={HUD_BAR_HEIGHT}
      padding={HUD_PADDING}
      gap={HUD_PADDING}
      backgroundColor={'#0008'}
    >
      {items.map((option, index) => {
        const Icon = option.icon
        return (
          <Button
            minHeight={HUD_BUTTON_SIZE}
            width={HUD_BUTTON_SIZE}
            key={`${index}-${option.type}`}
            onPress={() => {
              if (option.type === 'group') onOpenChild(index)
              else if (option.type === 'button') option.onPress()
            }}
            {...(activeIndex === index
              ? {
                  borderWidth: 3,
                  borderColor: 'red',
                }
              : {})}
          >
            <Icon size={42} />
            {isFocused ? (
              <Text
                position="absolute"
                left={5}
                top={5}
                fontFamily={'helvetica'}
                pointerEvents="none"
              >
                {index + 1}
              </Text>
            ) : null}
          </Button>
        )
      })}
    </XStack>
  )
}
