import React from 'react'

interface Props {
      className?:string
      autoplay?:boolean
}

export const Logo: React.FC<Props> = ({className, autoplay}) => {

      return (
            <div className="bg-emerald-600 text-white p-2 rounded-lg">
                  {/* <Home className=""/> */}

                  {/* <DotLottieReact
      src="/homeswapicon.json"      loop
      autoplay
          className='h-7 w-7'
    rel='preload'
    /> */}

                  <video src="/homeswapicon.webm" className={className ? className : 'h-6 w-6'} autoPlay={autoplay ? true : false} loop muted playsInline />


            </div>
      )
}
