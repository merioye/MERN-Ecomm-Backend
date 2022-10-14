require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const dbConnection = require('./utils/dbConnection');
const errorHandler = require('./middlewares/errorHandler');
require('./config/passport');


const port = process.env.PORT || 8000; 
const corsOptions ={
  origin:process.env.CLIENT_APP_URL, 
  credentials:true,            
  optionSuccessStatus:200
}
const app = express();  
dbConnection();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions))


// routes
app.use('/api', require('./routes'));

// error handler
app.use(errorHandler);


app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
})