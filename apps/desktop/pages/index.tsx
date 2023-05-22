import { Heading, YStack } from '@my/ui'
import Head from 'next/head'
import { Game } from '../src/Game'

export default function Page() {
  return (
    <>
      <Head>
        <title>Brainyard</title>
      </Head>
      <YStack minHeight="100vh">
        <Game />
      </YStack>
    </>
  )
}
