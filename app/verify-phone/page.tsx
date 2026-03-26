import { Suspense } from 'react'
import PhoneVerifyRedirect from './VerifyHandler'

export default function SSOPage() {
      return (
            <Suspense fallback={null}>
                  <PhoneVerifyRedirect />
            </Suspense>
      )
}