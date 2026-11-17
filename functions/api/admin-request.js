import handler from "../../api/admin-request.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
