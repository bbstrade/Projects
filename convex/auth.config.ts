

export default {
    providers: [
        {
            domain: "http://localhost:3000",
            applicationID: "convex",
        },
        {
            domain: "https://aromatic-husky-535.convex.cloud",
            applicationID: "convex",
        },
        {
            domain: process.env.SITE_URL || "https://projects-bbstrade.vercel.app",
            applicationID: "convex",
        },
    ],
};



