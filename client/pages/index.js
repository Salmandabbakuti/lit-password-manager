import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LitJsSdk from "@lit-protocol/sdk-browser";
// import pinataSDK from "@pinata/sdk";
import { Web3Provider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import Table from "antd/lib/table";
import {
  Space,
  Button,
  Tooltip,
  Input,
  Form,
  Typography,
  Popconfirm,
  Modal
} from "antd";
import {
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import styles from "../styles/Home.module.css";
import "antd/dist/antd.css";
import Lit from "../lib/lit";

const lit = new Lit({ autoConnect: true });

// const pinata = new pinataSDK(process.env.NEXT_PUBLIC_PINATA_API_KEY, process.env.NEXT_PUBLIC_PINATA_API_SECRET_KEY);

const contractAddress = "0x2B740BC4FB538400b3dD4f2f1c79DB57cc52499A";
const abi = [
  "function addKey(string _ipfsHash)",
  "function getMyKeys() view returns (tuple(uint256 id, string ipfsHash, bool isDeleted)[])",
  "function softDeleteKey(uint256 _id)",
  "function updateKey(uint256 _id, string _ipfsHash)"
];

const pinDataToIPFS = async (data) => {
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET_KEY
      },
      body: JSON.stringify(data)
    }
  );
  return response.json();
};

