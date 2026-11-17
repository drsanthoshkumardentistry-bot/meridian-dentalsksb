import handler from "../../api/heartbeat.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
