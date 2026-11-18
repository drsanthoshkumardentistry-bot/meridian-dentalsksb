import handler from "../../api/announcement.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
