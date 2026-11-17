import handler from "../../api/admin-overview.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
