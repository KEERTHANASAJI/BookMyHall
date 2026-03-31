const mongoose=require('mongoose');


// mongoose.connect('mongodb+srv://Keerthana:keerthana@cluster0.cqz16.mongodb.net/vimala1?retryWrites=true&w=majority&appName=Cluster0')
mongoose.connect('mongodb+srv://hallbookingpro25:project@cluster-1.camejnh.mongodb.net/bookings?appName=Cluster-1')
.then(()=>console.log('connected'))
.catch((err)=>console.log(err))