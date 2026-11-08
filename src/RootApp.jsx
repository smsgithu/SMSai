import { privyEnabled } from './lib/privyEnv.js';
import PrivyRoot from './PrivyRoot.jsx';
import App from './App.jsx';

export default function RootApp() {
  if (!privyEnabled()) return <App privyEnabled={false} />;
  return (
    <PrivyRoot>
      <App privyEnabled />
    </PrivyRoot>
  );
}
