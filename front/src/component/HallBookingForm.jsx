import React, { useState, useEffect } from 'react';
import './HallBookingForm.css';
import { useNavigate, useLocation } from 'react-router-dom';

const HallBookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get hall data from navigation state or use default
  const hallData = location.state?.hallData || {
    name: 'College Hall',
    capacity: '200 people'
  };

  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: '' });

  useEffect(() => {
    // Get user data from localStorage when component mounts
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    setUser(userData);
  }, []);

  const [formData, setFormData] = useState({
    // User Information for My Bookings
    userId: '',
    username: '',
    
    // Primary Booking Details
    eventName: '',
    eventType: '',
    preferredHall: hallData.name, // Pre-fill with hall name
    backupHall: '',
    bookingType: 'single', // 'single' or 'multiple'
    // Single date booking
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    // Multiple dates for tentative booking
    tentativeDates: [],
    needsSetupTime: false,
    
    // Requester Information
    fullName: '',
    department: '',
    email: '',
    phone: '',
    
    // Event Details
    attendees: '',
    description: '',
    
    // Technical Requirements
    avEquipment: [],
    furniture: [],
    needsInternet: false,
    
    // Additional Services
    needsSecurity: false,
    additionalNotes: ''
  });

  const [currentTentativeDate, setCurrentTentativeDate] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });

  // Update form data with user information when user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        userId: user.userId || user.id || '',
        username: user.username || user.name || ''
      }));
    }
  }, [user]);

  const halls = [
    'Auditorium','Euphresia Conference Hall','Christ Conference Hall', 'Silver Jubilee Seminar Hall','Lissieux Seminar Hall','Marian Hall'
  ];

  const eventTypes = [
    'Academic Lecture','Student Club Meeting','Conference / Workshop','Examination','Cultural Event','Social Gathering','Private Function',
    'Other'
  ];

  const avEquipmentOptions = [
    'Microphone (Lapel)',
    'Microphone (Handheld)',
    'Microphone (Podium)',
    'Projector & Screen',
    'Laptop/PC Connection',
    'Sound System',
    'Video Conferencing',
    'Live Streaming',
    'Whiteboard/Flip Chart'
  ];

  const furnitureOptions = [
    'Podium',
    'Additional Tables',
    'Stage',
    'Special Lighting',
    'Display Boards'
  ];

  const showMessage = (title, message, type = 'info') => {
    setModalContent({ title, message, type });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (name, value, isChecked) => {
    setFormData(prev => ({
      ...prev,
      [name]: isChecked 
        ? [...prev[name], value]
        : prev[name].filter(item => item !== value)
    }));
  };

  const handleTentativeDateChange = (e) => {
    const { name, value } = e.target;
    setCurrentTentativeDate(prev => ({
      ...prev,
      [name]: value
    }));
  };
const hallCapacityRules = {
  "Auditorium": { min: 400, max: 1000 },
  "Euphresia Conference Hall": { min: 10, max: 20 },
  "Christ Conference Hall": { min: 20, max: 30 },
  "Silver Jubilee Seminar Hall": { min: 80, max: 130 },
  "Lissieux Seminar Hall": { min: 100, max: 150 },
  "Marian Hall": { min: 200, max: 350 }
};

  const addTentativeDate = () => {
    if (currentTentativeDate.date && currentTentativeDate.startTime && currentTentativeDate.endTime) {
      const newDate = {
        id: Date.now(),
        date: currentTentativeDate.date,
        startTime: currentTentativeDate.startTime,
        endTime: currentTentativeDate.endTime
      };
      
      setFormData(prev => ({
        ...prev,
        tentativeDates: [...prev.tentativeDates, newDate]
      }));
      
      // Reset current date form
      setCurrentTentativeDate({
        date: '',
        startTime: '',
        endTime: ''
      });
    }
  };

  const removeTentativeDate = (id) => {
    setFormData(prev => ({
      ...prev,
      tentativeDates: prev.tentativeDates.filter(date => date.id !== id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      showMessage('Login Required', 'Please log in to book a hall.', 'warning');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    if (formData.bookingType === 'multiple' && formData.tentativeDates.length === 0) {
      showMessage('Incomplete Information', 'Please add at least one tentative date.', 'warning');
      return;
    }

    // 10 digit phone validation
    if (!/^\d{10}$/.test(formData.phone)) {
      showMessage('Invalid Phone Number', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showMessage('Invalid Email', 'Please enter a valid email address.', 'error');
      return;
    }
const hallRule = hallCapacityRules[formData.preferredHall];

if (hallRule) {
  const attendees = Number(formData.attendees);

  if (attendees < hallRule.min || attendees > hallRule.max) {
    showMessage(
      'Invalid Attendee Count',
      `For ${formData.preferredHall}, attendees must be between ${hallRule.min} and ${hallRule.max}.`,
      'warning'
    );
    return;
  }
}
    try {
      // Check hall availability BEFORE submission
      if (formData.bookingType === 'single') {
        const availabilityCheck = await fetch(
          `http://localhost:3000/availability?hall=${formData.preferredHall}&date=${formData.startDate}&startTime=${formData.startTime}&endTime=${formData.endTime}`
        );

        const availability = await availabilityCheck.json();

        if (!availability.available) {
          showMessage('Hall Not Available', 'This hall is already booked for the selected date & time. Please choose a different date/time or hall.', 'error');
          return;
        }
      }

      // Prepare the data to send
      const bookingData = {
        ...formData,
        userId: user.userId || user.id,
        username: user.username || user.name
      };

      const response = await fetch('http://localhost:3000/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();
      
      if (response.ok) {
        const message = formData.bookingType === 'multiple' 
          ? `Tentative booking request submitted for ${formData.tentativeDates.length} date(s)! Your reference number: ${result.bookingReference}. You will need to confirm your final date at least one week before the event.`
          : `Booking request submitted successfully! Your reference number: ${result.bookingReference}.`;
        
        showMessage(
          'Booking Request Submitted!', 
          message, 
          'success'
        );
        
        // Reset form after successful submission
        setFormData({
          // Keep user info
          userId: user.userId || user.id,
          username: user.username || user.name,
          
          // Reset other fields
          eventName: '',
          eventType: '',
          preferredHall: hallData.name,
          backupHall: '',
          bookingType: 'single',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          tentativeDates: [],
          needsSetupTime: false,
          fullName: '',
          department: '',
          email: '',
          phone: '',
          attendees: '',
          description: '',
          avEquipment: [],
          furniture: [],
          needsInternet: false,
          needsSecurity: false,
          additionalNotes: ''
        });
      } else {
        showMessage('Submission Failed', `Error: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showMessage('Network Error', 'Error submitting booking request. Please check your connection and try again.', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Modal Component
  const Modal = () => {
    if (!showModal) return null;

    const getIcon = () => {
      switch (modalContent.type) {
        case 'success':
          return '✅';
        case 'error':
          return '❌';
        case 'warning':
          return '⚠️';
        default:
          return 'ℹ️';
      }
    };

    const getButtonClass = () => {
      switch (modalContent.type) {
        case 'success':
          return 'modal-btn-success';
        case 'error':
          return 'modal-btn-error';
        case 'warning':
          return 'modal-btn-warning';
        default:
          return 'modal-btn-info';
      }
    };

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-icon">{getIcon()}</span>
            <h2>{modalContent.title}</h2>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>
          <div className="modal-body">
            <p>{modalContent.message}</p>
          </div>
          <div className="modal-footer">
            <button 
              className={`modal-btn ${getButtonClass()}`} 
              onClick={closeModal}
              autoFocus
            >
              {modalContent.type === 'success' ? 'Continue' : 'Okay'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="booking-container">
      <Modal />
      
      <div className="booking-header">
        <h1>Book {hallData?.name || 'College Hall'}</h1>
        <p>Fill out the form below to request a hall booking</p>
        {user && (
          <div className="user-info-banner">
            Booking as: <strong>{user.username || user.name}</strong>
          </div>
        )}
        {!user && (
          <div className="login-warning">
            Please <a href="/login" className="login-link">log in</a> to book a hall.
          </div>
        )}
      </div>

      <div className="booking-content">
        {/* Hall Details Sidebar */}
        <div className="hall-sidebar">
          <div className="hall-card">
            <h3>Hall Details</h3>
            <div className="hall-info">
              <div className="info-item">
                <strong>Name:</strong>
                <span>{hallData?.name || 'Main Auditorium'}</span>
              </div>
              <div className="info-item">
                <strong>Capacity:</strong>
                <span>{hallData?.capacity || '400 people'}</span>
              </div>
              <div className="info-item">
                <strong>Booking Types:</strong>
                <span>Confirmed & Tentative Dates</span>
              </div>
            </div>
            
            <div className="booking-info-panel">
              <h4>Booking Information</h4>
              <div className="info-tip">
                <strong> Confirmed Booking</strong>
                <p>Confirm your event for specific dates and time.</p>
              </div>
              <div className="info-tip">
                <strong>Tentative Booking</strong>
                <p>Hold single or multiple dates temporarily. You must confirm your final date at least 3 days before the event.</p>
              </div>
            </div>
            
            <div className="amenities">
              <h4>Standard Amenities</h4>
              <ul>
                <li>HD Projector & Screen</li>
                <li>Sound System</li>
                <li>Wireless Microphones</li>
                <li>Wi-Fi Access</li>
                <li>Air Conditioning</li>
                <li>Stage Lighting</li>
              </ul>
            </div>
            
            <button
        className="view-photos-btn"
        onClick={() => navigate("/hall-gallery")}
      >
        View Photos & Layout
      </button>
          </div>
        </div>

        {/* Booking Form */}
        <form className="booking-form" onSubmit={handleSubmit}>
          {/* Section 1: Primary Booking Details */}
          <section className="form-section">
            <h2>Event Information</h2>
            
            {/* Booking Type Selection */}
            <div className="booking-type-selector">
              <label className="section-label">Booking Type *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="bookingType"
                    value="single"
                    checked={formData.bookingType === 'single'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-custom"></span>
                  {/* Single Date Booking */}
                  Confirmed Booking
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="bookingType"
                    value="multiple"
                    checked={formData.bookingType === 'multiple'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-custom"></span>
                  {/* Multiple Dates (Tentative - Confirm Later) */}
                  Tentative Booking 
                </label>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Type *</label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Event Type</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Preferred Hall *</label>
                <select
                  name="preferredHall"
                  value={formData.preferredHall}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Hall</option>
                  {halls.map(hall => (
                    <option key={hall} value={hall}>{hall}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Backup Hall Preference</label>
                <select
                  name="backupHall"
                  value={formData.backupHall}
                  onChange={handleInputChange}
                >
                  <option value="">Select Backup Hall</option>
                  {halls.map(hall => (
                    <option key={hall} value={hall}>{hall}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Single Date Booking Fields */}
            {formData.bookingType === 'single' && (
              <div className="date-section">
                <h4>Event Date & Time</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Multiple Dates Booking Fields */}
            {formData.bookingType === 'multiple' && (
              <div className="multiple-dates-section">
                <h4>Tentative Dates</h4>
                <p className="section-description">
                  Add  dates you're considering. You'll need to confirm your final choice at least 3 days before the event.
                </p>
                
                <div className="add-date-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Date *</label>
                      <input
                        type="date"
                        name="date"
                        value={currentTentativeDate.date}
                        onChange={handleTentativeDateChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Start Time *</label>
                      <input
                        type="time"
                        name="startTime"
                        value={currentTentativeDate.startTime}
                        onChange={handleTentativeDateChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Time *</label>
                      <input
                        type="time"
                        name="endTime"
                        value={currentTentativeDate.endTime}
                        onChange={handleTentativeDateChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>&nbsp;</label>
                      <button 
                        type="button" 
                        className="add-date-btn"
                        onClick={addTentativeDate}
                      >
                        Add Date
                      </button>
                    </div>
                  </div>
                </div>

                {/* List of Added Tentative Dates */}
                {formData.tentativeDates.length > 0 && (
                  <div className="tentative-dates-list">
                    <h5>Selected Tentative Dates:</h5>
                    {formData.tentativeDates.map((date) => (
                      <div key={date.id} className="tentative-date-item">
                        <span className="date-text">
                          {formatDate(date.date)} | {date.startTime} - {date.endTime}
                        </span>
                        <button
                          type="button"
                          className="remove-date-btn"
                          onClick={() => removeTentativeDate(date.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="needsSetupTime"
                  checked={formData.needsSetupTime}
                  onChange={handleInputChange}
                />
                I require additional time before/after for setup and cleanup
              </label>
            </div>
          </section>

          {/* Requester Information Section */}
          <section className="form-section">
            <h2>Requester Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Department/Club *</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </section>

          {/* Event Details Section */}
          <section className="form-section">
            <h2>Event Details</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Expected Number of Attendees *</label>
                <input
                  type="number"
                  name="attendees"
                  value={formData.attendees}
                  onChange={handleInputChange}
                  min="1"
                  required/>
                
                 {hallCapacityRules[formData.preferredHall] && (
    <small className="capacity-hint">
      Allowed range: {hallCapacityRules[formData.preferredHall].min} – {hallCapacityRules[formData.preferredHall].max}
    </small> )}
 
              </div>
            </div>
          </section>

          {/* Technical Requirements Section */}
          <section className="form-section">
            <h2>Technical & Facility Requirements</h2>
            
            <div className="checkbox-grid">
              <div className="checkbox-group">
                <h4>Audio/Visual Equipment</h4>
                {avEquipmentOptions.map(equipment => (
                  <label key={equipment} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.avEquipment.includes(equipment)}
                      onChange={(e) => handleArrayChange('avEquipment', equipment, e.target.checked)}
                    />
                    {equipment}
                  </label>
                ))}
              </div>

              <div className="checkbox-group">
                <h4>Furniture & Additional Needs</h4>
                {furnitureOptions.map(item => (
                  <label key={item} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.furniture.includes(item)}
                      onChange={(e) => handleArrayChange('furniture', item, e.target.checked)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="needsInternet"
                  checked={formData.needsInternet}
                  onChange={handleInputChange}
                />
                Internet Access Required (including guest Wi-Fi if needed)
              </label>
            </div>
          </section>

          {/* Additional Services Section */}
          <section className="form-section">
            <h2>Additional Services</h2>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="needsSecurity"
                  checked={formData.needsSecurity}
                  onChange={handleInputChange}
                />
                This event requires security/first-aid personnel
              </label>
            </div>

            <div className="form-group">
              <label>Additional Notes/Special Requests</label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                rows="4"
                placeholder="Any other requirements or special requests..."
              />
              For additional services contact<br></br>
              Technician : +123-456-7890 

            </div>
          </section>

          {/* Terms and Submit */}
          <section className="form-section">
            <div className="terms-group">
              <label className="checkbox-label">
                <input type="checkbox" required />
                I agree to the <a href="/terms" className="terms-link">Terms & Conditions</a> *
              </label>
              <p className="terms-note">
                {formData.bookingType === 'multiple' 
                  ? 'For tentative bookings: You must confirm your final date at least 7 days before the event. Unconfirmed dates will be automatically released. By submitting, you agree to these terms.'
                  : 'By submitting this form, I acknowledge that this booking is not confirmed until I receive a confirmation email, and I agree to be responsible for any damages and to leave the hall in its original condition.'
                }
              </p>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={!user}
            >
              {!user ? 'Please Login to Book' : 
                formData.bookingType === 'multiple' 
                  ? 'Submit Tentative Booking Request' 
                  : 'Submit Booking Request'
              }
            </button>
          </section>
        </form>
      </div>
    </div>
  );
};

export default HallBookingForm;