import handler from "../../api/pay-seal.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
