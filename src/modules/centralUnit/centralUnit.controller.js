import { sendAccidentSchema, receiveAccidentSchema } from "./centralUnit.validators.js";
import { enforceCentralUnitInboundAuth } from "./centralUnit.inboundAuth.js";

export function createCentralUnitController({ centralUnitService }) {
  return {
    sendAccidentToCentralUnitHandler: async (req, res, next) => {
      try {
        const body = sendAccidentSchema.parse(req.body);
        const result = await centralUnitService.sendAccidentToCentralUnit(body);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    receiveAccidentFromCentralUnitHandler: async (req, res, next) => {
      try {
        enforceCentralUnitInboundAuth(req);
        const body = receiveAccidentSchema.parse(req.body);
        const result = await centralUnitService.receiveAccidentFromCentralUnit(body);
        res.status(202).json(result);
      } catch (err) {
        next(err);
      }
    },
  };
}

