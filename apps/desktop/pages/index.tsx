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
        <Brainyard
          server={process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'localhost:4888'}
        />
      </div>
    </>
  )
}