export default function Home() {
  const [ipfsHash, setIpfsHash] = useState("");
  const [decryptedCredentials, setdecryptedCredentials] = useState("");
  const [credentials, setCredentials] = useState({});
  const [credentialsArr, setCredentialsArr] = useState([]);
  const [logMessage, setLogMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [editingCredentials, setEditingCredentials] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (contract) {
      getMyCredentials();
    }
  }, [contract]);

  const handleConnectWallet = async () => {
    if (window?.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      console.log("Using account: ", accounts[0]);
      const provider = new Web3Provider(window.ethereum);
      const { chainId } = await provider.getNetwork();
      if (chainId !== 80001) {
        alert("Wrong Network. Please connect to the Polygon testnet");
        // switch to the polygon testnet
        window.ethereum
          .request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x13881" }]
          })
          .catch((err) => {
            console.error(err.message);
            return;
          });
      }
      console.log("chainId:", chainId);
      setProvider(provider);
      const signer = provider.getSigner();
      const contract = new Contract(contractAddress, abi, signer);
      setContract(contract);
      setLogMessage("Wallet connected");
    } else {
      console.log("Please use Web3 enabled browser");
      setLogMessage("Please use Web3 enabled browser");
    }
  };

  const handleInputChange = (event) =>
    setCredentials({ ...credentials, [event.target.name]: event.target.value });

  const handleEditingInputChange = (event) =>
    setEditingCredentials({
      ...editingCredentials,
      [event.target.name]: event.target.value
    });

  const handleSaveCredentials = async (credentials) => {
    // check username, password, domain are not empty
    if (!contract) return setLogMessage("Please connect wallet first");
    if (!["site", "username", "password"].every((prop) => prop in credentials))
      return setLogMessage("Please fill all fields");
    // check if credentials already exist
    const existingCredentials = credentialsArr.find((cred) =>
      cred.site === credentials.site &&
      cred.username === credentials.username &&
      cred.password === credentials.password
    );
    if (existingCredentials) return setLogMessage("Credentials already exist");
    setLoading(true);
    try {
      const credentialsString = JSON.stringify(credentials);
      console.log("credentialsString", credentialsString);
      const { encryptedString, encryptedSymmetricKey } =
        await lit.encryptString(credentialsString);
      console.log("encryptedString", encryptedString);
      // save encryptedString and encryptedSymmetricKey to ipfs
      // convert stringblob to base64 string
      const encryptedStringBase64 = await LitJsSdk.blobToBase64String(
        encryptedString
      );
      console.log("encryptedStringBase64", encryptedStringBase64);
      console.log("encryptedSymmetricKey", encryptedSymmetricKey);
      const response = await pinDataToIPFS({
        encryptedString: encryptedStringBase64,
        encryptedSymmetricKey
      });
      console.log("response", response);
      setLogMessage(
        `Credentials encrypted and saved to IPFS: ${response.IpfsHash}`
      );
      // save ipfs hash to smart contract
      if (credentials?.id) {
        // update
        const tx = await contract.updateKey(credentials.id, response.IpfsHash);
        setLogMessage(
          `Credentials update submitted. waiting for confirmation: ${tx.hash}`
        );
        await tx.wait();
        setLoading(false);
        return setLogMessage("Credentials updated");
      }
      const tx = await contract.addKey(response.IpfsHash);
      setLogMessage(
        `Transaction submitted: ${tx.hash}. Waiting for confirmation...`
      );
      await tx.wait();
      setLogMessage(`Transaction confirmed: ${tx.hash}`);
      setLoading(false);
    } catch (error) {
      console.log("Something went wrong While saving credentials", error);
      setLogMessage("Something went wrong");
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (id) => {
    if (!contract) return setLogMessage("Please connect wallet first");
    setLoading(true);
    try {
      const tx = await contract.softDeleteKey(id);
      setLogMessage(
        `Transaction submitted: ${tx.hash}. Waiting for confirmation...`
      );
      await tx.wait();
      setLogMessage(`Transaction confirmed: ${tx.hash}`);
      setLoading(false);
    } catch (error) {
      console.log("Something went wrong While deleting credentials", error);
      setLogMessage("Something went wrong");
      setLoading(false);
    }
  };

  const handleViewSavedCredentials = async () => {
    if (!ipfsHash || /^\s*$/.test(ipfsHash))
      return setLogMessage("Please enter a valid IPFS hash");
    setdecryptedCredentials("");
    setLoading(true);
    try {
      const response = await fetch(
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      );
      const { encryptedString, encryptedSymmetricKey } = await response.json();
      console.log("encryptedString", encryptedString);
      console.log("encryptedSymmetricKey", encryptedSymmetricKey);
      // check if encryptedSymmetricKey is empty and string is not empty
      if (!encryptedString || !encryptedSymmetricKey)
        return setLogMessage("Invalid IPFS hash");
      // encryptedString to stringblob
      const encryptedStringBlob = LitJsSdk.base64StringToBlob(encryptedString);
      const { decryptedString } = await lit.decryptString(
        encryptedSymmetricKey,
        encryptedStringBlob
      );
      console.log("decryptedString", decryptedString);
      const decryptedCredentials = JSON.parse(decryptedString);
      console.log("decryptedCredentials", decryptedCredentials);
      setdecryptedCredentials(decryptedCredentials);
      setLogMessage("Credentials retrived successfully");
      setLoading(false);
    } catch (error) {
      console.error(
        "Something went wrong while viewing saved credentials:",
        error
      );
      setLogMessage("Something Went Wrong!");
      setLoading(false);
    }
  };

  const getMyCredentials = async () => {
    if (!contract) return setLogMessage("Please connect wallet first");
    setLoading(true);
    try {
      const myKeys = await contract.getMyKeys();
      // filter out deleted keys
      const unDeletedKeys = myKeys.filter((key) => !key.isDeleted);
      console.log("myKeys", myKeys);
      console.log("unDeletedKeys", unDeletedKeys);
      const credentialsArr = [];
      for (let i = 0; i < unDeletedKeys.length; i++) {
        const response = await fetch(
          `https://gateway.pinata.cloud/ipfs/${unDeletedKeys[i]?.ipfsHash}`
        ).catch((err) => {
          console.error("Failed to get data from Ipfs", err);
        });
        if (!response) continue;
        const { encryptedString, encryptedSymmetricKey } =
          await response.json();
        console.log("encryptedString", encryptedString);
        console.log("encryptedSymmetricKey", encryptedSymmetricKey);
        // check if encryptedSymmetricKey is empty and string is not empty
        if (!encryptedString || !encryptedSymmetricKey) {
          console.error("Invalid IPFS hash");
          continue;
        }
        // encryptedString to stringblob
        const encryptedStringBlob =
          LitJsSdk.base64StringToBlob(encryptedString);
        const { decryptedString } = await lit.decryptString(
          encryptedSymmetricKey,
          encryptedStringBlob
        );
        console.log("decryptedString-->", decryptedString);
        const decryptedCredentials = JSON.parse(decryptedString);
        credentialsArr.push({
          id: unDeletedKeys[i].id,
          ...decryptedCredentials
        });
        console.log("decryptedCredentials-->", decryptedCredentials);
      }
      setCredentialsArr(credentialsArr);
      console.log("credentialsArr-->", credentialsArr);
      setLoading(false);
    } catch (error) {
      console.error("Something went wrong while getting credentials:", error);
      setLogMessage("Something Went Wrong!");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Lit Protocol - Password Manager</title>
        <meta name="description" content="Lit Protocol - Password Manager" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span>Lit Decentralized Password Manager</span>
        </h1>

        <p className={styles.description}>
          Create, save, and manage your passwords securely in decentralized
          world. so you can easily sign in to sites and apps.
        </p>
        {!provider && (
          <Button type="primary" className={styles.button} onClick={handleConnectWallet}>
            Connect Wallet
          </Button>
        )}

        {/* Start of Add Password Modal */}
        <Modal
          title="Save Password"
          open={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
          footer={null}
        >
          <div className={styles.encryptDecryptContainer}>
            <label htmlFor="site">Site</label>
            <Input
              className={styles.input}
              type="text"
              name="site"
              placeholder="example.com"
              onChange={handleInputChange}
            />
            <label htmlFor="username">Username</label>
            <Input
              className={styles.input}
              type="text"
              name="username"
              placeholder="Username"
              onChange={handleInputChange}
            />
            <label htmlFor="password">Password</label>
            <Input.Password
              className={styles.input}
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleInputChange}
            />
            <Button
              type="primary"
              className={styles.button}
              loading={loading}
              onClick={
                provider
                  ? () => handleSaveCredentials(credentials)
                  : handleConnectWallet
              }
            >
              {provider ? "Save" : "Connect Wallet"}
            </Button>
          </div>
          {loading && <p>Loading...</p>}
          <p>{logMessage}</p>
        </Modal>
        {/* End of Add Password Modal */}

        {/* Start of View/Edit Password Modal */}
        <Modal
          title="Edit Password"
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={null}
        >
          <div className={styles.encryptDecryptContainer}>
            <label htmlFor="site">Site</label>
            <Input
              className={styles.input}
              type="text"
              name="site"
              value={editingCredentials?.site || ""}
              placeholder="example.com"
              onChange={handleEditingInputChange}
            />
            <label htmlFor="username">Username</label>
            <Input
              className={styles.input}
              type="text"
              name="username"
              value={editingCredentials?.username || ""}
              placeholder="Username"
              onChange={handleEditingInputChange}
            />
            <label htmlFor="password">Password</label>
            <Input.Password
              className={styles.input}
              type="password"
              name="password"
              value={editingCredentials?.password || ""}
              placeholder="Password"
              onChange={handleEditingInputChange}
            />
            <Button type="primary"
              className={styles.button}
              loading={loading}
              onClick={
                provider
                  ? () => handleSaveCredentials(editingCredentials)
                  : handleConnectWallet
              }
            >
              {provider ? "Save" : "Connect Wallet"}
            </Button>
          </div>
          {loading && <p>Loading...</p>}
          <p>{logMessage}</p>
        </Modal>
        {/* End of View/Edit Password Modal */}

        {/* Start of View Password By Hash Component */}
        {provider && (
          <>
            <div className={styles.credentialsContainer}>
              <h2>My Passwords</h2>
              <Button type="primary" onClick={() => setIsAddModalOpen(true)}>Add<PlusCircleOutlined /></Button>
              {credentialsArr.length ? credentialsArr.map((credential, index) => (
                <div key={index} className={styles.credentialsRow}>
                  <Input
                    readOnly
                    className={styles.rowInput}
                    type="text"
                    value={credential.site}
                  />
                  <Input
                    readOnly
                    className={styles.rowInput}
                    type="text"
                    value={credential.username}
                  />
                  <Input.Password
                    readOnly
                    className={styles.rowInput}
                    type="password"
                    value={credential.password}
                  />
                  {/* edit button */}
                  <Space size="small">
                    <Button
                      type="primary"
                      onClick={() => {
                        setEditingCredentials(credential);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <EditOutlined />
                    </Button>
                    <Popconfirm title="Are you sure?" onConfirm={() => handleDeleteCredential(credential.id)}>
                      <Button
                        type="primary"
                        danger
                      >
                        <DeleteOutlined />
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              )) : (
                <p>
                  You dont have any saved credentials yet. Click on Add
                </p>
              )}
            </div>
            <div className={styles.encryptDecryptContainer}>
              {/* decrypt passwords */}
              <h2>View Saved Password</h2>
              <label htmlFor="ipfsHash">IPFS Hash</label>
              <Input
                className={styles.input}
                type="text"
                placeholder="Enter Your Credentials Ipfs Hash.."
                onChange={(e) => setIpfsHash(e.target.value)}
              />
              <Button
                type="primary"
                className={styles.button}
                onClick={handleViewSavedCredentials}
              >
                View
              </Button>
              {decryptedCredentials && (
                <div className={styles.credentialsContainer}>
                  <label htmlFor="site">Site</label>
                  <Input
                    className={styles.input}
                    type="text"
                    placeholder="Site"
                    value={decryptedCredentials?.site || ""}
                    disabled
                  />
                  <label htmlFor="username">Username</label>
                  <Input
                    className={styles.input}
                    type="text"
                    placeholder="Decrypted Username.."
                    value={decryptedCredentials?.username || ""}
                    disabled
                  />
                  <label htmlFor="password">Password</label>
                  <Input.Password
                    className={styles.input}
                    type="text"
                    placeholder="Decrypted Password.."
                    value={decryptedCredentials?.password || ""}
                    disabled
                  />
                </div>
              )}
            </div>
          </>
        )}
        {/* End of View Password By Hash Component */}

        {loading && <p>Loading...</p>}
        <p>{logMessage}</p>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://github.com/Salmandabbakuti"
          target="_blank"
          rel="noopener noreferrer"
        >
          © 2022 Salman Dabbakuti. Built with Lit Protocol
        </a>
      </footer>
    </div>
  );
}
