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
  <Fade in={true} timeout={600}>
    <div className="bd-page">

      {/* HEADER */}
      <div className="top-banner">

        <div className="banner-left">
          <Button
            className="bd-back"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>

          <div>
            <Typography variant="h4" className="main-heading">
              {booking.eventName || "Untitled Event"}
            </Typography>

            <div className="header-chips">

              <Chip
                icon={getStatusIcon(booking.status)}
                label={booking.status || "pending"}
                color={getStatusColor(booking.status)}
              />

              <Chip
                label={`Ref : ${booking.bookingReference || "---"}`}
                variant="outlined"
              />

            </div>
          </div>
        </div>

        <div className="banner-right">
          <Typography>
            Submitted : {formatDateTime(booking.createdAt)}
          </Typography>
        </div>

      </div>

      {/* MAIN LAYOUT */}
      <div className="details-layout">

        {/* LEFT PANEL */}
        <div className="left-panel">

          {/* EVENT INFO */}
          <Card className="info-card">
            <CardContent>

              <Typography className="card-title">
                Event Information
              </Typography>

              <div className="info-grid">

                <div>
                  <span>Event Type</span>
                  <p>{booking.eventType || "---"}</p>
                </div>

                <div>
                  <span>Booking Type</span>
                  <p>{booking.bookingType || "---"}</p>
                </div>

                <div>
                  <span>Preferred Hall</span>
                  <p>{booking.preferredHall || "---"}</p>
                </div>

                <div>
                  <span>Backup Hall</span>
                  <p>{booking.backupHall || "None"}</p>
                </div>

              </div>

            </CardContent>
          </Card>

          {/* SCHEDULE */}
          <Card className="info-card">
            <CardContent>

              <Typography className="card-title">
                Schedule
              </Typography>

              {booking.bookingType === "single" && (

                <div className="schedule-box">

                  <div>
                    <span>Start Date</span>
                    <p>{formatDate(booking.startDate)}</p>
                  </div>

                  <div>
                    <span>End Date</span>
                    <p>{formatDate(booking.endDate)}</p>
                  </div>

                  <div>
                    <span>Start Time</span>
                    <p>{booking.startTime || "---"}</p>
                  </div>

                  <div>
                    <span>End Time</span>
                    <p>{booking.endTime || "---"}</p>
                  </div>

                </div>
              )}

              {booking.bookingType === "multiple" && (

                <div className="tentative-wrapper">

                  {booking.tentativeDates?.map((td, i) => (

                    <div className="tentative-card" key={i}>
                      <h4>{formatDate(td.date)}</h4>

                      <p>
                        {td.startTime || "---"} - {td.endTime || "---"}
                      </p>
                    </div>

                  ))}

                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">

          {/* REQUESTER */}
          <Card className="info-card">
            <CardContent>

              <Typography className="card-title">
                Requester Details
              </Typography>

              <div className="vertical-details">

                <div>
                  <span>Name</span>
                  <p>{booking.fullName || "---"}</p>
                </div>

                <div>
                  <span>Department</span>
                  <p>{booking.department || "---"}</p>
                </div>

                <div>
                  <span>Email</span>
                  <p>{booking.email || "---"}</p>
                </div>

                <div>
                  <span>Phone</span>
                  <p>{booking.phone || "---"}</p>
                </div>

              </div>

            </CardContent>
          </Card>

          {/* REQUIREMENTS */}
          <Card className="info-card">
            <CardContent>

              <Typography className="card-title">
                Requirements
              </Typography>

              <div className="requirements-box">

                <div>
                  <span>AV Equipment</span>

                  <div className="chip-wrap">
                    {showArray(booking.avEquipment)}
                  </div>
                </div>

                <div>
                  <span>Furniture</span>

                  <div className="chip-wrap">
                    {showArray(booking.furniture)}
                  </div>
                </div>

                <div>
                  <span>Internet</span>
                  <p>{booking.needsInternet ? "Yes" : "No"}</p>
                </div>

                <div>
                  <span>Security</span>
                  <p>{booking.needsSecurity ? "Yes" : "No"}</p>
                </div>

              </div>

            </CardContent>
          </Card>

          {/* NOTES */}
          <Card className="info-card notes-card">
            <CardContent>

              <Typography className="card-title">
                Notes
              </Typography>

              <div className="notes-box">
                <h4>Description</h4>

                <p>
                  {booking.description || "No description provided"}
                </p>
              </div>

              <div className="notes-box">
                <h4>Additional Notes</h4>

                <p>
                  {booking.additionalNotes || "None"}
                </p>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  </Fade>
);
};

export default BookingDetails;