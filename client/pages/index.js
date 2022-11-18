import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LitJsSdk from "@lit-protocol/sdk-browser";
import { GraphQLClient, gql } from "graphql-request";
// import pinataSDK from "@pinata/sdk";
import { Web3Provider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import {
  Space,
  Button,
  Input,
  Popconfirm,
  Modal,
  Spin,
  message,
  Typography,
  Table
} from "antd";
import {
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import styles from "../styles/Home.module.css";
import "antd/dist/antd.css";
import Lit from "../lib/lit";
import {
  errorNotification,
  successNotification,
  infoNotification
} from "../utils";

const lit = new Lit({ autoConnect: true });

const client = new GraphQLClient(
  "https://api.thegraph.com/subgraphs/name/salmandabbakuti/key-manager",
  { headers: {} }
);

const handleNotification = (type, message, description) => {
  switch (type) {
    case "success":
      successNotification(message, description);
      setLogMessage("");
      break;
    case "error":
      errorNotification(message, description);
      setLogMessage("");
      break;
    case "info":
      infoNotification(message, description);
      setLogMessage("");
      break;
    default:
      break;
  }
};

const GET_CREDENTIALS_QUERY = gql`
    query keys(
      $first: Int
      $skip: Int
      $orderBy: Key_orderBy
      $orderDirection: OrderDirection
      $where: Key_filter
    ) {
      keys(
        first: $first
        skip: $skip
        orderBy: $orderBy
        orderDirection: $orderDirection
        where: $where
      ) {
        id
        keyId
        keyA
        keyB
        ipfsHash
        owner
        isDeleted
        updatedAt
      }
    }
  `;

// const pinata = new pinataSDK(process.env.NEXT_PUBLIC_PINATA_API_KEY, process.env.NEXT_PUBLIC_PINATA_API_SECRET_KEY);

const contractAddress = "0xC47CF83080ED29e32ccDf1C9a411C9b614820236";
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

const generteRandomPassword = () => Math.random().toString(36).slice(-10);

export default function Home() {
  // const [ipfsHash, setIpfsHash] = useState("");
  // const [decryptedCredentials, setdecryptedCredentials] = useState("");
  const [credentials, setCredentials] = useState({});
  const [credentialsArr, setCredentialsArr] = useState([]);
  const [logMessage, setLogMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [editingCredentials, setEditingCredentials] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  // only the user who encrypted the data can decrypt it
  const accessControlConditions = [
    {
      contractAddress: "",
      standardContractType: "",
      chain: "mumbai",
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "=",
        value: account
      }
    }
  ];

  useEffect(() => {
    if (contract) {
      getCredentials();
    }
  }, [contract]);

  useEffect(() => {
    if (provider) {
      console.log("window.ethereum", window.ethereum);
      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged", () => window.location.reload());
      window.ethereum.on("connect", (info) =>
        console.log("connected to network", info)
      );
    }
    return () => {
      if (provider) {
        window.ethereum.removeAllListeners();
      }
    };
  }, [provider]);

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
      setAccount(accounts[0]);
      const signer = provider.getSigner();
      const contract = new Contract(contractAddress, abi, signer);
      setContract(contract);
      setLogMessage("Wallet connected");
      infoNotification("Wallet connected", "Wallet connected");
    } else {
      infoNotification("Please install Metamask");
      console.log("Please use Web3 enabled browser");
      setLogMessage("Please use Web3 enabled browser");
    }
  };

  const handleInputChange = (event) =>
    setCredentials({ ...credentials, [event.target.name]: event.target.value });

  const handleEditingGenerateRandomPassword = () => {
    const randomPassword = generteRandomPassword();
    setEditingCredentials({
      ...editingCredentials,
      password: randomPassword
    });
  };

  const handleAddGenerateRandomPassword = () => {
    const randomPassword = generteRandomPassword();
    setCredentials({ ...credentials, password: randomPassword });
  };

  const handleEditingInputChange = (event) =>
    setEditingCredentials({
      ...editingCredentials,
      [event.target.name]: event.target.value
    });

  const handleSaveCredentials = async (credentials) => {
    // check username, password, domain are not
    if (!account) return infoNotification("Please connect wallet first");
    if (!contract) return setLogMessage("Please connect wallet first");
    if (!["site", "username", "password"].every((prop) => credentials[prop]))
      return errorNotification("Please fill all the fields");
    // check if credentials already exist
    const existingCredentials = credentialsArr.find(
      (cred) =>
        cred.site === credentials.site &&
        cred.username === credentials.username &&
        cred.password === credentials.password
    );
    if (existingCredentials)
      return errorNotification("Credentials already exists!");
    setLoading(true);
    try {
      const credentialsString = JSON.stringify(credentials);
      console.log("credentialsString", credentialsString);
      const { encryptedString, encryptedSymmetricKey } =
        await lit.encryptString(credentialsString, accessControlConditions);
      console.log("encryptedString", encryptedString);
      console.log("acls-->", accessControlConditions);
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
      infoNotification(
        "Credentials encrypted and saved to IPFS",
        response.IpfsHash
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
        successNotification("Credentials updated successfully", tx.hash);
        return setLogMessage("Credentials updated");
      }
      const tx = await contract.addKey(response.IpfsHash);
      setLogMessage(
        `Transaction submitted: ${tx.hash}. Waiting for confirmation...`
      );
      await tx.wait();
      setLogMessage(`Transaction confirmed: ${tx.hash}`);
      successNotification("Credentials added successfully");
      setLoading(false);
    } catch (error) {
      console.log("Something went wrong While saving credentials", error);
      errorNotification("Something went wrong While saving credentials");
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
      successNotification("Credentials deleted successfully");
      setLoading(false);
    } catch (error) {
      errorNotification("Something went wrong while deleting credentials!");
      console.log("Something went wrong While deleting credentials", error);
      setLogMessage("Something went wrong");
      setLoading(false);
    }
  };

  // const handleViewSavedCredentials = async () => {
  //   if (!ipfsHash || /^\s*$/.test(ipfsHash))
  //     return setLogMessage("Please enter a valid IPFS hash");
  //   setdecryptedCredentials("");
  //   setLoading(true);
  //   try {
  //     const response = await fetch(
  //       `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
  //     );
  //     const { encryptedString, encryptedSymmetricKey } = await response.json();
  //     console.log("encryptedString", encryptedString);
  //     console.log("encryptedSymmetricKey", encryptedSymmetricKey);
  //     // check if encryptedSymmetricKey is empty and string is not empty
  //     if (!encryptedString || !encryptedSymmetricKey)
  //       return setLogMessage("Invalid IPFS hash");
  //     // encryptedString to stringblob
  //     const encryptedStringBlob = LitJsSdk.base64StringToBlob(encryptedString);
  //     const { decryptedString } = await lit.decryptString(
  //       encryptedSymmetricKey,
  //       encryptedStringBlob,
  //       accessControlConditions
  //     );
  //     console.log("decryptedString", decryptedString);
  //     const decryptedCredentials = JSON.parse(decryptedString);
  //     console.log("decryptedCredentials", decryptedCredentials);
  //     setdecryptedCredentials(decryptedCredentials);
  //     setLogMessage("Credentials retrived successfully");
  //     setLoading(false);
  //   } catch (error) {
  //     console.error(
  //       "Something went wrong while viewing saved credentials:",
  //       error
  //     );
  //     setLogMessage("Something Went Wrong!");
  //     setLoading(false);
  //   }
  // };

  // const getMyCredentials = async () => {
  //   if (!contract) return setLogMessage("Please connect wallet first");
  //   setLoading(true);
  //   try {
  //     const myKeys = await contract.getMyKeys();
  //     // filter out deleted keys
  //     const unDeletedKeys = myKeys.filter((key) => !key.isDeleted);
  //     console.log("myKeys", myKeys);
  //     console.log("unDeletedKeys", unDeletedKeys);
  //     const credentialsArr = [];
  //     for (let i = 0; i < unDeletedKeys.length; i++) {
  //       const response = await fetch(
  //         `https://gateway.pinata.cloud/ipfs/${unDeletedKeys[i]?.ipfsHash}`
  //       ).catch((err) => {
  //         console.error("Failed to get data from Ipfs", err);
  //       });
  //       if (!response) continue;
  //       const { encryptedString, encryptedSymmetricKey } =
  //         await response.json();
  //       console.log("encryptedString", encryptedString);
  //       console.log("encryptedSymmetricKey", encryptedSymmetricKey);
  //       // check if encryptedSymmetricKey is empty and string is not empty
  //       if (!encryptedString || !encryptedSymmetricKey) {
  //         console.error("Invalid IPFS hash");
  //         continue;
  //       }
  //       // encryptedString to stringblob
  //       const encryptedStringBlob =
  //         LitJsSdk.base64StringToBlob(encryptedString);
  //       const { decryptedString } = await lit.decryptString(
  //         encryptedSymmetricKey,
  //         encryptedStringBlob,
  //         accessControlConditions
  //       );
  //       console.log("decryptedString-->", decryptedString);
  //       const decryptedCredentials = JSON.parse(decryptedString);
  //       credentialsArr.push({
  //         id: unDeletedKeys[i].id,
  //         ...decryptedCredentials
  //       });
  //       console.log("decryptedCredentials-->", decryptedCredentials);
  //     }
  //     setCredentialsArr(credentialsArr);
  //     console.log("credentialsArr-->", credentialsArr);
  //     setLoading(false);
  //   } catch (error) {
  //     errorNotification("Something went wrong while fetching credentials");
  //     console.error("Something went wrong while getting credentials:", error);
  //     setLogMessage("Something Went Wrong!");
  //     setLoading(false);
  //   }
  // };

  const getCredentials = () => {
    setLoading(true);
    client
      .request(GET_CREDENTIALS_QUERY, {
        orderBy: "updatedAt",
        orderDirection: "desc",
        where: {
          owner: account,
          isDeleted: false,
          ...searchInput && {
            ipfsHash: searchInput
          }
        }
      })
      .then(async ({ keys }) => {
        console.log("keys", keys);
        const credentialsArr = [];
        for (let i = 0; i < keys.length; i++) {
          const { keyA: encryptedString, keyB: encryptedSymmetricKey } =
            keys[i];
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
            encryptedStringBlob,
            accessControlConditions
          );
          console.log("decryptedString-->", decryptedString);
          const decryptedCredentials = JSON.parse(decryptedString);
          credentialsArr.push({
            id: keys[i].keyId,
            ...decryptedCredentials
          });
          console.log("decryptedCredentials-->", decryptedCredentials);
        }
        setCredentialsArr(credentialsArr);
        console.log("credentialsArr-->", credentialsArr);
        setLoading(false);
      })
      .catch((err) => {
        console.log("err", err);
        errorNotification("Something went wrong while fetching credentials");
        console.error("Something went wrong while getting credentials:", error);
        setLogMessage("Something Went Wrong!");
        setLoading(false);
      });
  };

  const columns = [
    {
      title: "Site",
      key: "site",
      sorter: (a, b) => a.site.localeCompare(b.site),
      ellipsis: true,
      width: "20%",
      render: ({ site }) => (
        <Input
          readOnly
          className={styles.rowInput}
          type="text"
          value={site}
          // copy to clipboard on click
          onClick={(e) => {
            navigator.clipboard.writeText(e.target.value);
            message.success("Copied to clipboard");
          }}
        />
      )
    },
    {
      title: "Username",
      sorter: (a, b) => a.username.localeCompare(b.username),
      key: "username",
      width: "20%",
      render: ({ username }) => (
        <Input
          readOnly
          className={styles.rowInput}
          type="text"
          value={username}

          onClick={(e) => {
            navigator.clipboard.writeText(e.target.value);
            message.success("Copied to clipboard");
          }}
        />
      ),
    },
    {
      title: "Password",
      key: "password",
      sorter: false,
      width: "20%",
      render: ({ password }) => (
        <Input.Password
          value={password}
          // copy to clipboard
          onClick={(e) => {
            e.preventDefault();
            navigator.clipboard.writeText(password);
            message.success("Copied to clipboard");
          }}
        />
      ),
    },
    {
      title: "Actions",
      width: "10%",
      render: (row) => (
        <Space size="small">
          <Button
            type="primary"
            onClick={() => {
              setEditingCredentials(row);
              setIsEditModalOpen(true);
            }}
          >
            <EditOutlined />
          </Button>
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => handleDeleteCredential(row.id)}
          >
            <Button type="primary" danger>
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <Head>
        <title>Lit Protocol - Password Manager</title>
        <meta name="description" content="Lit Protocol - Password Manager" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h3 className={styles.title}>
          Welcome to <span>Lit Decentralized Password Manager</span>
        </h3>

        <p className={styles.description}>
          Create, save, and manage your passwords securely in decentralized
          world. so you can easily sign in to sites and apps.
        </p>
        {!provider && (
          <Button
            type="primary"
            className={styles.button}
            onClick={handleConnectWallet}
          >
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
              value={credentials?.password}
              placeholder="Password"
              onChange={handleInputChange}
            />
            <Button
              type="primary"
              // className={styles.button}
              onClick={handleAddGenerateRandomPassword}
            >
              Suggest Strong Password
            </Button>
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
            {/* generte random password button */}
            <Button
              type="primary"
              // className={styles.button}
              onClick={handleEditingGenerateRandomPassword}
            >
              Suggest Strong Password
            </Button>
            <Button
              type="primary"
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
            <h2>My Passwords</h2>
            <Space>
              <Input.Search
                placeholder="Search by Ipfs Hash.."
                value={searchInput}
                enterButton
                allowClear
                loading={loading}
                onSearch={getCredentials}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="primary" onClick={() => setIsAddModalOpen(true)}>
                Add
                <PlusCircleOutlined />
              </Button>
            </Space>
            <Table
              className="table_grid"
              columns={columns}
              rowKey="id"
              dataSource={credentialsArr}
              scroll={{ x: 970 }}
              loading={loading}
              pagination={{
                pageSizeOptions: [10, 25, 50, 100],
                showSizeChanger: true,
                defaultCurrent: 1,
                defaultPageSize: 10,
                size: "default"
              }}
              onChange={() => { }}
            />
          </>
        )}
        {/* End of View Password By Hash Component */}
        {loading && <p>Loading...</p>}
        {logMessage && errorNotification(logMessage)}
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
