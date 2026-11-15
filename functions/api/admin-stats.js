import handler from "../../api/admin-stats.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
