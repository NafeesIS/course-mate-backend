import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import UserRoles from "supertokens-node/recipe/userroles";
import EmailVerification from "supertokens-node/recipe/emailverification";
import config from "./index";
import saveUserData from "../utils/saveUserData";
import { addRoleToUser } from "../utils/superTokenHelper";

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
    // User Roles
    UserRoles.init(),
    
    // Email Verification
    EmailVerification.init({
      mode: 'REQUIRED',
    }),
    
    // Email Password
    EmailPassword.init({
      override: {
        functions: (originalImplementation) => {
          return {
            ...originalImplementation,
            signUp: async function (input) {
              const response = await originalImplementation.signUp(input);
              
              if (response.status === "OK") {
                // Add default user role
                await addRoleToUser(response.user.id, 'user');
                
                // Save to database
                await saveUserData(response.user, {}, false);
              }
              
              return response;
            },
            signIn: async function (input) {
              const response = await originalImplementation.signIn(input);
              
              if (response.status === "OK") {
                // Update last login and save user data
                await saveUserData(response.user, {}, response.user.emails[0]);
              }
              
              return response;
            },
          };
        },
      },
    }),
    
    // Google OAuth
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
        functions: (originalImplementation) => {
          return {
            ...originalImplementation,
            signInUp: async function (input) {
              const response = await originalImplementation.signInUp(input);
              
              if (response.status === "OK") {
                // Add default user role for new users
                if (response.createdNewRecipeUser) {
                  await addRoleToUser(response.user.id, 'user');
                }
                
                // Save to database with raw user info from provider
                await saveUserData(response.user, response.rawUserInfoFromProvider, true);
              }
              
              return response;
            },
          };
        },
      },
    }),
    
    Session.init({
      cookieSecure: config.NODE_ENV === 'production',
    }),
  ],
});