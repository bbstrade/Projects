import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Mount auth HTTP routes
authComponent.registerRoutes(http, createAuth);

export default http;
