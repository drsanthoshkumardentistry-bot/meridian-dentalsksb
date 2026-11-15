import handler from "../../api/delete-account.js";
import { adapt } from "../_adapt.js";

export const onRequest = adapt(handler);
