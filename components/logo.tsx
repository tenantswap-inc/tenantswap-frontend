import React from 'react'
import Image from 'next/image'

export const Logo: React.FC = () => {

      return (
<div className='flex items-center justify-center'>
            <Image
      src={`/assets/TenantSwap Logo Combination monochrome.svg`}
      alt="TenantSwap"
      width={170}
      height={170}
      preload={true}
      quality={100}
      />
</div>
      )
}
