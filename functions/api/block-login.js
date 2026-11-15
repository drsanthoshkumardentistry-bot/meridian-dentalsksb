import handler from "../../api/block-login.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
