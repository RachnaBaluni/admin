import React, { useState, useEffect } from "react";
import styles from "./LoginPage2.module.css";
import axios from "axios";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

const LoginPage2 = ({
  player,
  events,
  players, // This is a list of existing teams (containing partner1 and partner2 if completed)
  handleNext,
  handleBack,
  playerTeam, // This is the player's current registered teams
}) => {
  const [formData, setFormData] = useState({
    event1: "",
    partner1: "",
    event2: "",
    partner2: "",
  });
  const [event2List, setEvent2List] = useState([]); // Initialize as empty, will be set in useEffect
  const [isEvent2Selected, setIsEvent2Selected] = useState(false);
  const [playerEvent1List, setPlayersEvent1List] = useState([]);
  const [playerEvent2List, setPlayersEvent2List] = useState([]);
  const [errors, setErrors] = useState({});
  const params = useParams();

  const sortPlayersByName = (list) => {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  };

  useEffect(() => {
    // It's generally better to pass player with the correct _id directly.
    // If player._id isn't guaranteed to be available from props, this line ensures it.
    // However, avoid direct prop mutation if 'player' itself is meant to be immutable.
    // For now, keeping it as per your original code.
    player._id = params.id;

    // Only proceed if essential data is available
    if (player?._id && events.length > 0 && players.length > 0) {
      const initialFormData = {
        event1: "",
        partner1: "",
        event2: "",
        partner2: "",
      };
      let currentPartner1 = null;
      let currentPartner2 = null;

      // Populate initial formData based on playerTeam
      if (playerTeam.length > 0) {
        const team1 = playerTeam[0];
        initialFormData.event1 = team1.eventId?._id || "";

        if (team1.partner1?._id === player._id) {
          currentPartner1 = team1.partner2;
        } else {
          currentPartner1 = team1.partner1;
        }
        // Set partner1 directly to the partner's ID
        initialFormData.partner1 = currentPartner1?._id || "";

        if (playerTeam.length > 1) {
          const team2 = playerTeam[1];
          initialFormData.event2 = team2.eventId?._id || "";
          if (team2.partner1?._id === player._id) {
            currentPartner2 = team2.partner2;
          } else {
            currentPartner2 = team2.partner1;
          }
          // Set partner2 directly to the partner's ID
          initialFormData.partner2 = currentPartner2?._id || "";
        }
      }

      setFormData(initialFormData);

      // --- Populate event and partner lists based on initial form data ---

      // Set event2List (events excluding the selected event1)
      if (initialFormData.event1) {
        setEvent2List(
          events.filter((event) => event._id !== initialFormData.event1)
        );
      } else {
        setEvent2List(events); // If no event1 selected, all events are available for event2
      }

      // Helper function to get unique partners for a given event
      const getPartnersForEvent = (
        eventId,
        currentPlayerId,
        currentPartner
      ) => {
        let availablePartners = players
          .filter((team) => team.eventId._id === eventId && !team.partner2)
          .map((team) => team.partner1)
          .filter((p) => p && p._id !== currentPlayerId); // Exclude the current player

        // Add the current partner if they exist and are not already in the list
        if (
          currentPartner &&
          !availablePartners.some((p) => p._id === currentPartner._id)
        ) {
          availablePartners.push(currentPartner);
        }
        // Ensure uniqueness and filter out null/undefined partners
        return [
          ...new Map(
            availablePartners
              .filter((p) => p && p._id)
              .map((item) => [item["_id"], item])
          ).values(),
        ];
      };

      if (initialFormData.event1) {
        setPlayersEvent1List(
          sortPlayersByName(
            getPartnersForEvent(
              initialFormData.event1,
              player._id,
              currentPartner1
            )
          )
        );
      } else {
        setPlayersEvent1List([]); // Clear if no event is selected
      }

      // Populate playerEvent2List and set isEvent2Selected
      if (initialFormData.event2) {
        setIsEvent2Selected(true);
        setPlayersEvent2List(
          sortPlayersByName(
            getPartnersForEvent(
              initialFormData.event2,
              player._id,
              currentPartner2
            )
          )
        );
      } else {
        setIsEvent2Selected(false);
        setPlayersEvent2List([]);
      }
    }
  }, [player, events, players, playerTeam, params.id]); // Added params.id to dependencies

  // Handler for Event 1 selection
  const setEvent1 = (event1Id) => {
    // When event1 changes, reset partner1 to null/empty string
    setFormData((prev) => ({ ...prev, event1: event1Id, partner1: "" }));

    // Update event2List based on selected event1
    setEvent2List(events.filter((event) => event._id !== event1Id));

    // Update playerEvent1List
    if (event1Id) {
      // Find the current partner for this event in playerTeam (if editing existing team)
      const currentTeamForEvent1 = playerTeam.find(
        (team) =>
          team.eventId._id === event1Id &&
          (team.partner1?._id === player._id ||
            team.partner2?._id === player._id)
      );
      let existingPartner = null;
      if (currentTeamForEvent1) {
        existingPartner =
          currentTeamForEvent1.partner1?._id === player._id
            ? currentTeamForEvent1.partner2
            : currentTeamForEvent1.partner1;
      }

      let availablePartners = players
        .filter((team) => team.eventId._id === event1Id && !team.partner2)
        .map((team) => team.partner1)
        .filter((p) => p && p._id !== player._id); // Exclude the current player

      // If there's an existing partner for this event, ensure they are in the list
      if (
        existingPartner &&
        !availablePartners.some((p) => p._id === existingPartner._id)
      ) {
        availablePartners.push(existingPartner);
      }
      const uniquePlayers = [
        ...new Map(
          availablePartners
            .filter((p) => p && p._id)
            .map((item) => [item["_id"], item])
        ).values(),
      ];
      setPlayersEvent1List(sortPlayersByName(uniquePlayers));
    } else {
      setPlayersEvent2List(sortPlayersByName(uniquePlayers));
    }
    setErrors((prev) => ({ ...prev, event1: null }));
  };

  // Handler for Event 2 selection
  const setEvent2 = (event2Id) => {
    // When event2 changes, reset partner2 to null/empty string
    setFormData((prev) => ({ ...prev, event2: event2Id, partner2: "" }));
    setIsEvent2Selected(!!event2Id);

    // Update playerEvent2List
    if (event2Id) {
      // Find the current partner for this event in playerTeam (if editing existing team)
      const currentTeamForEvent2 = playerTeam.find(
        (team) =>
          team.eventId._id === event2Id &&
          (team.partner1?._id === player._id ||
            team.partner2?._id === player._id)
      );
      let existingPartner = null;
      if (currentTeamForEvent2) {
        existingPartner =
          currentTeamForEvent2.partner1?._id === player._id
            ? currentTeamForEvent2.partner2
            : currentTeamForEvent2.partner1;
      }

      let availablePartners = players
        .filter((team) => team.eventId._id === event2Id && !team.partner2)
        .map((team) => team.partner1)
        .filter((p) => p && p._id !== player._id); // Exclude the current player

      // If there's an existing partner for this event, ensure they are in the list
      if (
        existingPartner &&
        !availablePartners.some((p) => p._id === existingPartner._id)
      ) {
        availablePartners.push(existingPartner);
      }

      const uniquePlayers = [
        ...new Map(
          availablePartners
            .filter((p) => p && p._id)
            .map((item) => [item["_id"], item])
        ).values(),
      ];
      setPlayersEvent2List(sortPlayersByName(uniquePlayers));
    } else {
      setPlayersEvent2List([]);
      // This is the crucial part: if event2Id is null, clear partner2
      setFormData((prev) => ({ ...prev, partner2: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.event1) newErrors.event1 = "Event 1 cannot be empty.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNext = async () => {
    if (validateForm()) {
      console.log(formData);
      try {
        await axios.post(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/player/${
            params.id
          }/updateTeams`,
          formData,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );
        toast.success("Teams updated successfully");
        handleNext();
      } catch (error) {
        toast.error("Failed to update teams");
        console.error("Error updating teams:", error);
      }
    }
  };

  return (
    <div className={styles.loginPage2Container}>
      <section className={styles.formSection}>
        <label htmlFor="event1" className={styles.label}>
          Choose Event 1
        </label>
        <select
          id="event1"
          value={formData.event1 || ""} // Ensure value is "" for default option
          onChange={(e) => setEvent1(e.target.value || null)}
          className={styles.select}
        >
          <option value="">-- Select an Event --</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.name}
            </option>
          ))}
        </select>
        {errors.event1 && <div className={styles.error}>{errors.event1}</div>}
      </section>

      <section className={styles.formSection}>
        <label htmlFor="partner1" className={styles.label}>
          Partner for Event 1
        </label>
        <select
          id="partner1"
          value={formData.partner1 || ""} // CORRECTED: Bind directly to formData.partner1
          onChange={(e) =>
            setFormData({
              ...formData,
              partner1: e.target.value || null,
            })
          }
          className={styles.select}
        >
          <option value="">Partner Not Registered</option>
          {playerEvent1List.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </section>

      <section className={styles.formSection}>
        <label htmlFor="event2" className={styles.label}>
          Choose Event 2
        </label>
        <select
          id="event2"
          value={formData.event2 || ""} // Ensure value is "" for default option
          onChange={(e) => setEvent2(e.target.value || null)}
          className={styles.select}
        >
          <option value="">-- Select an Event --</option>
          {event2List.map((event) => (
            <option key={event._id} value={event._id}>
              {event.name}
            </option>
          ))}
        </select>
      </section>

      {isEvent2Selected && (
        <section className={styles.formSection}>
          <label htmlFor="partner2" className={styles.label}>
            Partner for Event 2
          </label>
          <select
            id="partner2"
            value={formData.partner2 || ""} // Ensure value is "" for default option
            onChange={(e) =>
              setFormData({
                ...formData,
                partner2: e.target.value || null,
              })
            }
            className={styles.select}
          >
            <option value="">Partner Not Registered</option>
            {playerEvent2List.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </section>
      )}

      <div className={styles.buttonGroup}>
        <button onClick={handleBack} className={styles.secondaryButton}>
          Back
        </button>
        <button onClick={onNext} className={styles.primaryButton}>
          Save and Next
        </button>
      </div>
    </div>
  );
};

export default LoginPage2;
