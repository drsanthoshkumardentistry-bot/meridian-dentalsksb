import handler from "../../api/csp-report.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
