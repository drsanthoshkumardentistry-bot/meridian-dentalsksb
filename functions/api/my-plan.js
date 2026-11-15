import handler from "../../api/my-plan.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
