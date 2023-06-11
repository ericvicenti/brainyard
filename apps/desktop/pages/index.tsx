import Head from 'next/head'
import { Brainyard } from '../src/Game'

export default function Page() {
  return (
    <>
      <Head>
        <title>Brainyard</title>
      </Head>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <Brainyard />
      </div>
    </>
  )
}
