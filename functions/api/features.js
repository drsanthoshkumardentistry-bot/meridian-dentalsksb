import handler from "../../api/features.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
