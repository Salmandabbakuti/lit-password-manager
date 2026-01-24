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
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";
import {
  useConnection,
  useWalletClient,
  useReadContract,
  useWriteContract,
  useClient
} from "wagmi";
import { waitForTransactionReceipt } from "viem/actions";
import { encryptData, decryptData } from "./utils/lit";
import {
  CREDENTIAL_MANAGAER_CONTRACT_ADDRESS,
  CREDENTIAL_MANAGAER_CONTRACT_ABI
} from "./utils/constants";
import "./App.css";

export default function App() {
  const [credentials, setCredentials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState({
    read: false,
    write: false,
    delete: false
  });
  const [form] = Form.useForm();

  const { address, isConnected } = useConnection();
  const { data: walletClient } = useWalletClient();
  const client = useClient();

  const { data: credentialsData = [], refetch: refetchGetCredentialsOfUser } =
    useReadContract({
      abi: CREDENTIAL_MANAGAER_CONTRACT_ABI,
      chainId: 80002,
      address: CREDENTIAL_MANAGAER_CONTRACT_ADDRESS,
      functionName: "getCredentialsOf",
      args: [address]
    });

  const { mutateAsync: addCredentialsAsync } = useWriteContract();
  const { mutateAsync: updateCredentialAsync } = useWriteContract();
  const { mutateAsync: deleteCredentialAsync } = useWriteContract();

  const handleGetCredentials = async () => {
    console.log("Fetched Encrypted Credentials:", credentialsData);
    const decryptedCredentials = [];
    setLoading((prev) => ({ ...prev, read: true }));
    try {
      const litClient = await createLitClient({ network: nagaDev });

      for (const cred of credentialsData) {
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
        const decryptedCredential = {
          id: decryptedCredentials.length,
          ...JSON.parse(decryptedCredentialData?.convertedData)
        };
        decryptedCredentials.push(decryptedCredential);
      }
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
    if (address) handleGetCredentials();
  }, [address, credentialsData]);

  // Open add credential modal
  const handleAddCredential = () => {
    setIsModalOpen(true);
    setIsEditMode(true);
    form.resetFields();
    setSelectedCredential(null);
  };

  // Open credential detail modal
  const handleViewCredential = (credential) => {
    setIsModalOpen(true);
    setSelectedCredential(credential);
    setIsEditMode(false);
    form.setFieldsValue(credential);
  };

  // Save credential changes
  const handleSaveCredential = async (values) => {
    if (!isConnected)
      message.error("Please connect your wallet to save changes");
    setLoading((prev) => ({ ...prev, write: true }));
    try {
      console.log("Form Values:", values);

      const credentialsString = JSON.stringify(values);

      const litClient = await createLitClient({ network: nagaDev });

      const encryptedData = await encryptData(
        litClient,
        credentialsString,
        address
      );
      console.log("Encrypted Data:", encryptedData);
      // Update existing credential
      console.log("Selected Credential:", selectedCredential);
      if (selectedCredential) {
        const credentialIndex = selectedCredential.id;
        console.log("Updating credential at index:", credentialIndex);
        const updateTxHash = await updateCredentialAsync({
          abi: CREDENTIAL_MANAGAER_CONTRACT_ABI,
          address: CREDENTIAL_MANAGAER_CONTRACT_ADDRESS,
          chainId: 80002,
          functionName: "updateCredential",
          args: [
            credentialIndex,
            encryptedData.ciphertext,
            `0x${encryptedData.dataToEncryptHash}`
          ]
        });
        console.log("updateCredential TxHash:", updateTxHash);

        // Wait for transaction receipt
        const txReceipt = await waitForTransactionReceipt(client, {
          hash: updateTxHash,
          confirmations: 1
        });
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
        const addTxHash = await addCredentialsAsync({
          abi: CREDENTIAL_MANAGAER_CONTRACT_ABI,
          address: CREDENTIAL_MANAGAER_CONTRACT_ADDRESS,
          chainId: 80002,
          functionName: "addCredential",
          args: [
            encryptedData.ciphertext,
            `0x${encryptedData.dataToEncryptHash}`
          ]
        });
        console.log("addCredential TxHash:", addTxHash);

        // Wait for transaction receipt
        const txReceipt = await waitForTransactionReceipt(client, {
          hash: addTxHash,
          confirmations: 1
        });
        console.log("addCredential TxReceipt:", txReceipt);

        const newCredential = {
          id: credentials.length,
          ...values
        };
        setCredentials([...credentials, newCredential]);
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
  const handleDeleteCredential = async (id) => {
    if (!isConnected) message.error("Please connect your wallet first!");
    setLoading((prev) => ({ ...prev, delete: true }));
    try {
      const txHash = await deleteCredentialAsync({
        abi: CREDENTIAL_MANAGAER_CONTRACT_ABI,
        address: CREDENTIAL_MANAGAER_CONTRACT_ADDRESS,
        chainId: 80002,
        functionName: "deleteCredential",
        args: [id]
      });
      console.log("deleteCredential TxHash:", txHash);
      const txReceipt = await waitForTransactionReceipt(client, {
        hash: txHash,
        confirmations: 1
      });
      console.log("deleteCredential TxReceipt:", txReceipt);
      // upon deletion we need to rearrange the local credentials state
      // same as in contract where the last element replaces the deleted one
      // pop the last element and replace the deleted index with it
      const updatedCredentials = [...credentials];
      if (id < updatedCredentials.length - 1) {
        updatedCredentials[id] =
          updatedCredentials[updatedCredentials.length - 1];
        updatedCredentials[id].id = id; // update id to match index
      }
      updatedCredentials.pop(); // remove last element
      message.success("Credential deleted successfully");
      setCredentials(updatedCredentials);
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
      render: (_, record) => (
        <Button
          type="text"
          icon={<CaretRightOutlined />}
          onClick={() => handleViewCredential(record)}
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
              onClick={refetchGetCredentialsOfUser}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          loading={loading?.read}
          onRow={(record) => ({
            onClick: () => handleViewCredential(record),
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
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Add Credential Modal */}
      <Modal
        title={
          // Modal title changes based on mode with Delete button
          selectedCredential ? (
            <Space style={{ justifyContent: "space-between", width: "95%" }}>
              {"Credential Details"}
              <Popconfirm
                title="Are you sure to delete this credential?"
                onConfirm={() => handleDeleteCredential(selectedCredential.id)}
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
