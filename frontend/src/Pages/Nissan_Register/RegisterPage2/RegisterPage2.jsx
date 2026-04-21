import React, { useState } from "react";
import styles from "./RegisterPage2.module.css";

const RegisterPage2 = ({
  formData,
  setFormData,
  handleNext,
  handleBack,
  events,
  players,
}) => {
  console.log(events);
  const [errors, setErrors] = useState({});
  const [event2List, setEvent2List] = useState(events);
  const [isEvent2Selected, setIsEvent2Selected] = useState(false);
  const [playerEvent1List, setPlayersEvent1List] = useState([]);
  const [playerEvent2List, setPlayersEvent2List] = useState([]);

  const setEvent1 = (event1Id) => {
    setFormData({ ...formData, event1: event1Id, partner1: null });
    setEvent2List(events.filter((event) => event._id !== event1Id));
    setPlayersEvent1List(
      players
        .filter((player) => player.eventId._id === event1Id && !player.partner2)
        .sort((a, b) => a.partner1.name.localeCompare(b.partner1.name))
    );
    setErrors((prev) => ({ ...prev, event1: null }));
  };

  const setEvent2 = (event2Id) => {
    setFormData({ ...formData, event2: event2Id, partner2: null });
    setIsEvent2Selected(!!event2Id);
    setPlayersEvent2List(
      players
        .filter((player) => player.eventId._id === event2Id && !player.partner2)
        .sort((a, b) => a.partner1.name.localeCompare(b.partner1.name))
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.event1) newErrors.event1 = "Event 1 cannot be empty.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNext = () => {
    if (validateForm()) handleNext();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Register for Events</h2>

      <div className={styles.formGroup}>
        <label htmlFor="event1">Choose Event 1</label>
        <select
          id="event1"
          value={formData.event1 || ""}
          onChange={(e) => setEvent1(e.target.value || null)}
        >
          <option value="">-- Select an Event --</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.name}
            </option>
          ))}
        </select>
        {errors.event1 && <div className={styles.error}>{errors.event1}</div>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="partner1">Partner for Event 1</label>
        <select
          id="partner1"
          value={formData.partner1 || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              partner1: e.target.value || null,
            })
          }
        >
          <option value="">Partner Not Registered</option>
          {playerEvent1List.map((player) => (
            <option
              key={player._id}
              value={player.partner1?._id || player.partner1}
            >
              {player.partner1?.name || "Unnamed Partner"}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="event2">Choose Event 2</label>
        <select
          id="event2"
          value={formData.event2 || ""}
          onChange={(e) => setEvent2(e.target.value || null)}
        >
          <option value="">-- Select an Event --</option>
          {event2List.map((event) => (
            <option key={event._id} value={event._id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {isEvent2Selected && (
        <div className={styles.formGroup}>
          <label htmlFor="partner2">Partner for Event 2</label>
          <select
            id="partner2"
            value={formData.partner2 || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                partner2: e.target.value || null,
              })
            }
          >
            <option value="">Partner Not Registered</option>
            {playerEvent2List.map((player) => (
              <option
                key={player._id}
                value={player.partner1?._id || player.partner1}
              >
                {player.partner1?.name || "Unnamed Partner"}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.buttonGroup}>
        <button onClick={handleBack} className={styles.secondaryButton}>
          Back
        </button>
        <button onClick={onNext} className={styles.primaryButton}>
          Next
        </button>
      </div>
    </div>
  );
};

export default RegisterPage2;
