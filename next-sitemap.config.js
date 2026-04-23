/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://compendium.app",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: ["/", "/topic/"],
        disallow: ["/api/", "/dashboard/", "/login", "/signup"],
      },
    ],
  },
  exclude: ["/api/*", "/dashboard/*", "/login", "/signup"],
};