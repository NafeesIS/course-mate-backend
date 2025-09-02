/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import httpStatus from 'http-status';
import supertokens, { RecipeUserId, User } from 'supertokens-node';
import { errorHandler, middleware } from 'supertokens-node/framework/express';
import AccountLinking from 'supertokens-node/recipe/accountlinking';
import { AccountInfoWithRecipeId } from 'supertokens-node/recipe/accountlinking/types';
import Dashboard from 'supertokens-node/recipe/dashboard';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import Session from 'supertokens-node/recipe/session';
import { SessionContainerInterface } from 'supertokens-node/recipe/session/types';
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import UserMetadata from 'supertokens-node/recipe/usermetadata';
import UserRoles from 'supertokens-node/recipe/userroles';
import config from './app/config';
import AppError from './app/errors/AppError';
import globalErrorHandler from './app/middlewares/globalErrorHandlers';
import notFound from './app/middlewares/notFound';
import saveUserData from './app/middlewares/saveUserData';
import { generateResetPassEmailBody } from './app/modules/user/utils/generateRestPassBody';
import generateVerifyEmailBody from './app/modules/user/utils/generateVerifyEmailBody';

import { addRoleToUser } from './app/modules/user/utils/superTokenHelper';
import router from './app/routes';
import { sendEmailWithAzure } from './app/utils/notification/notification';

// Initialize SuperTokens core
supertokens.init({
  framework: 'express',
  supertokens: {
    // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
    connectionURI:
      config.FSEnvironment === 'production' && config.supertoken_connection_URI
        ? config.supertoken_connection_URI
        : 'https://st-dev-363bf550-3dec-11ef-b559-9d438cbbc8f1.aws.supertokens.io',
    apiKey:
      config.FSEnvironment === 'production' && config.supertoken_api_key
        ? config.supertoken_api_key
        : 'pWlUpckzD1LClKUNEJJ1RpoCVk',
  },
  appInfo: {
    // learn more about this on https://supertokens.com/docs/thirdpartyemailpassword/appinfo
    appName: 'FileSure',
    // apiDomain: 'http://localhost:4000',
    // websiteDomain: 'http://localhost:3000',
    apiDomain:
      config.FSEnvironment === 'production'
        ? 'https://production.filesure.in'
        : 'http://localhost:4000',
    websiteDomain:
      config.FSEnvironment === 'production' ? 'https://www.filesure.in' : 'http://localhost:3000',
    apiBasePath: '/api/v1/auth',
    websiteBasePath: '/auth',
  },
  recipeList: [
    UserMetadata.init(),
    UserRoles.init(),
    EmailVerification.init({
      mode: 'REQUIRED',
      override: {
        apis: originalImplementation => {
          return {
            ...originalImplementation,
            isEmailVerifiedGET: async function (input) {
              if (originalImplementation.isEmailVerifiedGET === undefined) {
                throw new AppError(httpStatus.BAD_REQUEST, 'verifyEmailPOST is not defined');
              }
              const response = await originalImplementation.isEmailVerifiedGET(input);
              // console.log('email verified response', response);
              // if (response.status === 'OK') {
              //   console.log('email verified response', response);
              // }
              return response;
            },
          };
        },
      },
      emailDelivery: {
        override: originalImplementation => {
          return {
            ...originalImplementation,
            sendEmail: async function (input) {
              if (input.type === 'EMAIL_VERIFICATION') {
                await sendEmailWithAzure(
                  input.user.email,
                  'Verify your Email',
                  generateVerifyEmailBody(input.emailVerifyLink, input.user.email)
                );
              } else {
                // For any other types, use the original implementation
                return originalImplementation.sendEmail(input);
              }
            },
          };
        },
      },
    }),
    EmailPassword.init({
      signUpFeature: {
        formFields: [
          {
            id: 'agreeToTerms',
          },
        ],
      },
      emailDelivery: {
        override: originalImplementation => {
          return {
            ...originalImplementation,
            sendEmail: async function (input) {
              if (input.type === 'PASSWORD_RESET') {
                await sendEmailWithAzure(
                  input.user.email,
                  'Reset your password',
                  generateResetPassEmailBody(input.passwordResetLink)
                );
              } else {
                // For any other types, use the original implementation
                return originalImplementation.sendEmail(input);
              }
            },
          };
        },
      },
      override: {
        functions: originalImplementation => {
          return {
            ...originalImplementation,
            signIn: async input => {
              const response = await originalImplementation.signIn(input);
              // console.log('from email pass log signInPOST', response);
              if (response.status === 'OK') {
                const isVerified = await EmailVerification.isEmailVerified(
                  response.recipeUserId,
                  response.user.emails[0]
                );

                await saveUserData(response.user, {}, isVerified);
              }
              return response;
            },

            signUp: async function (input) {
              const response = await originalImplementation.signUp(input);
              // console.log('from signup post', response);
              if (response.status === 'OK') {
                await addRoleToUser(response.user.id, 'user');
                const isVerified = await EmailVerification.isEmailVerified(
                  response.recipeUserId,
                  response.user.emails[0]
                );
                // save user data to mongodb
                await saveUserData(response.user, {}, isVerified);
              }
              return response;
            },
          };
        },
      },
    }),
    Dashboard.init(),
    ThirdParty.init({
      override: {
        functions: originalImplementation => {
          return {
            ...originalImplementation,

            // override the thirdparty sign in / up function
            signInUp: async function (input) {
              // TODO: Some pre sign in / up logic

              const response = await originalImplementation.signInUp(input);

              if (response.status === 'OK') {
                // TODO: Some post sign in / up logic
                // console.log('from third party sign in up', response);
                // save user data to mongodb
                await addRoleToUser(response.user.id, 'user');
                await saveUserData(response.user, response.rawUserInfoFromProvider);
                // console.log('response', response);
                // const firstName = response.rawUserInfoFromProvider.fromUserInfoAPI!['first_name'];
                // console.log(accessToken);
                if (input.session === undefined) {
                  if (response.createdNewRecipeUser && response.user.loginMethods.length === 1) {
                    // TODO: some post sign in logic
                  } else {
                    // TODO: some post sign in logic
                  }
                }
              }

              return response;
            },
          };
        },
      },
      // We have provided you with development keys which you can use for testing.
      // IMPORTANT: Please replace them with your own OAuth keys for production use.
      signInAndUpFeature: {
        providers: [
          {
            config: {
              thirdPartyId: 'google',
              clients: [
                {
                  //production key Filesure GCP Main
                  clientId:
                    '272767554507-5im8tqh146qkig0v4khudkplpftt3d90.apps.googleusercontent.com',
                  clientSecret: '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',
                  // clientId:
                  //   '1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com',
                  // clientSecret: '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',
                },
              ],
            },
          },
          {
            config: {
              thirdPartyId: 'github',
              clients: [
                {
                  clientId: '467101b197249757c71f',
                  clientSecret: 'e97051221f4b6426e8fe8d51486396703012f5bd',
                },
              ],
            },
          },
          {
            config: {
              thirdPartyId: 'apple',
              clients: [
                {
                  clientId: '4398792-io.supertokens.example.service',
                  additionalConfig: {
                    keyId: '7M48Y4RYDL',
                    privateKey:
                      '-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgu8gXs+XYkqXD6Ala9Sf/iJXzhbwcoG5dMh1OonpdJUmgCgYIKoZIzj0DAQehRANCAASfrvlFbFCYqn3I2zeknYXLwtH30JuOKestDbSfZYxZNMqhF/OzdZFTV0zc5u5s3eN+oCWbnvl0hM+9IW0UlkdA\n-----END PRIVATE KEY-----',
                    teamId: 'YWQCXGJRJL',
                  },
                },
              ],
            },
          },
        ],
      },
    }),
    AccountLinking.init({
      shouldDoAutomaticAccountLinking: async (
        newAccountInfo: AccountInfoWithRecipeId & { recipeUserId?: RecipeUserId },
        user: User | undefined,
        session: SessionContainerInterface | undefined,
        tenantId: string,
        userContext: any
      ) => {
        if (session !== undefined) {
          return {
            shouldAutomaticallyLink: false,
          };
        }
        if (newAccountInfo.recipeUserId !== undefined && user !== undefined) {
          const userId = newAccountInfo.recipeUserId.getAsString();
          const hasInfoAssociatedWithUserId = false; // TODO: add your own implementation here.
          if (hasInfoAssociatedWithUserId) {
            return {
              shouldAutomaticallyLink: false,
            };
          }
        }
        return {
          shouldAutomaticallyLink: true,
          shouldRequireVerification: true,
        };
      },
    }),
    Session.init({
      cookieSecure: true,
    }), // initializes session features
  ],
});

