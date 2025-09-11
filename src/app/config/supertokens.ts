import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import config from "./index";
import { UserModel } from "../modules/user/user.model";

supertokens.init({
  framework: "express",
  supertokens: {
    connectionURI: config.supertoken_connection_URI!,
    apiKey: config.supertoken_api_key,
  },
  appInfo: {
    appName: "Course Mate",
    apiDomain: `http://localhost:${config.port}`,
    websiteDomain: "http://localhost:3000",
    apiBasePath: "/auth",
    websiteBasePath: "/auth",
  },
  recipeList: [
    // Email Password
    EmailPassword.init({
      override: {
        apis: (originalImplementation) => {
          return {
            ...originalImplementation,
            signUpPOST: async function (input) {
              let response = await originalImplementation.signUpPOST!(input);
              if (response.status === "OK") {
                // Save to database
                await UserModel.create({
                  email: response.user.emails[0],
                  supertokensId: response.user.id,
                  role: "user",
                });
              }
              return response;
            },
          };
        },
      },
    }),
    
    // Google
    ThirdParty.init({
      signInAndUpFeature: {
        providers: [
          {
            config: {
              thirdPartyId: "google",
              clients: [
                {
                  clientId: config.google_client_id!,
                  clientSecret: config.google_client_secret!,
                },
              ],
            },
          },
        ],
      },
      override: {
        apis: (originalImplementation) => {
          return {
            ...originalImplementation,
            signInUpPOST: async function (input) {
              let response = await originalImplementation.signInUpPOST!(input);
              if (response.status === "OK" && response.createdNewRecipeUser) {
                // Save to database
                await UserModel.create({
                  email: response.user.emails[0],
                  supertokensId: response.user.id,
                  role: "user",
                });
              }
              return response;
            },
          };
        },
      },
    }),
    
    Session.init(),
  ],
});