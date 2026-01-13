require("dotenv").config();
const app=require("./src/app");
const {connectDB,sequelize}=require("./src/config/database")

// importing models
require("./src/models/User");
require("./src/models/Wallet");
require("./src/models/AuditLogs");
require("./src/models/Transaction")

const port=process.env.PORT || 5000;

const start=async()=>{
    await connectDB();
    await sequelize.sync();
        app.listen(port, () => {
          console.log(`Server is running at http://localhost:${port}`);
        });
}

start();
