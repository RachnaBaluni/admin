const express = require("express");
const connectDB = require("./Database/connectDB.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = [
  "https://frontend1-liart-theta.vercel.app",
  "https://adminn-ebon.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin || allowedOrigins.includes(origin)){
      return callback(null,true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials:true
}));

// Routes
app.use("/api/player/", require("./Route/Player.route.js"));
app.use("/api/events/", require("./Route/Event.route.js"));
app.use("/api/main-events/", require("./Route/MainEvent.route.js"));
app.use("/api/tournament-details/", require("./Route/TournamentDetail.route.js"));
app.use("/api/prices-benifit/", require("./Route/PricesBenifit.route.js"));
app.use("/api/venue/", require("./Route/Venue.route.js"));
app.use("/api/admin/", require("./Route/Admin.route.js"));
app.use("/api/member/", require("./Route/Member.route.js"));
app.use("/api/team/", require("./Route/Team.route.js"));
app.use("/api/nissan-draws/", require("./Route/Nissan_Draws.route.js"));

const PORT = process.env.PORT || 3002;

// Start Server
connectDB().then(() => {
 app.listen(PORT,"0.0.0.0",()=>{
   console.log(`Server running on ${PORT}`);
   console.log("Allowed origins:", allowedOrigins);
 });
});

// Error Handler
app.use((err,req,res,next)=>{
 console.error(err);
 res.status(500).json({
   error:"Internal Server Error",
   details:err.message
 });
});