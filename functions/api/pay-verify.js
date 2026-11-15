import handler from "../../api/pay-verify.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
