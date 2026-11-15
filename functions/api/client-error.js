import handler from "../../api/client-error.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
