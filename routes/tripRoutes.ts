import  express  from "express";
import * as tripController from '../controllers/tripController';

const router = express.Router();

router.post('/createFindTrip',tripController.createFindTrip);
router.post('/createTrip',tripController.createTrip);


export default router;