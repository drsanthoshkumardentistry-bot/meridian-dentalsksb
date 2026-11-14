import handler from "../../api/ai.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
