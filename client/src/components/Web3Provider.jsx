import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { ConfigProvider, theme } from "antd";
import { polygonAmoy, mainnet } from "@reown/appkit/networks";

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

// 4. Create modal
createAppKit({
  adapters: [new EthersAdapter()],
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
  );
}
