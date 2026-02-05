import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Card,
  Popconfirm,
  message,
  Spin,
  Empty
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  CopyOutlined,
  SyncOutlined,
  CaretRightOutlined
} from "@ant-design/icons";
import { BrowserProvider } from "ethers";
import { createWalletClient, custom, getAddress } from "viem";
import {
  useAppKitProvider,
  useAppKitAccount,
  useAppKitState
} from "@reown/appkit/react";
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";
import { encryptData, decryptData } from "./utils/lit";
import { credentialManagerContract } from "./utils";
import "./App.css";

export default function App() {
  const [credentials, setCredentials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // rely purely on array indexes; -1 means "none selected"
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState({
    read: false,
    write: false,
    delete: false
  });
  const [form] = Form.useForm();

  const { address: account, isConnected } = useAppKitAccount();
  const { selectedNetworkId } = useAppKitState();
  const { walletProvider } = useAppKitProvider("eip155");

  const handleGetCredentials = async () => {
    setLoading((prev) => ({ ...prev, read: true }));
    try {
      const credentialsData = await credentialManagerContract.getCredentialsOf(
        account
      );
      console.log("Fetched Encrypted Credentials:", credentialsData);
      const litClient = await createLitClient({ network: nagaDev });
      // prepare wallet client for decryption
      const [account1] = await window.ethereum.request({
        method: "eth_accounts"
      });

      const walletClient = createWalletClient({
        account: getAddress(account1),
        transport: custom(window.ethereum)
      });
      // decrypt credentials concurrently while preserving order
      const decryptedCredentials = await Promise.all(
        credentialsData.map(async (cred) => {
          // datahash without 0x prefix
          const dataToEncryptHash = cred.dataHash.slice(2);
          console.log("Decrypting credential with hash:", dataToEncryptHash);
          const decryptedCredentialData = await decryptData(
            litClient,
            {
              dataToEncryptHash,
              ciphertext: cred.cipherText
            },
            walletClient
          );
          console.log("Decrypted Credential:", decryptedCredentialData);
          // return the parsed credential object; do not attach an explicit `id`
          const parsedCredential = JSON.parse(
            decryptedCredentialData?.convertedData
          );
          return parsedCredential;
        })
      );
      console.log("Decrypted Credentials:", decryptedCredentials);
      setCredentials(decryptedCredentials);
      setLoading((prev) => ({ ...prev, read: false }));
    } catch (error) {
      console.error("Failed to get or decrypt credentials:", error);
      message.error("Failed to get or decrypt credentials");
    } finally {
      setLoading((prev) => ({ ...prev, read: false }));
    }
  };

  useEffect(() => {
    if (account) handleGetCredentials();
  }, [account]);

  // Open add credential modal
  const handleAddCredential = () => {
    setIsModalOpen(true);
    setIsEditMode(true);
    form.resetFields();
    setSelectedIndex(-1);
  };

  // Open credential detail modal
  const handleViewCredential = (index) => {
    if (index == null || index < 0 || index >= credentials.length) return;
    setIsModalOpen(true);
    setSelectedIndex(index);
    setIsEditMode(false);
    form.setFieldsValue(credentials[index]);
  };

  // Save credential changes
  const handleSaveCredential = async (values) => {
    if (!isConnected)
      message.error("Please connect your wallet to save changes");
    console.log(selectedNetworkId);
    if (selectedNetworkId !== "eip155:80002")
      return message.error("Please connect to Amoy testnet");
    setLoading((prev) => ({ ...prev, write: true }));
    try {
      console.log("Form Values:", values);

      const credentialsString = JSON.stringify(values);

      const litClient = await createLitClient({ network: nagaDev });

      // get signer
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();

      const encryptedData = await encryptData(
        litClient,
        credentialsString,
        account
      );
      console.log("Encrypted Data:", encryptedData);

      const { ciphertext, dataToEncryptHash } = encryptedData;
      // prefix with 0x for bytes compatibility
      const dataHash = `0x${dataToEncryptHash}`;
      // Update existing credential
      console.log("Selected index:", selectedIndex);
      if (selectedIndex !== -1) {
        const credentialIndex = selectedIndex;
        console.log("Updating credential at index:", credentialIndex);

        const updateTx = await credentialManagerContract
          .connect(signer)
          .updateCredential(credentialIndex, ciphertext, dataHash);
        console.log("updateCredential TxHash:", updateTx.hash);

        // Wait for transaction receipt
        const txReceipt = await updateTx.wait();
        console.log("updateCredential TxReceipt:", txReceipt);

        // Update local state at index updated
        const updatedCredentials = [...credentials];
        updatedCredentials[credentialIndex] = values;
        setCredentials(updatedCredentials);
        setIsEditMode(false);
        setIsModalOpen(false);
        message.success("Credential updated successfully");
      } else {
        // save as new credential
        const addTx = await credentialManagerContract
          .connect(signer)
          .addCredential(ciphertext, dataHash);
        console.log("addCredential TxHash:", addTx.hash);

        // Wait for transaction receipt
        const txReceipt = await addTx.wait();
        console.log("addCredential TxReceipt:", txReceipt);

        // store values; index will be array index
        setCredentials([...credentials, values]);
        setIsEditMode(false);
        setIsModalOpen(false);
        message.success("Credential added successfully");
      }
    } catch (error) {
      console.error("Failed to save credential:", error);
      message.error(
        `Failed to save credential. ${
          error?.shortMessage || "Please try again"
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, write: false }));
    }
  };

  // Delete credential
  const handleDeleteCredential = async (idx) => {
    if (!isConnected) message.error("Please connect your wallet first!");
    if (selectedNetworkId !== "eip155:80002")
      return message.error("Please connect to Amoy testnet");
    setLoading((prev) => ({ ...prev, delete: true }));
    try {
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const deleteTx = await credentialManagerContract
        .connect(signer)
        .deleteCredential(idx);
      console.log("deleteCredential TxHash:", deleteTx.hash);
      const txReceipt = await deleteTx.wait();
      console.log("deleteCredential TxReceipt:", txReceipt);
      // upon deletion we need to rearrange the local credentials state
      // same as in contract where the last element replaces the deleted one
      // pop the last element and replace the deleted index with it
      const updatedCredentials = [...credentials];
      if (idx === updatedCredentials.length - 1) {
        updatedCredentials.pop();
      } else {
        updatedCredentials.splice(idx, 1, updatedCredentials.pop());
      }
      message.success("Credential deleted successfully");
      setCredentials(updatedCredentials);
      setSelectedIndex(-1);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to delete credential:", error);
      message.error(
        `Failed to delete credential. ${
          error?.shortMessage || "Please try again"
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  // Table columns
  const columns = [
    {
      title: "Site",
      dataIndex: "site",
      key: "site"
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username"
    },
    {
      key: "actions",
      render: (_, record, idx) => (
        <Button
          type="text"
          icon={<CaretRightOutlined />}
          onClick={() => handleViewCredential(idx)}
        />
      )
    }
  ];

  return (
    <>
      <Card
        title="Your Credentials"
        extra={
          <Space>
            <Button
              type="primary"
              shape="round"
              icon={<PlusOutlined />}
              onClick={handleAddCredential}
            >
              Add
            </Button>
            <Button
              type="default"
              shape="circle"
              icon={<SyncOutlined spin={loading?.read} />}
              onClick={handleGetCredentials}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          loading={loading?.read}
          onRow={(_, idx) => ({
            onClick: () => handleViewCredential(idx),
            style: { cursor: "pointer" }
          })}
          dataSource={credentials}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ marginTop: 24 }}
                description={
                  isConnected
                    ? "No credentials found. Click 'Add' to create one."
                    : "Please connect your wallet to manage your credentials."
                }
              />
            )
          }}
          // use array index as identity since we rely on indexes
          rowKey={(_, idx) => idx}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Add Credential Modal */}
      <Modal
        title={
          // Modal title changes based on mode with Delete button
          selectedIndex !== -1 && credentials[selectedIndex] ? (
            <Space style={{ justifyContent: "space-between", width: "95%" }}>
              {"Credential Details"}
              <Popconfirm
                title="Are you sure to delete this credential?"
                onConfirm={() => handleDeleteCredential(selectedIndex)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  shape="circle"
                  danger
                  icon={<DeleteOutlined />}
                  loading={loading?.delete}
                />
              </Popconfirm>
            </Space>
          ) : (
            "Add New Credential"
          )
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button
            key="cancel"
            shape="round"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </Button>,
          <Button
            key="save"
            shape="round"
            type="primary"
            icon={isEditMode ? <SaveOutlined /> : <EditOutlined />}
            loading={loading?.write}
            onClick={() => {
              if (isEditMode) {
                form.submit();
              } else {
                setIsEditMode(true);
              }
            }}
          >
            {isEditMode ? "Save" : "Edit"}
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="on"
          onFinish={handleSaveCredential}
        >
          <Spin spinning={loading?.write}>
            <Form.Item
              label="Site"
              name="site"
              rules={[{ required: true, message: "Site is required" }]}
            >
              <Input
                placeholder="example.com"
                required
                readOnly={!isEditMode}
                suffix={
                  <CopyOutlined
                    onClick={() => {
                      const siteValue = form.getFieldValue("site");
                      navigator.clipboard.writeText(siteValue);
                      message.success("Site copied to clipboard");
                    }}
                    style={{ cursor: "pointer", color: "#1890ff" }}
                  />
                }
              />
            </Form.Item>
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input
                placeholder="Your username"
                required
                readOnly={!isEditMode}
                suffix={
                  <CopyOutlined
                    onClick={() => {
                      const usernameValue = form.getFieldValue("username");
                      navigator.clipboard.writeText(usernameValue);
                      message.success("Username copied to clipboard");
                    }}
                    style={{ cursor: "pointer", color: "#1890ff" }}
                  />
                }
              />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input.Password
                placeholder="Your password"
                required
                readOnly={!isEditMode}
                suffix={
                  <CopyOutlined
                    onClick={() => {
                      const passwordValue = form.getFieldValue("password");
                      navigator.clipboard.writeText(passwordValue);
                      message.success("Password copied to clipboard");
                    }}
                    style={{ cursor: "pointer", color: "#1890ff" }}
                  />
                }
              />
            </Form.Item>
            <Form.Item label="Note" name="note">
              <Input.TextArea
                rows={3}
                placeholder="Add any notes about this credential"
                readOnly={!isEditMode}
              />
            </Form.Item>
          </Spin>
        </Form>
      </Modal>
    </>
  );
}
