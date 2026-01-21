require("dotenv").config();
const app=require("./src/app");
const {connectDB,sequelize}=require("./src/config/database")

// importing models
require("./src/models");

const port=process.env.PORT || 5000;

const start=async()=>{
    await connectDB();
    await sequelize.sync({alter:true}); //alter:true
        app.listen(port, () => {
          console.log(`Server is running at http://localhost:${port}`);
        });
}

start();
