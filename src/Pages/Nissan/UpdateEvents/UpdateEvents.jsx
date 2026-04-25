import React, { useState, useEffect } from "react";
import api from "../../../api";
import styles from "./UpdateEvents.module.css";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";

const UpdateEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        {
          withCredentials: true,
        }
      );
      setEvents(res.data.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/events/${eventId}`,
          { withCredentials: true }
        );
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchEvents();
  };

  return (
    <div className={styles.updateEvents}>
      <div className={styles.header}>
        <h1>Update Events</h1>
        <button className={styles.createButton} onClick={handleCreate}>
          <FiPlus /> Create Event
        </button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.eventsTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Showing</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event._id}>
                  <td data-label="Name">{event.name}</td>
                  <td data-label="Date">
                    {new Date(event.date).toLocaleDateString()}
                  </td>
                  <td data-label="Showing">{event.showing ? "Yes" : "No"}</td>
                  <td data-label="Actions" className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEdit(event)}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(event._id)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isModalOpen && (
        <EventModal event={selectedEvent} onClose={handleModalClose} />
      )}
    </div>
  );
};

const EventModal = ({ event, onClose }) => {
  const [formData, setFormData] = useState({
    name: event ? event.name : "",
    date: event ? new Date(event.date).toISOString().split("T")[0] : "",
    rules: event ? event.rules.join(", ") : "",
    showing: event ? event.showing : true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      rules: formData.rules
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r),
    };

    try {
      if (event) {
        await api.put(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/events/${event._id}`,
          dataToSubmit,
          { withCredentials: true }
        );
      } else {
        await api.post(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
          dataToSubmit,
          {
            withCredentials: true,
          }
        );
      }
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>{event ? "Edit Event" : "Create Event"}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Rules (comma-separated)</label>
            <input
              type="text"
              name="rules"
              value={formData.rules}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                name="showing"
                checked={formData.showing}
                onChange={handleChange}
              />
              Showing
            </label>
          </div>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateEvents;
