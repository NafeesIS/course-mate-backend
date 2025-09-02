/* eslint-disable @typescript-eslint/no-explicit-any */
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
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
import globalErrorHandler from './app/middlewares/globalErrorHandlers';
import notFound from './app/middlewares/notFound';
import saveUserData from './app/middlewares/saveUserData';
import { addRoleToUser } from './app/modules/user/utils/superTokenHelper';
import router from './app/routes';

// ================= SuperTokens Init ==================
supertokens.init({
  framework: 'express',
  supertokens: {
    connectionURI:
      config.FSEnvironment === 'production' && config.supertoken_connection_URI
        ? config.supertoken_connection_URI
        : 'https://try.supertokens.com', // demo instance
    apiKey:
      config.FSEnvironment === 'production' && config.supertoken_api_key
        ? config.supertoken_api_key
        : 'demo-api-key',
  },
  appInfo: {
    appName: 'CourseMate',
    apiDomain: 'http://localhost:4000',
    websiteDomain: 'http://localhost:3000',
    apiBasePath: '/api/v1/auth',
    websiteBasePath: '/auth',
  },
  recipeList: [
    UserMetadata.init(),
    UserRoles.init(),
    EmailVerification.init({
      mode: 'REQUIRED',
    }),
    EmailPassword.init({
      signUpFeature: {
        formFields: [{ id: 'agreeToTerms' }],
      },
      override: {
        functions: originalImplementation => ({
          ...originalImplementation,
          signIn: async input => {
            const response = await originalImplementation.signIn(input);
            if (response.status === 'OK') {
              const isVerified = await EmailVerification.isEmailVerified(
                response.recipeUserId,
                response.user.emails[0]
              );
              await saveUserData(response.user, {}, isVerified);
            }
            return response;
          },
          signUp: async input => {
            const response = await originalImplementation.signUp(input);
            if (response.status === 'OK') {
              await addRoleToUser(response.user.id, 'user');
              const isVerified = await EmailVerification.isEmailVerified(
                response.recipeUserId,
                response.user.emails[0]
              );
              await saveUserData(response.user, {}, isVerified);
            }
            return response;
          },
        }),
      },
    }),
    Dashboard.init(),
    ThirdParty.init({
      signInAndUpFeature: {
        providers: [
          {
            config: {
              thirdPartyId: 'google',
              clients: [
                {
                  clientId: 'your-google-client-id',
                  clientSecret: 'your-google-client-secret',
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
        session: SessionContainerInterface | undefined
      ) => {
        if (session !== undefined) return { shouldAutomaticallyLink: false };
        return { shouldAutomaticallyLink: true, shouldRequireVerification: true };
      },
    }),
    Session.init({ cookieSecure: false }),
  ],
});

// ================= Express App ==================
const app: Application = express();

// Allowed only localhost domains
const allowedDomains = ['http://localhost:4000', 'http://localhost:3000'];

// CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedDomains.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    },
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  })
);

// Parsers
app.use(express.json());

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.status(200).send({ success: true, message: 'Application is up and running.' });
});

// SuperTokens middleware
app.use(middleware());

// Routes
app.use('/api/v1', router);

// SuperTokens error handler
app.use(errorHandler());

// Global error handler
app.use(globalErrorHandler);

// Not Found
app.use(notFound);

export default app;
