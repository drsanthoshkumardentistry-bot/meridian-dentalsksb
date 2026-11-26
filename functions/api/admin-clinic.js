import handler from "../../api/admin-clinic.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
