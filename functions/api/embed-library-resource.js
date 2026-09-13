import embedLibraryResourceHandler from "../../api/embed-library-resource.js";
import { runNodeHandler } from "../_node-handler-adapter.js";

export function onRequest(context) {
  return runNodeHandler(embedLibraryResourceHandler, context);
}
