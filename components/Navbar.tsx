import React from "react";
import Link from "next/link";
import { UserState } from "@/shared/types";

interface Props {
  location: string;
  handleLogout: () => void;
  userState: UserState;
}

const Navbar: React.FC<Props> = ({ location, handleLogout, userState }) => {
return(
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-emerald-600 text-white p-2 rounded-lg">
                  {/* <Home className=""/> */}

                  {/* <DotLottieReact
      src="/homeswapicon.json"      loop
      autoplay
          className='h-7 w-7'
    rel='preload'
    /> */}

    <video src="/homeswapicon.webm"     className='h-6 w-6' autoPlay loop muted/>





                </div>
                <span className="text-xl font-poppins-medium text-slate-900 tracking-tight">
                  Tenant<span className="text-emerald-600 font-poppins-bold">Swap</span>
                </span>
              </Link>
              <div className="flex items-center gap-4">
                {userState.isLoggedIn ? (
                  <>
                    <Link href="/dashboard" className="text-slate-600 hover:text-emerald-600 font-medium">Dashboard</Link>
                    <button
                      onClick={handleLogout}
                      className="text-slate-500 hover:text-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/register" className={ location === "/" ?  "bg-emerald-600 font-poppins-bold text-white px-5 py-2 rounded-full font-semibold  animate-bounce  hover:bg-emerald-700 transition-all shadow-sm" : "bg-emerald-600 font-poppins-bold text-white px-5 py-2 rounded-full font-semibold    hover:bg-emerald-700 transition-all shadow-sm"}>
                    Get Started
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
)

}

export default Navbar;