const app: Application = express();

// Define allowed domains
const allowedDomainsLocal = [
  'http://localhost:4000',
  'http://localhost:3000',
  'https://filesure.in',
  'https://www.filesure.in',
  'https://marketing-lead.filesure.in',
  'https://production.filesure.in',
  //add more domains here
];

const allowedDomainsProduction = [
  'https://production.filesure.in',
  'https://filesure.in',
  'https://www.filesure.in',
  'https://marketing-lead.filesure.in',
  //add more domains here
];

const allowedDomains =
  config.FSEnvironment === 'production' ? allowedDomainsProduction : allowedDomainsLocal;

// CORS configuration for main app routes
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check if the origin is in the allowed domains
      if (allowedDomains.includes(origin)) {
        return callback(null, true);
      }

      // Reject requests from other domains
      return callback(new Error('Not allowed by CORS'), false);
    },
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  })
);

// CORS configuration for public API
app.use(
  '/api/v1/companies/public',
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check if the origin is in the allowed domains
      if (allowedDomains.includes(origin)) {
        return callback(null, true);
      }

      // For API requests, we'll allow any origin but require API key
      return callback(null, true);
    },
    allowedHeaders: ['content-type', 'x-api-key'],
    methods: ['GET'],
  })
);

//parsers
app.use(express.json());

// Health Check Route For AWS
const healthCheck = (req: Request, res: Response) => {
  res.status(200).send({
    success: true,
    message: 'Application is up and running.',
  });
};
app.get('/', healthCheck);

// Super token auth middleware
app.use(middleware());

// Application routes
app.use('/api/v1', router);

// SuperToken error handler
app.use(errorHandler());

//global error handler
app.use(globalErrorHandler);

//Not Found
app.use(notFound);

export default app;
