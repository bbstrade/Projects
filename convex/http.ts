import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Mount auth HTTP routes
auth.addHttpRoutes(http);

export default http;
