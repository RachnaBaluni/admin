import React, { useEffect, useState } from "react";
import api from "../../../api";
import styles from "./RegistrationFields.module.css";

const RegistrationFields = () => {
  const [fields, setFields] = useState({
    shirtSize: false,
    foodPreference: false,
    accommodation: false,
    feePaid: false,
    transactionDetails: false,
  });

  const handleChange = (key) => {
    setFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    console.log(fields);
  };
  return (
    <div className={styles.container}>
      <h1>Manage Registration Fields</h1>

      <div className={styles.fields}>
        {[
          ["shirtSize", "Shirt Size"],
          ["foodPreference", "Food Preference"],
          ["accommodation", "Accommodation"],
          ["feePaid", "Fee Paid"],
          ["transactionDetails", "Transaction Details"],
        ].map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={fields[key]}
              onChange={() => handleChange(key)}
            />
            {label}
          </label>
        ))}
      </div>

      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default RegistrationFields;
