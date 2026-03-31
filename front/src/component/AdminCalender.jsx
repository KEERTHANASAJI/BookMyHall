import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminPage.css';
import './Calender.css';
import Sidebar from './Sidebar';
import NotificationPanel from "./NotificationPanel";
import axios from "axios";

const AdminCalendar = () => {
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [bookingStats, setBookingStats] = useState({
        total: 0, approved: 0, pending: 0, cancelled: 0, completed: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Calendar states
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showAvailability, setShowAvailability] = useState(false);
    const [hallAvailability, setHallAvailability] = useState([]);
    const [selectedHall, setSelectedHall] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Theme (persisted)
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

    useEffect(() => {
        fetchNotifications();
        fetchBookingStats();
        fetchBookings();
    }, []);

    const handleNotificationClick = () => {
        setNotifOpen(true);
    };

    const fetchNotifications = async () => {
        try {
            const response = await axios.get("http://localhost:3000/admin/notifications");
            setNotifications(response.data || []);
            return response.data || [];
        } catch (err) {
            console.error("Notification fetch failed:", err);
            return [];
        }
    };

    const fetchBookingStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/dashboard/stats');

            if (!response.ok) {
                throw new Error('Failed to fetch booking stats');
            }

            const result = await response.json();

            if (result.success) {
                const stats = result.data;

                setBookingStats({
                    total: stats.totalBookings,
                    approved: stats.approvedBookings,
                    pending: stats.pendingBookings,
                    cancelled: stats.cancelledBookings,
                    completed: stats.completedBookings
                });
            } else {
                throw new Error(result.message || 'Failed to fetch stats');
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            setCalendarLoading(true);
            const response = await fetch('http://localhost:3000/bookings');

            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }

            const result = await response.json();

            if (result.success) {
                setBookings(result.data);
            } else {
                throw new Error(result.message || 'Failed to fetch bookings');
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setCalendarLoading(false);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.patch("http://localhost:3000/admin/notifications/mark-read");
        } catch (error) {
            console.error("Error marking notifications read:", error);
        }
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    // Calendar functions
    const mockHalls = [
        {
            id: 1, name: "Auditorium", capacity: 1000,
            image: "https://vimalacollege.edu.in/ssr2021/images/seminar/auditorium/aud1.jpg",
        },
        {
            id: 2, name: "Euphresia Conference Hall", capacity: 20,
            image: "https://vimalacollege.edu.in/ssr2021/images/seminar/ech/001.jpg",
        },
        {
            id: 3, name: "Silver Jubilee Seminar Hall", capacity: 130,
            image: "https://vimalacollege.edu.in/ssr2021/images/seminar/sjsh/stage.jpg",
        },
        {
            id: 4, name: "Lissieux Seminar Hall", capacity: 150,
            image: "https://vimalacollege.edu.in/ssr2021/images/seminar/lsh/stage.jpg",
        },
        {
            id: 5, name: "Marian Hall", capacity: 350,
            image: "https://vimalacollege.edu.in/ssr2021/images/seminar/gjmh/stage.jpg",
        },
        {
            id: 6, name: "Christ Conference Hall", capacity: 30,
            image: "https://vimalacollege.edu.in/ssr2021/images/seminar/cch/001.jpg",
        }
    ];

    // Get all bookings for a specific date and hall (including tentative)
    const getBookingsForDateAndHall = (date, hallName) => {
        if (!bookings || bookings.length === 0) return [];

        const targetDate = date.toDateString();

        return bookings.filter(booking => {
            // For single booking type
            if (booking.bookingType === 'single' && booking.startDate) {
                const bookingDate = new Date(booking.startDate).toDateString();
                const matchesHall = booking.preferredHall === hallName;
                const matchesDate = bookingDate === targetDate;

                return matchesHall && matchesDate &&
                    (booking.status === 'approved' || booking.status === 'pending' || booking.status === 'tentative');
            }

            // For multiple/tentative booking type
            if (booking.bookingType === 'multiple' && booking.tentativeDates) {
                // Check if any tentative date matches the target date
                const hasMatchingTentativeDate = booking.tentativeDates.some(tentativeDate => {
                    const tentativeDateStr = new Date(tentativeDate.date).toDateString();
                    return tentativeDateStr === targetDate;
                });

                const matchesHall = booking.preferredHall === hallName;

                // Include tentative, pending, and approved bookings
                return matchesHall && hasMatchingTentativeDate &&
                    (booking.status === 'approved' || booking.status === 'pending' || booking.status === 'tentative');
            }

            return false;
        });
    };

    // Check if a hall has any bookings for the selected date
    const getHallBookingStatus = (hall, date) => {
        const hallBookings = getBookingsForDateAndHall(date, hall.name);
        const confirmedBookings = hallBookings.filter(b => b.status === 'approved');
        const tentativeBookings = hallBookings.filter(b => b.status === 'tentative' || (b.status === 'pending' && b.bookingType === 'multiple'));
        const pendingBookings = hallBookings.filter(b => b.status === 'pending' && b.bookingType === 'single');

        const hasConfirmedBookings = confirmedBookings.length > 0;
        const hasTentativeBookings = tentativeBookings.length > 0;
        const hasPendingBookings = pendingBookings.length > 0;

        return {
            hasBookings: hasConfirmedBookings || hasTentativeBookings || hasPendingBookings,
            hasConfirmedBookings,
            hasTentativeBookings,
            hasPendingBookings,
            confirmedBookings,
            tentativeBookings,
            pendingBookings,
            bookingCount: hallBookings.length,
            status: hasConfirmedBookings ? 'booked' : hasTentativeBookings ? 'tentative' : hasPendingBookings ? 'pending' : 'available'
        };
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const firstDayOfMonth = () => {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(clickedDate);

        // Update all halls with their booking status for the selected date
        const updatedHalls = mockHalls.map(hall => {
            const bookingStatus = getHallBookingStatus(hall, clickedDate);
            return {
                ...hall,
                ...bookingStatus
            };
        });

        setHallAvailability(updatedHalls);
        setShowAvailability(true);
        setSelectedHall(null);
    };

    // Render calendar days with booking indicators
    const renderDays = () => {
        const totalDays = daysInMonth(currentDate.getMonth(), currentDate.getFullYear());
        const startingDay = firstDayOfMonth();
        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentDate.getMonth() &&
                selectedDate.getFullYear() === currentDate.getFullYear();

            const isToday = new Date().getDate() === day &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();

            // Count bookings for this date
            let confirmedCount = 0;
            let tentativeCount = 0;
            let pendingCount = 0;

            mockHalls.forEach(hall => {
                const bookingsForHall = getBookingsForDateAndHall(date, hall.name);
                bookingsForHall.forEach(booking => {
                    if (booking.status === 'approved') {
                        confirmedCount++;
                    } else if (booking.status === 'tentative' || (booking.status === 'pending' && booking.bookingType === 'multiple')) {
                        tentativeCount++;
                    } else if (booking.status === 'pending') {
                        pendingCount++;
                    }
                });
            });

            days.push(
                <div
                    key={`day-${day}`}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleDateClick(day)}
                >
                    {day}
                    {isToday && <div className="today-indicator"></div>}

                    {/* Booking indicators */}
                    {(confirmedCount > 0 || tentativeCount > 0 || pendingCount > 0) && (
                        <div className="booking-indicators">
                            {confirmedCount > 0 && (
                                <div
                                    className="booking-dot confirmed-dot"
                                    title={`${confirmedCount} confirmed booking(s)`}
                                />
                            )}
                            {tentativeCount > 0 && (
                                <div
                                    className="booking-dot tentative-dot"
                                    title={`${tentativeCount} tentative booking(s)`}
                                />
                            )}
                            {pendingCount > 0 && (
                                <div
                                    className="booking-dot pending-dot"
                                    title={`${pendingCount} pending booking(s)`}
                                />
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleHallSelect = (hall) => {
        setSelectedHall(hall);
    };

    const handleBackToHalls = () => {
        setSelectedHall(null);
    };

    if (loading) {
        return (
            <div className="admin-root">
                <div className="loader-box">
                    <div className="spinner" />
                    <p>Loading booking statistics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-root">
                <div className="error-card">
                    <div className="error-emoji">⚠️</div>
                    <h2>Error Loading Statistics</h2>
                    <p>{error}</p>
                    <button className="btn primary" onClick={fetchBookingStats}>Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-root">
            {/* Sidebar */}
            <Sidebar
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            {/* Main content */}
            <main className={`main-panel ${isOpen ? 'shifted' : ''}`}>
                <header className="main-header">
                    <div className="page-heading">
                        {/* Menu button */}
                        <button className="menu-button" onClick={toggleSidebar}>☰</button>
                        <div className="header-titles">
                            <h1>Auditorium Booking System</h1>
                            <p className="sub">Vimala College (Autonomous)</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="refresh" onClick={fetchBookingStats}>🔄</button>
                        <div className="last-updated">
                            Last updated: {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </header>

                {/* Cards grid */}
                <section className="cards-grid">
                    <div className="card big" onClick={() => navigate('/tot')}>
                        <div className="card-right">
                            <div className="card-title">Total Bookings</div>
                            <div className="card-value">{bookingStats.total}</div>
                        </div>
                    </div>

                    <div className="card" onClick={() => navigate('/app')}>
                        <div className="card-right">
                            <div className="card-title">Approved</div>
                            <div className="card-value">{bookingStats.approved}</div>
                        </div>
                    </div>

                    <div className="card" onClick={() => navigate('/pend')}>
                        <div className="card-right">
                            <div className="card-title">Pending</div>
                            <div className="card-value">{bookingStats.pending}</div>
                        </div>
                    </div>

                    <div className="card" onClick={() => navigate('/can')}>
                        <div className="card-right">
                            <div className="card-title">Cancelled</div>
                            <div className="card-value">{bookingStats.cancelled}</div>
                        </div>
                    </div>

                    <div className="card" onClick={() => navigate('/comp')}>
                        <div className="card-right">
                            <div className="card-title">Completed</div>
                            <div className="card-value">{bookingStats.completed}</div>
                        </div>
                    </div>
                </section>

                {/* Calendar Section */}
                <section className="calendar-section">
                    <div className="calendar-wrapper">
                        <div className="calendar">
                            <div className="calendar-header">
                                <button className="nav-button" onClick={prevMonth}>
                                    <span className="arrow">&lt;</span>
                                </button>
                                <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                                <button className="nav-button" onClick={nextMonth}>
                                    <span className="arrow">&gt;</span>
                                </button>
                            </div>
                            <div className="calendar-weekdays">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="weekday">{day}</div>
                                ))}
                            </div>
                            <div className="calendar-days">
                                {renderDays()}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {showAvailability && (
                <div className="availability-overlay">
                    <div className="availability-modal">
                        <div className="modal-content">
                            {!selectedHall ? (
                                <>
                                    <div className="modal-header">
                                        <button
                                            className="back-button"
                                            onClick={() => setShowAvailability(false)}
                                        >
                                            &larr; Back
                                        </button>
                                        <h3>Hall Availability for {formatDate(selectedDate)}</h3>
                                        <button
                                            className="close-button"
                                            onClick={() => setShowAvailability(false)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                    <div className="hall-list">
                                        {hallAvailability.map(hall => (
                                            <div
                                                key={hall.id}
                                                className={`hall-card ${hall.status === 'booked' ? 'has-bookings' : hall.status === 'tentative' ? 'has-tentative' : hall.status === 'pending' ? 'has-pending' : 'available'}`}
                                                onClick={() => handleHallSelect(hall)}
                                            >
                                                <div className="hall-image" style={{ backgroundImage: `url(${hall.image})` }}></div>
                                                <div className="hall-details">
                                                    <h4>{hall.name}</h4>
                                                    <p>Capacity: {hall.capacity} people</p>
                                                    <div className="availability-status">
                                                        {hall.status === 'booked' ? (
                                                            <span className="booked">
                                                                {hall.confirmedBookings.length} confirmed booking{hall.confirmedBookings.length !== 1 ? 's' : ''}
                                                            </span>
                                                        ) : hall.status === 'tentative' ? (
                                                            <span className="tentative">
                                                                {hall.tentativeBookings.length} tentative booking{hall.tentativeBookings.length !== 1 ? 's' : ''}
                                                            </span>
                                                        ) : hall.status === 'pending' ? (
                                                            <span className="pending">
                                                                {hall.pendingBookings.length} pending booking{hall.pendingBookings.length !== 1 ? 's' : ''}
                                                            </span>
                                                        ) : (
                                                            <span className="available">Available</span>
                                                        )}
                                                    </div>

                                                    {/* Show tentative bookings preview */}
                                                    {hall.tentativeBookings.length > 0 && (
                                                        <div className="tentative-preview">
                                                            <small>
                                                                <strong>Tentative Bookings:</strong>
                                                                {hall.tentativeBookings.slice(0, 2).map(booking => (
                                                                    <div key={booking._id} className="tentative-preview-item">
                                                                        • {booking.eventName} (Tentative)
                                                                    </div>
                                                                ))}
                                                                {hall.tentativeBookings.length > 2 && (
                                                                    <div className="booking-preview-more">
                                                                        +{hall.tentativeBookings.length - 2} more...
                                                                    </div>
                                                                )}
                                                            </small>
                                                        </div>
                                                    )}

                                                    {/* Show pending bookings preview */}
                                                    {hall.pendingBookings.length > 0 && (
                                                        <div className="pending-preview">
                                                            <small>
                                                                <strong>Pending Bookings:</strong>
                                                                {hall.pendingBookings.slice(0, 2).map(booking => (
                                                                    <div key={booking._id} className="pending-preview-item">
                                                                        • {booking.eventName} (Pending)
                                                                    </div>
                                                                ))}
                                                                {hall.pendingBookings.length > 2 && (
                                                                    <div className="booking-preview-more">
                                                                        +{hall.pendingBookings.length - 2} more...
                                                                    </div>
                                                                )}
                                                            </small>
                                                        </div>
                                                    )}

                                                    {/* Show confirmed bookings preview */}
                                                    {hall.confirmedBookings.length > 0 && (
                                                        <div className="booking-preview">
                                                            <small>
                                                                <strong>Confirmed Bookings:</strong>
                                                                {hall.confirmedBookings.slice(0, 2).map(booking => (
                                                                    <div key={booking._id} className="booking-preview-item">
                                                                        • {booking.eventName}
                                                                    </div>
                                                                ))}
                                                                {hall.confirmedBookings.length > 2 && (
                                                                    <div className="booking-preview-more">
                                                                        +{hall.confirmedBookings.length - 2} more...
                                                                    </div>
                                                                )}
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="view-slots">
                                                    View details &rarr;
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="modal-header">
                                        <button
                                            className="back-button"
                                            onClick={handleBackToHalls}
                                        >
                                            &larr; Back
                                        </button>
                                        <h3>{selectedHall.name} - {formatDate(selectedDate)}</h3>
                                        <button
                                            className="close-button"
                                            onClick={() => setShowAvailability(false)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                    <div className="time-slots-container">
                                        <div className="hall-image-large" style={{ backgroundImage: `url(${selectedHall.image})` }}></div>
                                        <div className="time-slots-list">

                                            {/* Confirmed Bookings Section */}
                                            {selectedHall.confirmedBookings.length > 0 && (
                                                <>
                                                    <h4 className="section-title confirmed-title">✅ Confirmed Bookings</h4>
                                                    <div className="bookings-list">
                                                        {selectedHall.confirmedBookings.map(booking => (
                                                            <div key={booking._id} className="booking-detail-card confirmed">
                                                                <div className="booking-main-title">
                                                                    <strong>{booking.eventName}</strong>
                                                                    <span className="status-badge confirmed-badge">Confirmed</span>
                                                                </div>
                                                                {booking.startTime && booking.endTime && (
                                                                    <div className="booking-time">
                                                                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                                                    </div>
                                                                )}
                                                                <div className="booking-organizer">
                                                                    <strong>Organizer:</strong> {booking.fullName}
                                                                </div>
                                                                <div className="booking-meta">
                                                                    <span><strong>Email:</strong> {booking.email}</span>
                                                                </div>
                                                                <div className="event-type">
                                                                    <strong>Event Type:</strong> {booking.eventType}
                                                                </div>
                                                                {booking.description && (
                                                                    <div className="event-description">
                                                                        <strong>Description:</strong> {booking.description}
                                                                    </div>
                                                                )}
                                                                <div className="booking-actions">
                                                                    <button className="admin-action-btn view-details" onClick={() => navigate(`/booking-details/${booking._id}`)}>
                                                                        View Details
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {/* Pending Bookings Section */}
                                            {selectedHall.pendingBookings.length > 0 && (
                                                <>
                                                    <h4 className="section-title pending-title">⏳ Pending Bookings (Awaiting Approval)</h4>
                                                    <div className="pending-bookings-list">
                                                        {selectedHall.pendingBookings.map(booking => (
                                                            <div key={booking._id} className="booking-detail-card pending">
                                                                <div className="booking-main-title">
                                                                    <strong>{booking.eventName}</strong>
                                                                    <span className="status-badge pending-badge">Pending</span>
                                                                </div>
                                                                {booking.startTime && booking.endTime && (
                                                                    <div className="booking-time">
                                                                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                                                    </div>
                                                                )}
                                                                <div className="booking-organizer">
                                                                    <strong>Organizer:</strong> {booking.fullName}
                                                                </div>
                                                                <div className="booking-meta">
                                                                    <span><strong>Email:</strong> {booking.email}</span>
                                                                </div>
                                                                <div className="event-type">
                                                                    <strong>Event Type:</strong> {booking.eventType}
                                                                </div>
                                                                <div className="booking-actions">
                                                                    <button className="admin-action-btn approve" onClick={() => navigate(`/booking-approval/${booking._id}`)}>
                                                                        Review & Approve
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {/* Tentative Bookings Section */}
                                            {selectedHall.tentativeBookings.length > 0 && (
                                                <>
                                                    <h4 className="section-title tentative-title">⏳ Tentative Bookings</h4>
                                                    <div className="tentative-bookings-list">
                                                        {selectedHall.tentativeBookings.map(booking => {
                                                            // Find the specific tentative date for this booking
                                                            const tentativeDate = booking.tentativeDates?.find(td =>
                                                                new Date(td.date).toDateString() === selectedDate.toDateString()
                                                            );

                                                            return (
                                                                <div key={booking._id} className="booking-detail-card tentative">
                                                                    <div className="booking-main-title">
                                                                        <strong>{booking.eventName}</strong>
                                                                        <span className="status-badge tentative-badge">Tentative</span>
                                                                    </div>
                                                                    {tentativeDate && (
                                                                        <div className="booking-time">
                                                                            {formatTime(tentativeDate.startTime)} - {formatTime(tentativeDate.endTime)}
                                                                        </div>
                                                                    )}
                                                                    <div className="booking-organizer">
                                                                        <strong>Organizer:</strong> {booking.fullName}
                                                                    </div>
                                                                    <div className="booking-meta">
                                                                        <span><strong>Email:</strong> {booking.email}</span>
                                                                
                                                                    </div>
                                                                    <div className="event-type">
                                                                        <strong>Event Type:</strong> {booking.eventType}
                                                                    </div>
                                                                   
                                                                    <div className="booking-actions">
                                                                        <button className="admin-action-btn view-details" onClick={() => navigate(`/booking-details/${booking._id}`)}>
                                                                            View Details
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}

                                            {/* No Bookings Message */}
                                            {selectedHall.confirmedBookings.length === 0 && selectedHall.tentativeBookings.length === 0 && selectedHall.pendingBookings.length === 0 && (
                                                <div className="no-bookings">
                                                    <p>No bookings for this hall on {formatDate(selectedDate)}</p>
                                                    <p className="available-message">This hall is available for booking!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <NotificationPanel
                open={notifOpen}
                onClose={async (markRead = false) => {
                    setNotifOpen(false);

                    if (markRead) {
                        await markAllRead();
                        setNotifications([]);
                    }
                }}
                notifications={notifications}
            />
        </div>
    );
};

export default AdminCalendar;