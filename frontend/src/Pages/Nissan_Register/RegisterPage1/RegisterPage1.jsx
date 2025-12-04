import React, { useState } from "react";
import styles from "./RegisterPage1.module.css"; // Import the CSS module

const RegisterPage1 = ({ formData, setFormData, handleNext }) => {
  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
  const foodOptions = ["Veg", "Non-Veg", "I Won't Be There"];

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required.";
    }
    if (!formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = "WhatsApp Number is required.";
    } else if (!/^\d{10}$/.test(formData.whatsappNumber)) {
      newErrors.whatsappNumber = "WhatsApp Number must be 10 digits.";
    }
    if (!formData.dob) {
      newErrors.dob = "Date of Birth is required.";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }
    if (!formData.shirtSize) {
      newErrors.shirtSize = "Shirt Size is required.";
    }
    // if (!formData.shortSize) {
    //   newErrors.shortSize = "Short Size is required.";
    // }
    if (!formData.foodPref) {
      newErrors.foodPref = "Food Preference is required.";
    }
    if (formData.feePaid && !formData.transactionDetails.trim()) {
      newErrors.transactionDetails =
        "Transaction Details are required if fee is paid.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    // console.log(formData)
    if (validateForm()) {
      handleNext();
    }
  };

  return (
    <div className={styles.registerPage1Container}>
      {" "}
      {/* Applied container class */}
      <section className={styles.formSection}>
        {" "}
        {/* Applied section class */}
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
          className={styles.input} // Applied input class
        />
        {errors.name && <span className={styles.errorText}>{errors.name}</span>}{" "}
        {/* Applied error text class */}
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
          onChange={(e) =>
            setFormData({ ...formData, whatsappNumber: e.target.value })
          }
          className={styles.input}
        />
        {errors.whatsappNumber && (
          <span className={styles.errorText}>{errors.whatsappNumber}</span>
        )}
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
        {errors.dob && <span className={styles.errorText}>{errors.dob}</span>}
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
        {errors.city && <span className={styles.errorText}>{errors.city}</span>}
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
          className={styles.select} // Applied select class
        >
          <option value="">Select Shirt Size</option>
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        {errors.shirtSize && (
          <span className={styles.errorText}>{errors.shirtSize}</span>
        )}
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
        {errors.shortSize && (
          <span className={styles.errorText}>{errors.shortSize}</span>
        )}
      </section> */}
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
        {errors.foodPref && (
          <span className={styles.errorText}>{errors.foodPref}</span>
        )}
      </section>
      <section
        className={styles.formSection}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <label htmlFor="stay" className={styles.checkboxLabel}>
          {" "}
          {/* Applied checkbox label class */}
          {/* <input
            type="checkbox"
            name="stay"
            id="stay"
            checked={formData.stay}
            onChange={(e) =>
              setFormData({ ...formData, stay: e.target.checked })
            }
            className={styles.checkboxInput} // Applied checkbox input class
          />{" "} */}
          Need Accommodation
        </label>

        <input
          name="stay"
          type="radio"
          value="true"
          id="yes"
          checked={formData.stay === true}
          onChange={() => setFormData({ ...formData, stay: true })}
        />
        <label htmlFor="yes" style={{ margin: "0 10px 0 0 " }}>
          Yes
        </label>

        <input
          name="stay"
          type="radio"
          value="false"
          id="no"
          checked={formData.stay === false}
          onChange={() => setFormData({ ...formData, stay: false })}
        />
        <label htmlFor="no" style={{ margin: 0 }}>
          No
        </label>
      </section>
      <section
        className={styles.formSection}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <label htmlFor="feePaid" className={styles.checkboxLabel}>
          {/* <input
            type="checkbox"
            name="feePaid"
            id="feePaid"
            checked={formData.feePaid}
            onChange={(e) =>
              setFormData({ ...formData, feePaid: e.target.checked })
            }
            className={styles.checkboxInput}
          />{" "} */}
          Fee Paid
        </label>

        <input
          name="feePaid"
          type="radio"
          value="true"
          id="paidyes"
          checked={formData.feePaid === true}
          onChange={() => setFormData({ ...formData, feePaid: true })}
        />
        <label htmlFor="paidyes" style={{ margin: "0 10px 0 0 " }}>
          Yes
        </label>

        <input
          name="feePaid"
          type="radio"
          value="false"
          id="paidno"
          checked={formData.feePaid === false}
          onChange={() => setFormData({ ...formData, feePaid: false })}
        />
        <label htmlFor="paidno" style={{ margin: 0 }}>
          No
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
          {errors.transactionDetails && (
            <span className={styles.errorText}>
              {errors.transactionDetails}
            </span>
          )}
        </section>
      )}
      <button onClick={handleSubmit} className={styles.nextButton}>
        Next
      </button>{" "}
      {/* Applied button class */}
    </div>
  );
};

export default RegisterPage1;
