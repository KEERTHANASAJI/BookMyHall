import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,CardContent,Typography,Chip,Button,Box,Grid,Paper,Divider,Fade,Slide,Zoom,Skeleton
} from "@mui/material";
import {ArrowBack,CheckCircle,Cancel,Event,Person,Settings,Info
} from "@mui/icons-material";
import "./BookingDetails.css";

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:3000";

  useEffect(() => {
    fetchBooking();
    // eslint-disable-next-line
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      // Simulate API delay for demo
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const res = await fetch(`${apiBase}/bookings/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load booking");
      setBooking(json.data || json);
    } catch (err) {
      setError(err.message || "Error fetching booking");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      case 'cancelled': return 'default';
      default: return 'primary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'pending': return <Event />;
      default: return <Info />;
    }
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return d;
    }
  };

  const formatDateTime = (d) => {
    if (!d) return "N/A";
    try {
      const dt = new Date(d);
      return dt.toLocaleString();
    } catch {
      return d;
    }
  };

  const showArray = (arr) => {
    if (!arr || arr.length === 0) return <Typography variant="body2" color="textSecondary" fontStyle="italic">None</Typography>;
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {arr.map((it, i) => (
          <Chip
            key={i}
            label={it}
            size="small"
            variant="outlined"
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2
              }
            }}
          />
        ))}
      </Box>
    );
  };

  if (loading) return (
    <Box className="bd-page">
      <Skeleton variant="text" width="60%" height={40} />
      <Skeleton variant="text" width="40%" height={30} />
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="text" />
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="text" />
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (error) return (
    <Box className="bd-page">
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'error.light' }}>
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={fetchBooking}
        >
          Retry
        </Button>
      </Paper>
    </Box>
  );

  if (!booking) return (
    <Box className="bd-page">
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">
          No booking found
        </Typography>
      </Paper>
    </Box>
  );

  return (
    <Fade in={true} timeout={800}>
      <div className="bd-page">
        {/* Header */}
        <Slide in={true} direction="down" timeout={500}>
          <Box className="bd-header">
            <Button
              className="bd-back ripple"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              Back
            </Button>
            
            <Box className="bd-title" sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {booking.eventName || "Untitled Event"}
              </Typography>
              
              <Box className="bd-meta" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={getStatusIcon(booking.status)}
                  label={booking.status || "pending"}
                  color={getStatusColor(booking.status)}
                  variant="filled"
                  className={`bd-badge bd-status bd-${booking.status || "pending"}`}
                />
                
                <Chip
                  label={`Ref: ${booking.bookingReference || "—"}`}
                  variant="outlined"
                  size="small"
                  className="bd-ref"
                />
                
                <Typography variant="body2" color="textSecondary" className="bd-submitted">
                  Submitted: {formatDateTime(booking.submittedAt || booking.createdAt)}
                </Typography>
              </Box>
            </Box>

            
          </Box>
        </Slide>

        {/* Main Content Grid */}
        <Grid container spacing={3} className="bd-grid">
          {/* Left Column - Event & Booking */}
          <Grid item xs={12} md={6}>
            <Slide in={true} direction="right" timeout={600}>
              <Card className="bd-card" elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event color="primary" />
                    Event & Booking
                  </Typography>

                  <Box className="bd-row">
                    <Typography variant="subtitle2" className="bd-row-label">Event Type</Typography>
                    <Typography variant="body2">{booking.eventType || "—"}</Typography>
                  </Box>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">Booking Type</Typography>
                    <Typography variant="body2">{booking.bookingType || "—"}</Typography>
                  </Box>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">Preferred Hall</Typography>
                    <Typography variant="body2">{booking.preferredHall || "—"}</Typography>
                  </Box>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">Backup Hall</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {booking.backupHall || "None"}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {booking.bookingType === "single" && (
                    <>
                      <Typography variant="subtitle1" className="section-sub">
                        Single Date
                      </Typography>
                      <Box className="bd-row">
                        <Typography variant="subtitle2">Start Date</Typography>
                        <Typography variant="body2">{formatDate(booking.startDate)}</Typography>
                      </Box>
                      <Box className="bd-row">
                        <Typography variant="subtitle2">End Date</Typography>
                        <Typography variant="body2">{formatDate(booking.endDate || booking.startDate)}</Typography>
                      </Box>
                      <Box className="bd-row">
                        <Typography variant="subtitle2">Start Time</Typography>
                        <Typography variant="body2">{booking.startTime || "—"}</Typography>
                      </Box>
                      <Box className="bd-row">
                        <Typography variant="subtitle2">End Time</Typography>
                        <Typography variant="body2">{booking.endTime || "—"}</Typography>
                      </Box>
                    </>
                  )}

                  {booking.bookingType === "multiple" && (
                    <>
                      <Typography variant="subtitle1" className="section-sub">
                        Tentative Dates
                      </Typography>
                      {booking.tentativeDates && booking.tentativeDates.length ? (
                        <Box component="ul" className="tentative-list">
                          {booking.tentativeDates.map((td, i) => (
                            <Box component="li" key={td.id ?? i}>
                              <Typography variant="body2" fontWeight="bold" className="td-date">
                                {formatDate(td.date)}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" className="td-time">
                                {td.startTime || "—"} — {td.endTime || "—"}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary" fontStyle="italic">
                          No tentative dates
                        </Typography>
                      )}
                    </>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" className="section-sub">
                    Attendees & Setup
                  </Typography>
                  <Box className="bd-row">
                    <Typography variant="subtitle2">Attendees</Typography>
                    <Typography variant="body2">{booking.attendees || "—"}</Typography>
                  </Box>
                  <Box className="bd-row">
                    <Typography variant="subtitle2">Requires Setup/Cleanup</Typography>
                    <Typography variant="body2">{booking.needsSetupTime ? "Yes" : "No"}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Slide>
          </Grid>

          {/* Right Column - Requester & Requirements */}
          <Grid item xs={12} md={6}>
            <Slide in={true} direction="left" timeout={600}>
              <Card className="bd-card" elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="primary" />
                    Requester
                  </Typography>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">Full Name</Typography>
                    <Typography variant="body2">{booking.fullName || booking.name || "—"}</Typography>
                  </Box>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">Department/Club</Typography>
                    <Typography variant="body2">{booking.department || "—"}</Typography>
                  </Box>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">Email</Typography>
                    <Typography variant="body2">{booking.email || "—"}</Typography>
                  </Box>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">Phone</Typography>
                    <Typography variant="body2">{booking.phone || "—"}</Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Settings color="primary" />
                    Requirements
                  </Typography>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">AV Equipment</Typography>
                    <Box>{showArray(booking.avEquipment)}</Box>
                  </Box>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">Furniture</Typography>
                    <Box>{showArray(booking.furniture)}</Box>
                  </Box>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">Internet</Typography>
                    <Typography variant="body2">{booking.needsInternet ? "Yes" : "No"}</Typography>
                  </Box>

                  <Box className="bd-row">
                    <Typography variant="subtitle2">Security</Typography>
                    <Typography variant="body2">{booking.needsSecurity ? "Yes" : "No"}</Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" className="section-sub">
                    Notes
                  </Typography>

                  <Box className="bd-block">
                    <Typography variant="subtitle2" gutterBottom>
                      Description
                    </Typography>
                    <Paper variant="outlined" className="bd-text" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2">
                        {booking.description || "No description provided"}
                      </Typography>
                    </Paper>

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Additional Notes
                    </Typography>
                    <Paper variant="outlined" className="bd-text" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2">
                        {booking.additionalNotes || booking.adminNotes || "None"}
                      </Typography>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            </Slide>
          </Grid>
        </Grid>

        {/* Footer */}
        <Fade in={true} timeout={1000}>
          <Paper className="bd-footer" elevation={1}>
            <Typography variant="caption">Record ID: {booking._id}</Typography>
            <Typography variant="caption">Created: {formatDateTime(booking.createdAt)}</Typography>
            <Typography variant="caption">Updated: {formatDateTime(booking.updatedAt)}</Typography>
          </Paper>
        </Fade>
      </div>
    </Fade>
  );
};

export default BookingDetails;