import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Try1 from './component/Try1';
import HallDetails from './component/HallDetails'; 
import Calender from './component/Calender';
import HallBookingForm from './component/HallBookingForm'
import AllBookings from './component/AllBookings';
import Signup from './component/Signup';
import Login from './component/Login';
import TotalBooking from './component/TotalBooking';
import BookingDetails from './component/BookingDetails'
import ApprovedBooking from './component/ApprovedBooking';
import PendingRequest from './component/PendingRequest';
import CancelledBooking from './component/CancelledBooking';
import MyBookings from './component/MyBookings';
import CompleteBooking from './component/CompleteBooking';
import AdminCalendar from './component/AdminCalender';
import Help from './Pages/Help';
import Reports from './Pages/Reports';
import HallGallery from "./component/HallGallery";
function App() {
  const [count, setCount] = useState(0);

  return (
      <> 
    <Router>
      <Routes>
        {/* <Route path='/hall' element={<HallAvailability/>}/> */}
        <Route path='/booking-details/:id' element={<BookingDetails/>}/>
        <Route path='/my-bookings' element={<MyBookings/>}/>
        <Route path='/home' element={<Try1/>}/>
         <Route path="/hall/:id" element={<HallDetails />} />
        <Route path='/h' element={<Calender/>}/>
        <Route path='/f' element={<HallBookingForm/>}/>
        <Route path='/signup' element={<Signup/>}/>
        <Route path='/' element={<Login/>}/>
        <Route path="/all-bookings" element={<AllBookings />} />
         <Route path='/admin' element={<AdminCalendar/>}/>
        <Route path='/tot' element={<TotalBooking />}/>
        <Route path='/app' element={<ApprovedBooking />}/>
        <Route path='/pend' element={<PendingRequest />}/>
        <Route path='/can' element={<CancelledBooking />}/>
         <Route path='/comp' element={<CompleteBooking />}/>
          <Route path='/help' element={<Help/>}/>
          <Route path='/reports' element={<Reports/>}/>
           <Route path="/hall-gallery" element={<HallGallery />} />
      </Routes>
    </Router>
 

</>
  );
}

export default App;