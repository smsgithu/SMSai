import { PrivyProvider } from '@privy-io/react-auth';
import { privyAppId, privyClientId } from './lib/privyEnv.js';

export default function PrivyRoot({ children }) {
  const clientId = privyClientId();
  return (
    <PrivyProvider
      appId={privyAppId()}
      {...(clientId ? { clientId } : {})}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'dark',
          walletChainType: 'solana-only',
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
