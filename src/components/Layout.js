import React from "react";
import { Layout, Menu } from "antd";
import { Link } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ color: "white", textAlign: "center", fontSize: "24px" }}>
        GENERATOR CRUD
      </Header>
      <Layout>
        <Sider>
          <Menu theme="dark" mode="inline">
            <Menu.Item key="1">
              <Link to="/">Home</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/customer">Customer</Link>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/sales">sales</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Content style={{ margin: "24px 16px 0" }}>
            <div style={{ padding: 24, background: "#fff", minHeight: 360 }}>
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
