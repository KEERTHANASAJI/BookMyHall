import React from "react";

const HallGallery = () => {
  return (
    <div className="hall-page">
      <h1 className="page-title">College Hall Gallery</h1>

      <div className="hall-grid">
        {/* Hall 1 */}
        <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/auditorium/aud1.jpg"
            alt="Main Auditorium"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>Main Auditorium</h2>
            
          </div>
        </div>

        {/* Hall 2 */}
        <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/auditorium/aud2.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>Audio mixer and amplifier</h2>
            
          </div>
        </div>

        {/* Hall 3 */}
        <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/auditorium/aud3.jpg"
            alt="Conference Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>Audio mixer and amplifier</h2>
          
          </div>
        </div>
<div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/auditorium/aud4.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>woofer speakers</h2>
            
          </div>
        </div>



        <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/auditorium/aud5.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>seating</h2>
            
          </div>
        </div>

        <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/sjsh/stage.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>Stage</h2>
            
          </div>
        </div>

        <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/sjsh/seating.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>Seating</h2>
            
          </div>
        </div>

          <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/sjsh/audio.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>public addressing</h2>
            
          </div>
        </div>

          <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/gjmh/stage.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>stage</h2>
            
          </div>
        </div>

            <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/gjmh/seating.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>seating</h2>
            
          </div>
        </div>

            <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/gjmh/wireless%20audio%20receiver.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>wireless audio receiver</h2>
            
          </div>
        </div>

            <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/gjmh/audio%20mixing.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>Audio mixing</h2>
            
          </div>
        </div>
  
    <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/gjmh/audio.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>podium</h2>
            
          </div>
        </div>

    <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/gjmh/wireless%20mike.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>wireless mike </h2>
            
          </div>
        </div>
    <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/lsh/stage.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>stage</h2>
            
          </div>
        </div>
    <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/lsh/amplifier.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2> amplifier</h2>
            
          </div>
        </div>
    <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/lsh/audio%20mixer.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>Audio mixer </h2>
            
          </div>
        </div>
    <div className="hall-card">
          <img
            src="https://vimalacollege.edu.in/ssr2021/images/seminar/lsh/mike.jpg"
            alt="Seminar Hall"
            className="hall-image"
          />
          <div className="hall-content">
            <h2>mike</h2>
            
          </div>
        </div>


      </div>
      
      

      {/* Internal CSS */}
      <style>{`
        .hall-page {
          padding: 40px;
          background-color: #f5f7fb;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .page-title {
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 40px;
          color: #222;
        }

        .hall-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }

        .hall-card {
          background: #ffffff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hall-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
        }

        .hall-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .hall-content {
          padding: 20px;
        }

        .hall-content h2 {
          font-size: 18px;
          margin-bottom: 10px;
          color: #1a1a1a;
        }

        .hall-content p {
          font-size: 12px;
          color: #555;
          line-height: 1.6;
          margin-bottom: 15px;
        }

        .hall-parts {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .hall-parts span {
          background: #eef2ff;
          color: #2f3e9e;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 200;
        }

        @media (max-width: 600px) {
          .page-title {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
};

export default HallGallery;