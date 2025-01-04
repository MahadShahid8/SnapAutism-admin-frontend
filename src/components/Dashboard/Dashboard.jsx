import React, { useEffect, useState, useCallback } from "react";
import { Table, Tag, Layout, Menu, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const { Header, Content } = Layout;

const Dashboard = () => {
  const [psychologists, setPsychologists] = useState([]);
  const [users, setUsers] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("psychologists");
  const [filteredConsultations, setFilteredConsultations] = useState([]);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    message.success("You have successfully logged out.");
    navigate("/");
  };

  const fetchPsychologists = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch psychologists
      const psychologistResponse = await fetch(
        "https://snapautism-backendd.onrender.com/consultationManagement/psychologists"
      );
      if (!psychologistResponse.ok) {
        throw new Error(`HTTP error! status: ${psychologistResponse.status}`);
      }
      const psychologistData = await psychologistResponse.json();
      console.log(psychologistData);

      if (Array.isArray(psychologistData.data)) {
        // Fetch consultations
        const consultationsResponse = await fetch(
          "https://snapautism-backendd.onrender.com/consultationManagement/getConsultations"
        );
        if (!consultationsResponse.ok) {
          throw new Error(
            `HTTP error! status: ${consultationsResponse.status}`
          );
        }
        const consultationsData = await consultationsResponse.json();
        console.log(consultationsData);
        if (!Array.isArray(consultationsData)) {
          throw new Error("Expected an array of consultations");
        }

        const consultations = consultationsData;

        // Map psychologists with filtered consultation counts
        const psychologistWithCounts = psychologistData.data.map(
          (psychologist) => {
            const psychologistConsultations = consultations.filter(
              (consultation) => consultation.psychologistId === psychologist._id
            );

            return {
              ...psychologist,
              totalConsultations: psychologistConsultations.length,
              key: psychologist._id,
            };
          }
        );

        setPsychologists(psychologistWithCounts);
      } else {
        throw new Error("Expected an array of psychologists");
      }
    } catch (error) {
      console.error("Error fetching psychologists:", error);
      message.error("Failed to load psychologists");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://snapautism-backendd.onrender.com/consultationManagement/getUser"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data.data)) {
        const usersWithCounts = data.data.map((user) => ({
          ...user,
          totalChildren: user.children?.length || 0,
          key: user._id,
        }));
        setUsers(usersWithCounts);
      } else {
        throw new Error("Expected an array of users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const enrichConsultationData = useCallback(
    (consultations, users, psychologists) => {
      return consultations.map((consultation) => {
        const user = users.find((u) => u._id === consultation.userId);
        const psychologist = psychologists.find(
          (p) => p._id === consultation.psychologistId
        );

        return {
          ...consultation,
          userName: user?.username || "N/A",
          userEmail: user?.email || consultation.userId?.email || "N/A",
          psychologistName: psychologist?.username || "N/A",
          psychologistEmail:
            psychologist?.email || consultation.psychologistId?.email || "N/A",
        };
      });
    },
    []
  );

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch consultations, users, and psychologists in parallel
      const [consultationsRes, usersRes, psychologistsRes] = await Promise.all([
        fetch(
          "https://snapautism-backendd.onrender.com/consultationManagement/getConsultations"
        ),
        fetch(
          "https://snapautism-backendd.onrender.com/consultationManagement/getUser"
        ),
        fetch(
          "https://snapautism-backendd.onrender.com/consultationManagement/psychologists"
        ),
      ]);

      if (!consultationsRes.ok || !usersRes.ok || !psychologistsRes.ok) {
        throw new Error("One or more requests failed");
      }

      const [consultationsData, usersData, psychologistsData] =
        await Promise.all([
          consultationsRes.json(),
          usersRes.json(),
          psychologistsRes.json(),
        ]);

      if (Array.isArray(consultationsData)) {
        const enrichedConsultations = enrichConsultationData(
          consultationsData,
          usersData.data || [],
          psychologistsData.data || []
        );

        setConsultations(
          enrichedConsultations.map((consultation) => ({
            ...consultation,
            key: consultation._id,
          }))
        );
      } else {
        throw new Error("Expected an array of consultations");
      }
    } catch (error) {
      console.error("Error fetching consultations:", error);
      message.error("Failed to load consultations");
    } finally {
      setLoading(false);
    }
  }, [enrichConsultationData]);

  useEffect(() => {
    fetchPsychologists();
  }, [fetchPsychologists]);

  useEffect(() => {
    if (view === "users") {
      fetchUsers();
    }
  }, [view, fetchUsers]);

  useEffect(() => {
    if (view === "consultations") {
      fetchConsultations();
    }
  }, [view, fetchConsultations]);

  const handleViewConsultations = useCallback(
    (psychologistId) => {
      const filtered = consultations.filter(
        (consultation) => consultation.psychologistId === psychologistId
      );
      setFilteredConsultations(filtered);
      setView("filteredConsultations");
    },
    [consultations]
  );

  const handleInactivatePsychologist = async (psychologistId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://snapautism-backendd.onrender.com/consultationManagement/psychologists/inactivate/${psychologistId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: false }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setPsychologists((prevPsychologists) =>
        prevPsychologists.map((psychologist) =>
          psychologist._id === psychologistId
            ? { ...psychologist, isActive: false }
            : psychologist
        )
      );

      message.success("Psychologist has been successfully inactivated.");
    } catch (error) {
      console.error("Error inactivating psychologist:", error);
      message.error("Failed to inactivate psychologist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const psychologistColumns = [
    { title: "Username", dataIndex: "username", key: "username", width: 150 },
    { title: "Email", dataIndex: "email", key: "email", width: 200 },
    {
      title: "Specialization",
      dataIndex: "specialization",
      key: "specialization",
      width: 150,
    },
    {
      title: "Total Consultations",
      dataIndex: "totalConsultations",
      key: "totalConsultations",
      width: 100,
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive) =>
        isActive ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <>
          <Button
            type="primary"
            onClick={() => handleViewConsultations(record._id)}
            style={{ marginRight: 8 }}
          >
            View Consultations
          </Button>
          {record.isActive && (
            <Button
              type="default"
              danger
              onClick={() => handleInactivatePsychologist(record._id)}
            >
              Inactivate
            </Button>
          )}
        </>
      ),
    },
  ];

  const userColumns = [
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Total Children",
      dataIndex: "totalChildren",
      key: "totalChildren",
    },
  ];

  const consultationColumns = [
    {
      title: "User Name",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "User Email",
      dataIndex: "userEmail",
      key: "userEmail",
    },
    {
      title: "Psychologist Name",
      dataIndex: "psychologistName",
      key: "psychologistName",
    },
    {
      title: "Psychologist Email",
      dataIndex: "psychologistEmail",
      key: "psychologistEmail",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Start Time",
      dataIndex: ["timeSlot", "startTime"],
      key: "startTime",
      render: (_, record) => record.timeSlot?.startTime || "N/A",
    },
    {
      title: "End Time",
      dataIndex: ["timeSlot", "endTime"],
      key: "endTime",
      render: (_, record) => record.timeSlot?.endTime || "N/A",
    },
    {
      title: "Meet Link",
      dataIndex: "meetLink",
      key: "meetLink",
      render: (meetLink) =>
        meetLink ? (
          <a href={meetLink} target="_blank" rel="noopener noreferrer">
            {meetLink}
          </a>
        ) : (
          "N/A"
        ),
    },
    {
      title: "Verified By User",
      dataIndex: "verifiedByUser",
      key: "verifiedByUser",
      render: (verifiedByUser) => (verifiedByUser ? "Yes" : "No"),
    },
    {
      title: "Completed By Psychologist",
      dataIndex: "CompletedByPsychologist",
      key: "CompletedByPsychologist",
      render: (CompletedByPsychologist) =>
        CompletedByPsychologist ? "Yes" : "No",
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      render: (rating) => rating || "N/A",
    },
    {
      title: "Feedback",
      dataIndex: "feedback",
      key: "feedback",
      render: (feedback) => feedback || "N/A",
    },
  ];

  const handleMenuClick = (e) => {
    setView(e.key);
  };

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <div className="logo">Admin Dashboard</div>
        <Menu
          mode="horizontal"
          onClick={handleMenuClick}
          theme="dark"
          style={{ flex: 1 }}
          selectedKeys={[view]}
        >
          <Menu.Item key="psychologists">Psychologists</Menu.Item>
          <Menu.Item key="users">Users</Menu.Item>
          <Menu.Item key="consultations">Consultations</Menu.Item>
        </Menu>
        <Button type="primary" danger onClick={handleLogout}>
          Logout
        </Button>
      </Header>

      <Content className="dashboard-content">
        <h1>{view.charAt(0).toUpperCase() + view.slice(1)}</h1>
        <Table
          columns={
            view === "psychologists"
              ? psychologistColumns
              : view === "users"
              ? userColumns
              : consultationColumns
          }
          dataSource={
            view === "psychologists"
              ? psychologists
              : view === "users"
              ? users
              : view === "consultations"
              ? consultations
              : filteredConsultations
          }
          loading={loading}
          bordered
        />
      </Content>
    </Layout>
  );
};

export default Dashboard;
