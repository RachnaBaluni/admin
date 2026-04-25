import React, { useState, useEffect } from "react";
import api from "../../api";
import styles from "./EventForm.module.css";

const EventForm = ({ event, onSave, onCancel, isMainEvent }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [rules, setRules] = useState("");

  useEffect(() => {
    if (event) {
      setName(event.name);
      setDate(event.date.split("T")[0]);
      setRules(event.rules);
      if (isMainEvent) {
        setDescription(event.description);
        setLocation(event.location);
        setOrganizer(event.organizer);
      }
    }
  }, [event, isMainEvent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eventData = isMainEvent
      ? { name, description, date, location, organizer, rules }
      : { name, date, rules };
    const url = isMainEvent
      ? `${import.meta.env.VITE_APP_BACKEND_URL}/api/main-events`
      : `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`;
    if (event) {
      await api.put(`${url}/update/${event._id}`, eventData, {
        withCredentials: true,
      });
    } else {
      await api.post(`${url}/add`, eventData, { withCredentials: true });
    }
    onSave();
  };

  return (
    <>
      <div className={styles.overlay} onClick={onCancel}></div>
      <form onSubmit={handleSubmit} className={styles.eventForm}>
        <h2>
          {event ? "Edit" : "Add"} {isMainEvent ? "Main Event" : "Event"}
        </h2>
        <input
          type="text"
          placeholder="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {isMainEvent && (
          <>
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Organizer"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              required
            />
          </>
        )}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <textarea
          placeholder="Rules"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
        />
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button type="submit" className={styles.saveButton}>
            Save
          </button>
        </div>
      </form>
    </>
  );
};

export default EventForm;
