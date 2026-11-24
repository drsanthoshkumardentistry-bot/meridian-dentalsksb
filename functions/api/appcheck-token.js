import handler from "../../api/appcheck-token.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
