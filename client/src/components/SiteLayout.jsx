import { Layout } from "antd";
import "antd/dist/reset.css";

const { Header, Footer, Content } = Layout;

export default function SiteLayout({ children }) {
  return (
    <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 99,
          padding: "0 24px",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.15)",
          height: "64px"
        }}
      >
        <h3
          style={{
            margin: 0,
            padding: 0,
            fontWeight: 800,
            fontSize: "1.2rem",
            letterSpacing: "0.5px",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
          }}
        >
          🔑 CredM
        </h3>
        <appkit-button />
      </Header>

      <Content
        style={{
          margin: "0",
          padding: "0",
          backgroundColor: "#1f1f1f",
          minHeight: "calc(100vh - 128px)"
        }}
      >
        {children}
      </Content>

      <Footer
        style={{
          textAlign: "center",
          borderTop: "1px solid #333",
          padding: "24px 20px",
          backgroundColor: "#1f1f1f",
          margin: 0
        }}
      >
        <div style={{ marginBottom: "12px" }}>
          <a
            href="https://github.com/Salmandabbakuti"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: 500,
              transition: "color 0.3s ease"
            }}
          >
            ©{new Date().getFullYear()} CredM. Powered by Polygon
          </a>
        </div>
        <p
          style={{
            fontSize: "12px",
            margin: "0",
            color: "#999",
            fontWeight: 500
          }}
        >
          v0.1.1
        </p>
      </Footer>
    </Layout>
  );
}
