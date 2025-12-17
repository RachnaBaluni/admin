import React, { useEffect, useState } from "react";
import styles from "./LoginPage1.module.css";
import axios from "axios";

const LoginPage1 = ({ player, handleNext, setPlayer, id }) => {
  const [formData, setFormData] = useState({
    name: "",
    whatsappNumber: "",
    dob: "",
    city: "",
    shirtSize: "M",
    shortSize: "M",
    foodPref: "",
    stay: false,
    feePaid: false,
    transactionDetails: "",
  });

  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
  const foodOptions = ["Veg", "Non-Veg", "I Won't Be There"];

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || "",
        whatsappNumber: player.whatsappNumber || "",
        dob: player.dob ? new Date(player.dob).toISOString().split("T")[0] : "",
        city: player.city || "",
        shirtSize: player.shirtSize || "M",
        shortSize: player.shortSize || "M",
        foodPref: player.foodPref || "",
        stay: player.stay || false,
        feePaid: player.feePaid || false,
        transactionDetails: player.transactionDetails || "",
      });
    }
  }, [player]);

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/player/${id}/updatePlayer`,
        { formData },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setPlayer(formData);
        handleNext();
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.registerPage1Container}>
      <section className={styles.formSection}>
        <label htmlFor="fullName" className={styles.label}>
          Full Name
        </label>
        <input
          type="text"
          name="fullName"
          id="fullName"
          placeholder="Full Name..."
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={styles.input}
        />
      </section>
      <section className={styles.formSection}>
        <label htmlFor="whatsappNumber" className={styles.label}>
          WhatsApp Number
        </label>
        <input
          type="tel"
          name="whatsappNumber"
          id="whatsappNumber"
          placeholder="e.g., 9876543210"
          value={formData.whatsappNumber}
          readOnly
          className={styles.input}
        />
      </section>
      <section className={styles.formSection}>
        <label htmlFor="dob" className={styles.label}>
          Date of Birth
        </label>
        <input
          type="date"
          name="dob"
          id="dob"
          value={formData.dob}
          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          className={styles.input}
        />
      </section>
      <section className={styles.formSection}>
        <label htmlFor="city" className={styles.label}>
          City
        </label>
        <input
          type="text"
          name="city"
          id="city"
          placeholder="Your City..."
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className={styles.input}
        />
      </section>
      <section className={styles.formSection}>
        <label htmlFor="shirtSize" className={styles.label}>
          Shirt Size
        </label>
        <select
          name="shirtSize"
          id="shirtSize"
          value={formData.shirtSize}
          onChange={(e) =>
            setFormData({ ...formData, shirtSize: e.target.value })
          }
          className={styles.select}
        >
          <option value="">Select Shirt Size</option>
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </section>
      {/* <section className={styles.formSection}>
        <label htmlFor="shortSize" className={styles.label}>
          Short Size
        </label>
        <select
          name="shortSize"
          id="shortSize"
          value={formData.shortSize}
          onChange={(e) =>
            setFormData({ ...formData, shortSize: e.target.value })
          }
          className={styles.select}
        >
          <option value="">Select Short Size</option>
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </section>*/}
      <section className={styles.formSection}>
        <label htmlFor="foodPref" className={styles.label}>
          Food Preference
        </label>
        <select
          name="foodPref"
          id="foodPref"
          value={formData.foodPref}
          onChange={(e) =>
            setFormData({ ...formData, foodPref: e.target.value })
          }
          className={styles.select}
        >
          <option value="">Select Food Preference</option>
          {foodOptions.map((food) => (
            <option key={food} value={food}>
              {food}
            </option>
          ))}
        </select>
      </section>
      <section className={styles.formSection}>
        <label htmlFor="stay" className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="stay"
            id="stay"
            checked={formData.stay}
            onChange={(e) =>
              setFormData({ ...formData, stay: e.target.checked })
            }
            className={styles.checkboxInput}
          />
          Need Accommodation
        </label>
      </section>
      <section className={styles.formSection}>
        <label htmlFor="feePaid" className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="feePaid"
            id="feePaid"
            checked={formData.feePaid}
            onChange={(e) =>
              setFormData({ ...formData, feePaid: e.target.checked })
            }
            className={styles.checkboxInput}
          />
          Fee Paid
        </label>
      </section>
      {formData.feePaid && (
        <section className={styles.formSection}>
          <label htmlFor="transactionDetails" className={styles.label}>
            Transaction Details
          </label>
          <input
            type="text"
            name="transactionDetails"
            id="transactionDetails"
            placeholder="Enter Transaction Details..."
            value={formData.transactionDetails}
            onChange={(e) =>
              setFormData({ ...formData, transactionDetails: e.target.value })
            }
            className={styles.input}
          />
        </section>
      )}
      <button onClick={handleSubmit} className={styles.nextButton}>
        Next
      </button>
    </div>
  );
};

export default LoginPage1;
