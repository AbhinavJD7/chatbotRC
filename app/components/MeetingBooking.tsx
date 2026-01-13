"use client"
import { useState } from 'react'

export interface LeadData {
  email: string;
  name: string;
  title: string;
  date?: string;
  time?: string;
  timezone?: string;
}

interface MeetingBookingProps {
  onComplete: (data: LeadData) => void;
  onCancel?: () => void;
}

const EmailStep = ({ onSubmit }: { onSubmit: (email: string) => void }) => {
  const [email, setEmail] = useState('');

  return (
    <div className="booking-step">
      <p className="booking-question">We may have just a few questions. First, what&apos;s your email address?</p>
      <div className="booking-input-group">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="booking-input"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && email.trim()) {
              onSubmit(email.trim());
            }
          }}
        />
        <button
          onClick={() => email.trim() && onSubmit(email.trim())}
          disabled={!email.trim()}
          className="booking-button"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const NameStep = ({ onSubmit, onBack }: { onSubmit: (name: string) => void; onBack?: () => void }) => {
  const [name, setName] = useState('');

  return (
    <div className="booking-step">
      <p className="booking-question">What is your name?</p>
      <div className="booking-input-group">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className="booking-input"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && name.trim()) {
              onSubmit(name.trim());
            }
          }}
        />
        <button
          onClick={() => name.trim() && onSubmit(name.trim())}
          disabled={!name.trim()}
          className="booking-button"
        >
          Continue
        </button>
      </div>
      {onBack && (
        <button onClick={onBack} className="booking-back-button">
          Back
        </button>
      )}
    </div>
  );
};

const TitleStep = ({ onSubmit, onBack }: { onSubmit: (title: string) => void; onBack?: () => void }) => {
  const [title, setTitle] = useState('');

  return (
    <div className="booking-step">
      <p className="booking-question">Last question, what is your title?</p>
      <div className="booking-input-group">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Your job title"
          className="booking-input"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && title.trim()) {
              onSubmit(title.trim());
            }
          }}
        />
        <button
          onClick={() => title.trim() && onSubmit(title.trim())}
          disabled={!title.trim()}
          className="booking-button"
        >
          Continue
        </button>
      </div>
      {onBack && (
        <button onClick={onBack} className="booking-back-button">
          Back
        </button>
      )}
    </div>
  );
};

const CalendarStep = ({ 
  onSubmit, 
  onBack,
  contactPerson = { name: 'RapidClaims Expert', title: 'Sales Representative' }
}: { 
  onSubmit: (date: string, time: string, timezone: string) => void;
  onBack?: () => void;
  contactPerson?: { name: string; title: string };
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('America/New_York');

  // Generate next 14 days
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Available time slots (business hours)
  const timeSlots = [
    '9:00 am', '9:30 am', '10:00 am', '10:30 am',
    '11:00 am', '11:30 am', '12:00 pm', '12:30 pm',
    '1:00 pm', '1:30 pm', '2:00 pm', '2:30 pm',
    '3:00 pm', '3:30 pm', '4:00 pm', '4:30 pm'
  ];

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Asia/Calcutta', label: 'India Standard Time' },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="booking-step calendar-step">
      <div className="contact-person-card">
        <div className="contact-avatar">{contactPerson.name.charAt(0)}</div>
        <div>
          <div className="contact-name">{contactPerson.name}</div>
          <div className="contact-title">{contactPerson.title}</div>
        </div>
      </div>
      
      <div className="meeting-duration">
        <span>⏱ 15 minutes</span>
        <select 
          value={selectedTimezone} 
          onChange={(e) => setSelectedTimezone(e.target.value)}
          className="timezone-select"
        >
          {timezones.map(tz => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>

      <p className="booking-question">Where should we send the invite?</p>
      
      <div className="calendar-container">
        <div className="calendar-dates">
          <div className="calendar-header">Select Date</div>
          <div className="dates-grid">
            {getAvailableDates().map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`date-button ${selectedDate === dateStr ? 'selected' : ''}`}
                >
                  {formatDate(date)}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="time-slots-container">
            <div className="calendar-header">Select Time</div>
            <div className="time-slots-grid">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`time-slot-button ${selectedTime === time ? 'selected' : ''}`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="booking-actions">
        <button
          onClick={() => selectedDate && selectedTime && onSubmit(selectedDate, selectedTime, selectedTimezone)}
          disabled={!selectedDate || !selectedTime}
          className="booking-button"
        >
          Continue
        </button>
        {onBack && (
          <button onClick={onBack} className="booking-back-button">
            Back
          </button>
        )}
      </div>
    </div>
  );
};

const ConfirmStep = ({ 
  data, 
  onConfirm
}: { 
  data: LeadData; 
  onConfirm: () => void;
}) => {
  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' });
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return `${time} ${data.timezone || 'Eastern Time'}, ${dayName}, ${monthName} ${day}, ${year}`;
  };

  return (
    <div className="booking-step confirm-step">
      <div className="contact-person-card confirmed">
        <div className="contact-avatar confirmed">{data.name.charAt(0)}</div>
        <div>
          <div className="contact-name">{data.name}</div>
          <div className="contact-title">{data.title}</div>
        </div>
        <div className="checkmark">✓</div>
      </div>

      <div className="confirmation-message">
        <h3>Your meeting was scheduled.</h3>
        {data.date && data.time && (
          <p className="meeting-time">{formatDateTime(data.date, data.time)}</p>
        )}
        <p className="meeting-email">Meeting details have been sent to {data.email}</p>
      </div>

      <div className="confirmation-note">
        <p>Your meeting is confirmed and an invite has been sent to your inbox. We look forward to speaking with you!</p>
      </div>

      <button onClick={onConfirm} className="booking-button confirm-button">
        Done
      </button>
    </div>
  );
};

const MeetingBooking = ({ onComplete }: MeetingBookingProps) => {
  const [step, setStep] = useState<'email' | 'name' | 'title' | 'calendar' | 'confirm'>('email');
  const [leadData, setLeadData] = useState<LeadData>({
    email: '',
    name: '',
    title: ''
  });

  const handleEmailSubmit = (email: string) => {
    setLeadData({ ...leadData, email });
    setStep('name');
  };

  const handleNameSubmit = (name: string) => {
    setLeadData({ ...leadData, name });
    setStep('title');
  };

  const handleTitleSubmit = (title: string) => {
    setLeadData({ ...leadData, title });
    setStep('calendar');
  };

  const handleCalendarSelect = (date: string, time: string, timezone: string) => {
    setLeadData({ ...leadData, date, time, timezone });
    setStep('confirm');
  };

  const handleConfirm = async () => {
    // Save lead and create calendar event
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      
      if (response.ok) {
        onComplete(leadData);
      } else {
        console.error('Failed to save lead');
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  return (
    <div className="meeting-booking-container">
      {step === 'email' && <EmailStep onSubmit={handleEmailSubmit} />}
      {step === 'name' && (
        <NameStep 
          onSubmit={handleNameSubmit} 
          onBack={() => setStep('email')} 
        />
      )}
      {step === 'title' && (
        <TitleStep 
          onSubmit={handleTitleSubmit} 
          onBack={() => setStep('name')} 
        />
      )}
      {step === 'calendar' && (
        <CalendarStep 
          onSubmit={handleCalendarSelect} 
          onBack={() => setStep('title')}
        />
      )}
      {step === 'confirm' && (
        <ConfirmStep 
          data={leadData} 
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
};

export default MeetingBooking;
