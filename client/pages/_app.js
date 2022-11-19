import '../styles/globals.css';
import { Breadcrumb, Layout, Menu } from 'antd';

const { Header, Content, Footer } = Layout;

function MyApp({ Component, pageProps }) {

  return (
    <Layout>
      <Header>
        <div className="logo" />
        <Menu theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['2']}
          items={[]}
        >
        </Menu>
      </Header>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
