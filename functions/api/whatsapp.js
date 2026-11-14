import handler from "../../api/whatsapp.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
