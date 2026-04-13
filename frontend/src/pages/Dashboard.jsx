import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import PillCard from '../components/PillCard';
import ReminderModal from '../components/ReminderModal';
import ActionLog from '../components/ActionLog';

// Helper to construct image URL
const getImageUrl = (filename) => {
  if (!filename) return null;
  // Use REACT_APP_API_URL or default to localhost:8000
  const baseUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:8000';
  return `${baseUrl}/images/${filename}`;
};

function formatNextDose(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return null;
  }
}

function getNextDueMedication(medications, nowMs, windowMinutes = 30, snoozed = {}) {
  const windowMs = windowMinutes * 60 * 1000;
  for (const m of medications) {
    if (m.takenToday) continue;

    // Check if snoozed
    if (snoozed[m.id] && snoozed[m.id] > nowMs) continue;

    const next = m.next_dose_at || m.nextDoseAt;
    if (!next) continue;

    try {
      const nextMs = new Date(next).getTime();
      // Logic: If within window (before or after) OR past due and not taken
      if (Math.abs(nextMs - nowMs) <= windowMs || (nextMs < nowMs && nowMs - nextMs < 12 * 60 * 60 * 1000)) return m;
    } catch (e) { }
  }
  return null;
}

export default function Dashboard() {
  const [medications, setMedications] = useState([]);
  const [profile, setProfile] = useState({ name: '', age: '', conditions: '' });
  const [loading, setLoading] = useState(true);
  const [activeReminder, setActiveReminder] = useState(null);
  const [snoozed, setSnoozed] = useState({}); // Map of id -> timestamp (snoozed until)
  const [wellbeing, setWellbeing] = useState('');
  const [vitalsForm, setVitalsForm] = useState({ blood_pressure: '', heart_rate: '', temperature: '' });
  const [vitalsSubmitting, setVitalsSubmitting] = useState(false);
  const [inventory, setInventory] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const state = await api.getCurrentState();
      const meds = state.medications || [];
      setProfile(state.patient_profile || { name: '', age: '', conditions: '' });
      setMedications(
        meds.map((m, i) => ({
          id: m.name || i,
          name: m.name,
          dosage: m.dosage || '',
          timings: m.timings || ['08:00'],
          time: (m.timings && m.timings[0]) ? m.timings[0] : '08:00',
          instructions:
            (m.before_after_food === 'anytime' ? 'Take as directed' : `Take ${m.before_after_food} food`),
          takenToday: !!m.last_taken_at,
          image: getImageUrl(m.image_file),
          next_dose_at: m.next_dose_at,
          nextDoseAt: m.next_dose_at ? formatNextDose(m.next_dose_at) : null,
        }))
      );
      setInventory(state.inventory || []);
    } catch (e) {
      console.error(e);
      setMedications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for reminders periodically
  useEffect(() => {
    const checkReminders = () => {
      if (activeReminder) return; // Already showing one
      // Pass current snoozed state to checking logic
      // Note: 'snoozed' state in stale closure of setInterval is tricky, 
      // better to use ref or run effect on snoozed change.
      // For simplicity, we'll re-run this effect when stats change.
    };
    checkReminders();
  }, [activeReminder]); // We will tackle loop below

  // Use ref to track active reminder to avoid dependency loops in effect
  const activeReminderRef = React.useRef(activeReminder);

  // Keep ref in sync with state
  useEffect(() => {
    activeReminderRef.current = activeReminder;
  }, [activeReminder]);

  // Revised reminder check effect
  useEffect(() => {
    if (loading) return;

    const check = () => {
      // Check against ref instead of state to avoid dependency loop
      if (activeReminderRef.current) return;

      const due = getNextDueMedication(medications, Date.now(), 30, snoozed);
      if (due) {
        // Ensure we always have an ID (fallback to name)
        const formattedId = due.id || due.name;
        setActiveReminder({
          id: formattedId,
          medicationName: due.name,
          dosage: due.dosage || '',
          instructions: due.instructions,
        });
      }
    };

    check();
    const interval = setInterval(check, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [medications, snoozed, loading]); // Removed activeReminder from dependencies

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitWellbeing = async (e) => {
    e.preventDefault();
    setVitalsSubmitting(true);
    try {
      await api.submitVitals({
        feeling: wellbeing || undefined,
        blood_pressure: vitalsForm.blood_pressure || undefined,
        heart_rate: vitalsForm.heart_rate ? parseInt(vitalsForm.heart_rate, 10) : undefined,
        temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : undefined,
      });
      setWellbeing('');
      setVitalsForm({ blood_pressure: '', heart_rate: '', temperature: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setVitalsSubmitting(false);
    }
  };

  const handleTakeMedication = async (idOrName) => {
    try {
      // Determine if we should send ID or name based on input type
      // Our backend supports 'medication_id' (int) or 'medication_name' (str)
      // The formatting in checkReminders ensures we have an ID or Name

      const payload = typeof idOrName === 'number'
        ? { medication_id: idOrName }
        : { medication_name: idOrName };

      // Call backend to confirm dose
      await api.confirmDose(payload);

      // Reload data to get updated state
      await loadData();

      // If successful, clear the reminder
      // Check both ID and Name properties of activeReminder
      if (activeReminder) {
        const matchesId = activeReminder.id === idOrName;
        const matchesName = activeReminder.medicationName === idOrName;
        if (matchesId || matchesName) {
          setActiveReminder(null);
        }
      }
    } catch (err) {
      console.error('Error confirming dose:', err);
      // Still update UI optimistically for better UX
      setMedications((prev) =>
        prev.map((med) => (med.id === idOrName || med.name === idOrName ? { ...med, takenToday: true } : med))
      );
      // Also clear reminder optimistically
      if (activeReminder) {
        const matchesId = activeReminder.id === idOrName;
        const matchesName = activeReminder.medicationName === idOrName;
        if (matchesId || matchesName) {
          setActiveReminder(null);
        }
      }
    }
  };

  const handleCloseReminder = () => {
    setActiveReminder(null);
  };

  const handleSnooze = (id) => {
    const snoozeUntil = Date.now() + 10 * 60 * 1000; // 10 minutes
    setSnoozed(prev => ({ ...prev, [id]: snoozeUntil }));
    setActiveReminder(null);
  };

  if (loading) return <div className="text-center mt-4">Loading...</div>;

  const patientName = profile.name || 'Patient';
  const pendingCount = medications.filter((m) => !m.takenToday).length;

  // Check for urgent missed doses (within past 2 hours)
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const urgentMissedDoses = medications.filter(med => {
    if (med.takenToday) return false;

    // Check if any timing was within the past 2 hours (but NOT in the future)
    const timings = med.timings || [med.time] || ['08:00'];
    return timings.some(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const doseTime = new Date(now);
      doseTime.setHours(hours, minutes, 0, 0);

      // CRITICAL: Only flag if dose time is in the PAST and within last 2 hours
      // doseTime < now means it's in the past
      // doseTime >= twoHoursAgo means it's within the last 2 hours
      return doseTime < now && doseTime >= twoHoursAgo;
    });
  });

  // Sort medications: urgent missed first, then by next dose time
  const sortedMedications = [...medications].sort((a, b) => {
    const aUrgent = urgentMissedDoses.includes(a);
    const bUrgent = urgentMissedDoses.includes(b);

    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;

    // Otherwise sort by taken status (pending first)
    if (!a.takenToday && b.takenToday) return -1;
    if (a.takenToday && !b.takenToday) return 1;

    return 0;
  });

  return (
    <div className="dashboard">
      <section className="welcome-section">
        <h1>Hello, {patientName}! 👋</h1>
        <p>
          {pendingCount > 0
            ? `You have ${pendingCount} medication${pendingCount > 1 ? 's' : ''} pending today.`
            : 'All medications taken for today! Great job! 🎉'}
        </p>
        {urgentMissedDoses.length > 0 && (
          <div className="urgent-alert">
            <div className="urgent-alert-icon">⚠️</div>
            <div className="urgent-alert-content">
              <strong>Urgent: Missed Dose!</strong>
              <p>
                You missed {urgentMissedDoses.length} dose{urgentMissedDoses.length > 1 ? 's' : ''} in the past 2 hours.
                Please take {urgentMissedDoses.length > 1 ? 'them' : 'it'} as soon as possible!
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="dashboard-grid">
        <section className="medications-section">
          <div className="section-header">
            <h2>Today's Schedule</h2>
            {medications.length > 0 && <span className="badge">{pendingCount} Pending</span>}
          </div>
          {medications.length === 0 ? (
            <p className="empty-state">Go to Setup to add patient details and medications.</p>
          ) : (
            <div className="medications-list">
              {sortedMedications.map((med) => {
                const isUrgent = urgentMissedDoses.includes(med);
                return (
                  <PillCard
                    key={med.id}
                    medication={med}
                    onTake={handleTakeMedication}
                    isUrgent={isUrgent}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="sidebar">
          <div className="wellbeing-section mb-4">
            <h2>How are you feeling?</h2>
            <form onSubmit={handleSubmitWellbeing} className="wellbeing-form">
              <select value={wellbeing} onChange={(e) => setWellbeing(e.target.value)}>
                <option value="">Select...</option>
                <option value="well">Feeling well</option>
                <option value="ok">Okay</option>
                <option value="unwell">Not well</option>
                <option value="tired">Tired</option>
              </select>
              <div className="vitals-optional">
                <input
                  type="text"
                  placeholder="BP (e.g. 120/80)"
                  value={vitalsForm.blood_pressure}
                  onChange={(e) => setVitalsForm((f) => ({ ...f, blood_pressure: e.target.value }))}
                />
                <input
                  type="number"
                  placeholder="Heart rate"
                  value={vitalsForm.heart_rate}
                  onChange={(e) => setVitalsForm((f) => ({ ...f, heart_rate: e.target.value }))}
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Temp (°C)"
                  value={vitalsForm.temperature}
                  onChange={(e) => setVitalsForm((f) => ({ ...f, temperature: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn-primary btn-small" disabled={vitalsSubmitting}>
                {vitalsSubmitting ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>



          <div className="action-log-section">
            <h2>Recent Activity</h2>
            <ActionLog />
          </div>
        </section>
      </div>

      <ReminderModal
        reminder={activeReminder}
        onClose={handleCloseReminder}
        onSnooze={handleSnooze}
        onConfirm={(id) => handleTakeMedication(id || activeReminder?.id)}
      />

      <style jsx>{`
        .welcome-banner {
          margin-bottom: 2rem;
        }
        .subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }
        .empty-state {
          color: var(--text-secondary);
          padding: 2rem;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .badge {
          background: #eff6ff;
          color: var(--primary-color);
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.875rem;
        }
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .wellbeing-form select,
        .wellbeing-form input {
          width: 100%;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        .vitals-optional {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.5rem;
        }
        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
