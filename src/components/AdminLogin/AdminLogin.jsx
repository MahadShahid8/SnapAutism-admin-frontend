import React, { useState } from "react";
import { Form, Input, Button, Layout, message } from "antd";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const { Content } = Layout;

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { email, password } = values;

    try {
      setLoading(true);

      const response = await fetch(
        "https://snapautism-backendd.onrender.com/loginAdmin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Add this
          body: JSON.stringify({ email, password }),
        }
      );

      // Log the response for debugging
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        message.success("Login successful!");
        localStorage.setItem("adminToken", data.token);
        navigate("/dashboard");
      } else {
        message.error(data.message || "Invalid credentials! Please try again.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      message.error("Network error! Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="admin-login-layout">
      <Content className="admin-login-content">
        <div className="login-form-container">
          <h1 className="login-title">Admin Login</h1>
          <Form
            name="admin_login"
            layout="vertical"
            onFinish={onFinish}
            className="login-form"
          >
            {/* Email Input */}
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                {
                  type: "email",
                  message: "Please enter a valid email address!",
                },
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>

            {/* Password Input */}
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            {/* Submit Button */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="login-button"
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default AdminLogin;
