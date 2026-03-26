import { Suspense } from 'react'
import EmailVerifyRedirect from './VerifyHandler'

export default function SSOPage() {
  return (
    <Suspense fallback={null}>
      <EmailVerifyRedirect />
    </Suspense>
  )
}