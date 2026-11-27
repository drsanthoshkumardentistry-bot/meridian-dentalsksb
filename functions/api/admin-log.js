import handler from "../../api/admin-log.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
