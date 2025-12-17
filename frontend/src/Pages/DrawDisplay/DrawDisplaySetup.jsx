import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./DrawDisplaySetup.module.css";

const BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

const DrawDisplaySetup = () => {
  const [events, setEvents] = useState([]);
  const [configs, setConfigs] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadAll = async () => {
      const evRes = await axios.get(`${BASE_URL}/api/events`);
      const evs = evRes.data.data || [];
      setEvents(evs);

      const cfg = {};

      for (const ev of evs) {
        const dr = await axios.get(
          `${BASE_URL}/api/nissan-draws/${ev._id}`
        );

        const stages = [...new Set(dr.data.data.map(d => d.Stage))].sort(
          (a, b) => parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1])
        );

        cfg[ev._id] = {
          stages,
          start: stages[0],
          end: stages[Math.min(2, stages.length - 1)],
        };
      }

      setConfigs(cfg);
    };

    loadAll();
  }, []);





  const handleStart = () => {
    const payload = events.map(e => ({
      eventId: e._id,
      eventName: e.name,
      start: configs[e._id]?.start,
      end: configs[e._id]?.end,
      scrollSeconds: configs[e._id]?.scrollSeconds || 10,

    }));

    navigate("/tournaments/drawdisplay", {
      state: { config: payload },
    });
  };

  return (
    <div className={styles.setupScreen}>
      <h1 className={styles.setupTitle}>Draw Presentation Setup</h1>

      {events.map(event => (
        <div key={event._id} className={styles.eventCard}>
          <h3>{event.name}</h3>

          {configs[event._id] && (
            <>
              <label>Start Round</label>
              <select
                value={configs[event._id].start}
                onChange={e =>
                  setConfigs(p => ({
                    ...p,
                    [event._id]: {
                      ...p[event._id],
                      start: e.target.value,
                    },
                  }))
                }
              >
                {configs[event._id].stages.map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>

              <label>End Round</label>
              <select
                value={configs[event._id].end}
                onChange={e =>
                  setConfigs(p => ({
                    ...p,
                    [event._id]: {
                      ...p[event._id],
                      end: e.target.value,
                    },
                  }))
                }
              >
                {configs[event._id].stages.map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <label>Scroll Duration (seconds)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={configs[event._id].scrollSeconds || 10}
                onChange={e =>
                  setConfigs(p => ({
                    ...p,
                    [event._id]: {
                      ...p[event._id],
                      scrollSeconds: Number(e.target.value),
                    },
                  }))
                }
              />

            </>
          )}
        </div>
      ))}

      <button className={styles.startBtn} onClick={handleStart}>
        Start Presentation
      </button>
    </div>
  );
};

export default DrawDisplaySetup;
