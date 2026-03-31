import React, { useEffect, useState } from 'react';
import { useParams, useNavigate  } from 'react-router-dom';
import { halls } from '../data/halls';
import './HallDetails.css';

const HallDetails = () => {
  const { id } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const navigate = useNavigate();
  const hall = halls[parseInt(id)];

  if (!hall) {
    return (
      <div className="hall-details-page" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Hall not found</h2>
        <p>The hall you're looking for doesn't exist.</p>
      </div>
    );
  }
const images =
  hall.images && hall.images.length > 0
    ? hall.images
    : [`https://via.placeholder.com/800x400?text=${encodeURIComponent(hall.name)}`];

const [currentIndex, setCurrentIndex] = useState(0);

const nextImage = () => {
  setCurrentIndex((prev) => (prev + 1) % images.length);
};

const prevImage = () => {
  setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
};

  return (
    <div className="hall-details-page">
  <div className="back-button-container">
    <button className="back-button" onClick={() => navigate(-1)}>
      ← Back
    </button>
  </div>

  <div className="hall-header">
        <h1>{hall.name}</h1>
        <p className="hall-location">Location: {hall.location || 'Not specified'}</p>
      </div>
      
      <div className="hall-image-container">
  <img
    src={images[currentIndex]}
    alt={`${hall.name} ${currentIndex + 1}`}
    className="hall-detail-img"
    onError={(e) => {
      e.target.src = `https://via.placeholder.com/800x400?text=${encodeURIComponent(hall.name)}`;
    }}
  />

  {images.length > 1 && (
    <>
      <button className="carousel-btn prev" onClick={prevImage}>❮</button>
      <button className="carousel-btn next" onClick={nextImage}>❯</button>
    </>
  )}
</div>


      <div className="hall-info">
        <div className="info-section">
          <h2>Overview</h2>
          <p className="hall-description">{hall.description}</p>
        </div>

        <div className="info-section">
          <h2>Key Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Capacity:</strong>
              <span>{hall.capacity} people</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h2>Amenities</h2>
          <div className="amenities-list">
            {hall.amenities && hall.amenities.length > 0 ? (
              hall.amenities.map((amenity, index) => (
                <span key={index} className="amenity-badge">
                  {amenity}
                </span>
              ))
            ) : (
              <p>No amenities specified</p>
            )}
          </div>
        </div>

        {hall.details && (
          <div className="info-section">
            <h2> Facility Details</h2>
            <div className="auditorium-details">
              {hall.details.stageSize && (
                <div className="detail-item">
                  <strong>Stage Size:</strong>
                  <span>{hall.details.stageSize}</span>
                </div>
              )}
              {hall.details.lighting && (
                <div className="detail-item">
                  <strong>Lighting System:</strong>
                  <span>{hall.details.lighting}</span>
                </div>
              )}
              {hall.details.soundSystem && (
                <div className="detail-item">
                  <strong>Sound System:</strong>
                  <span>{hall.details.soundSystem}</span>
                </div>
              )}
              {hall.details.seating && (
                <div className="detail-item">
                  <strong>Seating Arrangement:</strong>
                  <span>{hall.details.seating}</span>
                </div>
              )}
              {hall.details.features && (
                <div className="detail-item">
                  <strong>Additional Features:</strong>
                  <span>{hall.details.features}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HallDetails;