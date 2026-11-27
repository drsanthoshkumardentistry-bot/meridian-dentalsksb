import handler from "../../api/admin-notes.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
