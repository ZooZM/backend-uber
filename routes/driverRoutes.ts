import  express  from "express";
import * as driverController from '../controllers/driverController';
const router = express.Router();

router.get('/setDriverOnline',driverController.setDriverOnline);

export default router;