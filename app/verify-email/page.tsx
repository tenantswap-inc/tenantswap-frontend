// app/sso/page.tsx

import { Suspense } from 'react'
import EmailVerifyRedirect from './VerifyHandler'
import SSOHanler from '../sso/SSOHandler'

export default function SSOPage() {
  return (
    <Suspense fallback={null}>
      <EmailVerifyRedirect />
    </Suspense>
  )
}