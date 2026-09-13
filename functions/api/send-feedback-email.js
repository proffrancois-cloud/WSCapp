import sendFeedbackEmailHandler from "../../api/send-feedback-email.js";
import { runNodeHandler } from "../_node-handler-adapter.js";

export function onRequest(context) {
  return runNodeHandler(sendFeedbackEmailHandler, context);
}
