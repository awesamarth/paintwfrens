import { FC, useState, useEffect } from "react";
import { useWalletContext } from '../contexts/WalletContext';
import {
  COREKIT_STATUS,
  Web3AuthMPCCoreKit,
} from "@web3auth/mpc-core-kit";

const Navbar: FC = () => {
  const { coreKitStatus, login, logout, coreKitInstance } = useWalletContext();
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleWalletAction = () => {
    if (coreKitStatus === COREKIT_STATUS.LOGGED_IN) {
      logout();
    } else {
      login();
    }
  };

  const getUserInfo = async () => {
    if (coreKitInstance && coreKitStatus === COREKIT_STATUS.LOGGED_IN) {
      try {
        const user =  coreKitInstance.getUserInfo();
        console.log("User Info:", user);
        setUserInfo(user);
      } catch (error) {
        console.error("Failed to get user info:", error);
      }
    } else {
      setUserInfo(null);
    }
  };

  useEffect(() => {
    if (coreKitStatus === COREKIT_STATUS.LOGGED_IN) {
      getUserInfo();
    } else {
      setUserInfo(null);
    }
  }, [coreKitStatus, coreKitInstance]);

  return (
    <div className="absolute top-0 w-full z-10 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex-shrink-0 flex items-center text-black text-xl">
          {userInfo && <span>Welcome, {userInfo.name || userInfo.email || 'User'}!</span>}
        </div>
        <div className="flex items-center">
          <button 
            onClick={handleWalletAction}
            className="bg-blue-500 hover:bg-blue-700 z-20 hover:cursor-pointer text-white font-bold py-2 px-4 rounded"
          >
            {coreKitStatus === COREKIT_STATUS.LOGGED_IN ? 'Sign Out' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;