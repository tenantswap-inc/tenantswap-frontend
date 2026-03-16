import { Suspense } from 'react'
import SSOHandler from './SSOHandler'

export default function SSOPage() {
  return (
    <Suspense fallback={null}>
      <SSOHandler />
    </Suspense>
  )
}