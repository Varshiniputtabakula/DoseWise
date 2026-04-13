import React from 'react';

export default function ActionLog({ logs = [] }) {
  // Mock logs
  const displayLogs = logs.length > 0 ? logs : [
    { id: 1, action: 'Medication Taken', details: 'Lisinopril 10mg', time: 'Today, 8:05 AM', type: 'success' },
    { id: 2, action: 'Setup Completed', details: 'Patient Profile', time: 'Yesterday, 6:00 PM', type: 'info' },
    { id: 3, action: 'Missed Dose', details: 'Metformin 500mg', time: 'Yesterday, 8:00 PM', type: 'danger' },
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'danger': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="action-log card">
      <div className="timeline">
        {displayLogs.map((log) => (
          <div key={log.id} className="timeline-item">
            <div className="timeline-icon">{getIcon(log.type)}</div>
            <div className="timeline-content">
              <h4>{log.action}</h4>
              <p>{log.details}</p>
              <span className="timestamp">{log.time}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .timeline {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .timeline-item {
            display: flex;
            gap: 1rem;
            align-items: flex-start;
        }
        .timeline-icon {
            font-size: 1.25rem;
            width: 24px;
            text-align: center;
        }
        .timeline-content h4 {
            margin: 0;
            font-size: 1rem;
            color: var(--text-primary);
        }
        .timeline-content p {
            margin: 0.25rem 0;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
        .timestamp {
            font-size: 0.75rem;
            color: var(--text-secondary);
            opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
