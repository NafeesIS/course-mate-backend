import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import config from "./index";

supertokens.init({
  framework: "express",
  supertokens: {
    connectionURI: config.supertoken_connection_URI!,
    apiKey: config.supertoken_api_key,
  },
  appInfo: {
    appName: "Course Mate",
    apiDomain: `http://localhost:${config.port}`,   // backend API
    websiteDomain: "http://localhost:3000",        // frontend
    apiBasePath: "/auth",
    websiteBasePath: "/auth",
  },
  recipeList: [
    EmailPassword.init(),
    Session.init(),
    ThirdParty.init({
      signInAndUpFeature: {
        providers: [
          {
            config: {
              thirdPartyId: "google",
              clients: [
                {
                  clientId: '553517449908-b6aqmrhu7gs034lc6cg3931tfo0c9njb.apps.googleusercontent.com',
                  clientSecret: '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',
                },
              ],
            },
          },
        ],
      },
    }),
  ],
});
