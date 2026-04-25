import React, { useState, useEffect } from "react";
import api from "../../api";
import styles from "./Events.module.css";
import EventForm from "../../components/EventForm/EventForm";
import { FiEdit, FiPlus, FiTrash2 } from "react-icons/fi";

const Events = () => {
  const [mainEvents, setMainEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchMainEvents = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/main-events`,
        {
          withCredentials: true,
        }
      );
      setMainEvents(res.data.data);
    } catch (error) {
      console.error("Error fetching main events:", error);
    }
  };

  useEffect(() => {
    fetchMainEvents();
  }, []);

  const handleSave = () => {
    setShowForm(false);
    setSelectedEvent(null);
    fetchMainEvents();
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedEvent(null);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(
          `${
            import.meta.env.VITE_APP_BACKEND_URL
          }/api/main-events/delete/${eventId}`,
          { withCredentials: true }
        );
        fetchMainEvents();
      } catch (error) {
        console.error("Error deleting main event:", error);
      }
    }
  };

  return (
    <div className={styles.events}>
      <h1>Events</h1>
      <button
        className={styles.addButton}
        onClick={() => {
          setSelectedEvent(null);
          setShowForm(true);
        }}
      >
        <FiPlus /> Add Event
      </button>
      {showForm && (
        <EventForm
          event={selectedEvent}
          onSave={handleSave}
          onCancel={handleCancel}
          isMainEvent={true}
        />
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Date</th>
            <th>Location</th>
            <th>Organizer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mainEvents.map((event) => (
            <tr key={event._id}>
              <td data-label="Name">{event.name}</td>
              <td data-label="Description">{event.description}</td>
              <td data-label="Date">
                {new Date(event.date).toLocaleDateString()}
              </td>
              <td data-label="Location">{event.location}</td>
              <td data-label="Organizer">{event.organizer}</td>
              <td data-label="Actions">
                <button
                  className={styles.editButton}
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowForm(true);
                  }}
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
  );
};

export default Events;
