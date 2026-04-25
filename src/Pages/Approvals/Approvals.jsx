import React, { useState, useEffect } from "react";
import api from "../../api";
import styles from "./Approvals.module.css";
import { FiCheck, FiTrash2 } from "react-icons/fi";

const Approvals = () => {
  const [pendingMembers, setPendingMembers] = useState({
    players: [],
    coaches: [],
    academies: [],
    districts: [],
  });

  const fetchPendingMembers = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/member/pending`,
        { withCredentials: true }
      );
      setPendingMembers(res.data.data);
    } catch (error) {
      console.error("Error fetching pending members:", error);
    }
  };

  useEffect(() => {
    fetchPendingMembers();
  }, []);

  const handleApprove = async (memberId, memberType) => {
    try {
      await api.put(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/member/approve`,
        { memberId, memberType },
        { withCredentials: true }
      );
      fetchPendingMembers();
    } catch (error) {
      console.error("Error approving member:", error);
    }
  };

  const handleDelete = async (memberId, memberType) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        await api.delete(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/member/delete`,
          { data: { memberId, memberType }, withCredentials: true }
        );
        fetchPendingMembers();
      } catch (error) {
        console.error("Error deleting member:", error);
      }
    }
  };

  const renderMemberTable = (title, memberList, memberType) => (
    <div className={styles.category}>
      <h2>{title}</h2>
      {memberList.length === 0 ? (
        <p className={styles.noMembersMessage}>
          No {title.toLowerCase()} available for approval.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {memberList.map((member) => (
              <tr key={member._id}>
                <td data-label="Name">
                  {member.name || member.academyName || member.districtName}
                </td>
                <td data-label="Email">
                  {member.email || member.emailAddress || member.presidentEmail}
                </td>
                <td data-label="Status">
                  <span
                    className={`${styles.status} ${
                      member.status === "Removed"
                        ? styles.statusRemoved
                        : styles.statusPending
                    }`}
                  >
                    {member.status || "Pending"}
                  </span>
                </td>
                <td data-label="Action" className={styles.actionButtons}>
                  {member.status !== "Verified" && (
                    <button
                      className={styles.approveButton}
                      onClick={() => handleApprove(member._id, memberType)}
                    >
                      <FiCheck /> Approve
                    </button>
                  )}
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(member._id, memberType)}
                  >
                    <FiTrash2 /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className={styles.approvals}>
      <h1>Approvals</h1>
      {renderMemberTable("Players", pendingMembers.players, "Player")}
      {renderMemberTable("Coaches", pendingMembers.coaches, "Coach")}
      {renderMemberTable("Academies", pendingMembers.academies, "Academy")}
      {renderMemberTable("Districts", pendingMembers.districts, "District")}
    </div>
  );
};

export default Approvals;
