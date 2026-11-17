import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

export const besuLocal = defineChain({
  id: 1337,
  name: 'Besu QBFT Consortium',
  nativeCurrency: {
    decimals: 18,
    name: 'College Ether',
    symbol: 'cETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
    public: {
      http: ['http://localhost:8545'],
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [besuLocal],
  connectors: [injected()],
  ssr: true,
  transports: {
    [besuLocal.id]: http('http://localhost:8545'),
  },
});
