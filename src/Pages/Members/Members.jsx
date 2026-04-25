import React, { useState, useEffect } from "react";
import api from "../../api";
import styles from "./Members.module.css";
import { FiTrash2 } from "react-icons/fi";

const Members = () => {
  const [verifiedMembers, setVerifiedMembers] = useState({
    players: [],
    coaches: [],
    academies: [],
    districts: [],
  });

  const fetchVerifiedMembers = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/member/verified`,
        { withCredentials: true }
      );
      setVerifiedMembers(res.data.data);
    } catch (error) {
      console.error("Error fetching verified members:", error);
    }
  };

  useEffect(() => {
    fetchVerifiedMembers();
  }, []);

  const handleRemove = async (memberId, memberType) => {
    if (
      window.confirm(
        "Are you sure you want to remove this member? They will be moved to approvals."
      )
    ) {
      try {
        await api.put(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/member/remove`,
          { memberId, memberType },
          { withCredentials: true }
        );
        fetchVerifiedMembers();
      } catch (error) {
        console.error("Error removing member:", error);
      }
    }
  };

  const renderMemberTable = (title, memberList, memberType) => (
    <div className={styles.category}>
      <h2>{title}</h2>
      {memberList.length === 0 ? (
        <p className={styles.noMembersMessage}>
          No {title.toLowerCase()} available.
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
                  <span className={styles.statusVerified}>
                    {member.status || "Verified"}
                  </span>
                </td>
                <td data-label="Action">
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemove(member._id, memberType)}
                  >
                    <FiTrash2 /> Remove
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
    <div className={styles.members}>
      <h1>Verified Members</h1>
      {renderMemberTable("Players", verifiedMembers.players, "Player")}
      {renderMemberTable("Coaches", verifiedMembers.coaches, "Coach")}
      {renderMemberTable("Academies", verifiedMembers.academies, "Academy")}
      {renderMemberTable("Districts", verifiedMembers.districts, "District")}
    </div>
  );
};

export default Members;
