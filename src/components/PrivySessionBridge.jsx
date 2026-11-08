import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useExportWallet } from '@privy-io/react-auth/solana';

export default function PrivySessionBridge({ onReady }) {
  const { logout, authenticated, getAccessToken } = usePrivy();
  const { exportWallet } = useExportWallet();

  useEffect(() => {
    onReady({
      logout: async () => {
        if (authenticated) await logout();
      },
      getAccessToken,
      exportWallet,
    });
  }, [authenticated, exportWallet, getAccessToken, logout, onReady]);

  return null;
}
