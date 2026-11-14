import handler from "../../api/login-alert.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
