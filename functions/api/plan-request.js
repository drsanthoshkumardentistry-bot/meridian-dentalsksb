import handler from "../../api/plan-request.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
