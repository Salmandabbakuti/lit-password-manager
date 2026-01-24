import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import { ConfigProvider, theme } from "antd";
import { polygonAmoy, mainnet } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId from https://dashboard.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

// 2. Create a metadata object - optional
const metadata = {
  name: "CredM",
  description:
    "A secure password manager leveraging Lit Protocol and Smart Contracts.",
  url: "https://example.com", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/179229932"]
};

// 3. Set the networks
const networks = [polygonAmoy, mainnet];

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  allowUnsupportedChain: false,
  defaultNetwork: polygonAmoy,
  themeMode: "dark",
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
});

export default function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
            token: {
              colorPrimary: "#667eea",
              colorBgContainer: "#1f1f1f",
              colorText: "#f0f0f0",
              borderRadius: 8
            }
          }}
        >
          {children}
        </ConfigProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
