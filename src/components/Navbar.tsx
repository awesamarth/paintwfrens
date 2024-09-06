export default function Navbar(){

    return(
    <div className=" absolute top-0 w-full -z-10 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              
            </div>
            <div className="flex items-center">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
    )
}