import handler from "../../api/admin-plan.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
